# ASSA Reflex System Refactoring (v3.3)

## 1. Overview
The current ASSA Reflex system in `beforeAgentHook.js` and `mcpServer.js` is fragile and drops critical context during the L1 encoding phase. This refactoring aims to make the reflex triggers more robust (ignoring read-only tools, semantic praise detection, sliding window for barriers) and to dramatically increase the information density of L1 memory signals by enforcing a structured schema.

## 2. Architecture & Data Flow

### 2.1 Tool Filtering & Status Tracking
- **Read-Only Tools:** `read_file`, `list_directory`, `grep_search`, `glob` will be explicitly ignored in the state tracking array.
- **State-Mutating Tools:** `run_shell_command`, `write_file`, `replace` will be tracked.
- **Status Evaluation:** Success/Failure will be determined by parsing `ASSA_METADATA` or tool result exit codes.

### 2.2 Trigger Conditions
- **Semantic Praise Detection:** 
  - Instead of strict array matching, we will expand the regex to catch semantic variations of praise (e.g., "有道理", "我认可", "就是这样").
  - The Prompt itself will carry an instruction to the AI to trust its own semantic understanding.
- **Isomorphic Victory Detection:**
  - A Victory is triggered when a state-mutating tool $T_A$ fails, followed by successful executions of state-mutating tools, culminating in $T_A$ succeeding.
- **Sliding Window Barrier Detection:**
  - Track the last 5 state-mutating tool executions. If $\ge 3$ are failures, trigger a Barrier RCA.

### 2.3 MCP Schema Upgrade (The "Three-Part" Context)
To prevent the AI from generating "dry" summaries, the `submit_memory_signal` input schema will be modified:
- Remove the generic `context` field.
- Introduce:
  - `raw_symptom` (String): The original error log or symptom.
  - `failed_attempts` (String): The dead ends explored.
  - `breakthrough_diff` (String): The exact code/command difference that solved it.
  - `rule` (String): The generalized architectural lesson.
- In `mcpServer.js`, these fields will be concatenated into a rich `context` string before writing to `evolution_ledger.json` to maintain backward compatibility with the `distiller`.

## 3. Implementation Plan
1. **Modify `hooks/mcpServer.js`**: Update the JSON schema for `submit_memory_signal` and how it constructs the payload.
2. **Modify `hooks/beforeAgentHook.js`**: Implement tool filtering, sliding window logic, and semantic praise regex. Update the injected prompt text to instruct the AI on using the new schema.
3. **Test**: Run mock sequences simulating failures and successes to verify the hook logic triggers correctly.
