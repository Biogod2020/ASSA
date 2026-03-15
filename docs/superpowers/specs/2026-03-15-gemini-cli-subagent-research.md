# Gemini CLI Subagent Architecture & Implementation Research

**Date:** 2026-03-15
**Context:** Researching how to implement Subagent-Driven Development in Gemini CLI to resolve ASSA V3 Hook Recursion and Timeout issues.
**Sources:**
1. `obra/superpowers` GitHub Repository
2. `google-gemini/gemini-cli` Official GitHub Repository (v1.x)

---

## 1. Executive Summary

Based on a deep code analysis of both the official Gemini CLI and the popular `superpowers` extension, the conclusion is clear:
**Gemini CLI natively supports Subagents, but the feature is currently experimental and disabled by default.**

The official implementation is elegant: it wraps an entire Agent execution loop into a standard Declarative Tool (`SubagentToolWrapper`). When the Main Agent calls this tool, a completely isolated `LocalAgentExecutor` spins up, does its own reasoning loop, and returns the result via a mandatory `complete_task` tool call.

Conversely, the `obra/superpowers` project **does not** inject or hack a subagent implementation into Gemini CLI. Instead, it relies on a "graceful degradation" strategy: if the host environment doesn't have subagents (like Gemini CLI in its default state), it falls back to a single-session sequential plan execution (`executing-plans` skill) and warns the user.

For ASSA V3.2, attempting to spawn sub-processes via Hooks (`spawnSync('gemini')`) is an anti-pattern that directly fights the CLI's internal architecture, leading to infinite recursion and timeouts. The correct path is to leverage the official (albeit experimental) `enableAgents` flag or rely on pure-function MCP tools.

---

## 2. Analysis of `obra/superpowers`

The `superpowers` library is heavily centered around the `subagent-driven-development` skill, which dictates spawning isolated agents for specific tasks (e.g., implementation, spec review, code quality review).

### How it handles Gemini CLI:
1.  **Tool Mapping Fallback:** In `skills/using-superpowers/references/gemini-tools.md`, it explicitly states:
    > `Task` tool (dispatch subagent) | No equivalent — Gemini CLI does not support subagents
2.  **Graceful Degradation:** When executing a plan, if the harness lacks subagents, the prompts instruct the LLM to fallback to `superpowers:executing-plans` (a single-thread loop) instead of `superpowers:subagent-driven-development`.
3.  **No Process Hacks:** The extension's Node.js hooks (`hooks/`) only do context injection. They **do not** attempt to spawn separate CLI processes.

**Lesson for ASSA:** Do not try to force subagents via OS-level process spawning inside Hooks.

---

## 3. How Google Implemented Subagents in Gemini CLI

Despite what `superpowers` assumes, the official Gemini CLI source code (`packages/core/src/agents/`) contains a fully-fledged, native Subagent architecture.

### 3.1 The Architecture

1.  **Agent Definition (`AgentDefinition`)**:
    Agents are defined with a specific JSON schema for inputs (`inputConfig.inputSchema`) and optionally outputs (`outputConfig`). They have their own system prompts, tools, and model configs.
2.  **Tool Wrapping (`SubagentToolWrapper` & `SubagentTool`)**:
    Instead of a special `/dispatch` command, subagents are exposed to the Main Agent as standard tools.
    *   The `SubagentTool` class extends `BaseDeclarativeTool`.
    *   The tool's parameters are dynamically mapped from the Agent's `inputSchema`.
3.  **Isolated Execution (`LocalAgentExecutor`)**:
    When the Main Agent calls a subagent tool (e.g., `call:codebase_investigator{...}`):
    *   A new `GeminiChat` instance is created with `kind: 'subagent'`. This ensures the subagent's thought process is isolated and doesn't pollute the Main Agent's history.
    *   A `LocalAgentExecutor` starts an independent `run()` loop.
4.  **Completion (`complete_task` tool)**:
    The CLI forcibly injects a special tool named `complete_task` into the subagent's tool list. The subagent loop will continue running until the LLM explicitly calls `complete_task` to return its findings back to the Main Agent.
5.  **Streaming UI (`SubagentProgressDisplay`)**:
    As the subagent thinks and uses tools, it emits `SubagentActivityEvent`s. The CLI UI catches these and renders a collapsible spinner block (e.g., `💭 Thinking...`, `⠋ run_shell_command`).

### 3.2 The `enableAgents` Flag

This entire system is gated behind an experimental configuration flag.

File: `packages/cli/src/config/settingsSchema.ts`
```typescript
enableAgents: {
  type: 'boolean',
  label: 'Enable Agents',
  category: 'Experimental',
  requiresRestart: true,
  default: false,
  description: 'Enable local and remote subagents. Warning: Experimental feature, uses YOLO mode for subagents'
}
```
*Note: Because subagents run autonomously inside their loop, they operate in "YOLO mode" (bypassing confirmation prompts for safe tools).*

### 3.3 Built-in Subagents

If `enableAgents` is true (or specifically overridden), Gemini CLI registers three built-in subagents:
1.  `codebase_investigator`: For deep architectural analysis.
2.  `cli_help`: For querying CLI documentation.
3.  `generalist`: A general-purpose AI agent with access to all tools (useful for batch refactoring).

---

## 4. How to Use Subagents in Gemini CLI

### Step 1: Enable the Feature
You must explicitly enable the experimental agents feature in your Gemini CLI settings.

1. Run the interactive settings command:
   ```bash
   gemini /settings
   ```
2. Navigate to **Experimental** -> **Enable Agents** and toggle it to **Enabled**.
3. *Alternatively*, manually edit `~/.gemini/settings.json`:
   ```json
   {
     "experimental": {
       "enableAgents": true
     }
   }
   ```

### Step 2: Use Built-in Subagents
Once enabled, the Main Agent will have access to tools like `generalist` and `codebase_investigator`. You can explicitly ask the Main Agent to delegate:

**User Prompt:**
> "Please use the generalist subagent to find all occurrences of 'foo' and replace them with 'bar' across the codebase, while I stay in this main thread."

The Main Agent will output a tool call:
```json
call:generalist{"request": "Find 'foo' and replace with 'bar' in src/"}
```
The CLI UI will show a spinner while the subagent works in the background.

### Step 3: Registering Custom Subagents (For Extension Developers)
*(Note: This API is internal and subject to change, but this is how extensions currently register them)*

Extensions can provide an `agents` array in their exported config, containing objects that conform to `AgentDefinition`.
```typescript
import { Type } from '@google/genai';

export const myCustomAgent = {
  kind: 'local',
  name: 'my_custom_agent',
  description: 'Does a specific isolated task',
  inputConfig: {
    inputSchema: {
      type: Type.OBJECT,
      properties: { task: { type: Type.STRING } }
    }
  },
  promptConfig: {
    systemPrompt: 'You are a specialized agent...'
  },
  // ... runConfig, modelConfig, etc.
};
```

---

## 5. Strategic Recommendations for ASSA V3.2

Given this research, the ASSA architecture must adapt as follows:

1.  **Abolish `spawnSync('gemini')`**: Never use OS-level process spawning inside Hooks. It circumvents the CLI's session management, breaks the `AbortSignal` chain, and causes the 60s hook timeouts and infinite loops you experienced on 2026-03-14.
2.  **Primary Strategy (Pure MCP)**: Continue the path established on 2026-03-15. Move heavy logic out of Hooks. Hooks should only read L1/L2/L3 state and inject text into the prompt. Distillation logic should be a pure-function MCP tool (`distill_pending`) that the Main Agent calls sequentially.
3.  **Advanced Strategy (Native Subagents)**: If ASSA requires complex, multi-step LLM reasoning for Distillation without polluting the main history, you should instruct the user to set `experimental.enableAgents = true`, and then instruct the Main Agent to delegate the distillation task to the built-in `generalist` subagent via a tool call.
