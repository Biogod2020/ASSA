# Design Spec: Remove distill_pending MCP & Consolidate to Distiller Sub-agent

**Goal:** Eliminate the redundant and low-quality `distill_pending` MCP tool, ensuring all architectural distillation follows the V3.5 Weaver standard (Frontmatter, RCA, ID normalization) via the Distiller sub-agent.

## Context & Rationale
- **Redundancy:** We have two ways to process L1 signals: a pure JS function (MCP) and an LLM-powered sub-agent (Distiller).
- **Quality Gap:** The MCP tool produces simple, non-standard text patterns. The Distiller produces high-quality V3.5 patterns with mandatory Frontmatter and ID normalization.
- **Maintenance:** Maintaining two different distillation logics leads to "junk" in memory and increased system complexity.

## Proposed Changes

### 1. Tool Removal (MCP Server)
- **File:** `hooks/mcpServer.js`
- **Action:** 
    - Remove the `distill_pending` tool definition from the `list_tools` response.
    - Remove the `else if (name === 'distill_pending')` block from the `tools/call` handler.
    - Ensure `request_global_promotion` and other tools do not reference the old tool.

### 2. Prompt Instruction Updates
- **File:** `hooks/beforeAgentHook.js`
    - Update the `### L1 PENDING SIGNALS` section to remove the `(use distill_pending tool...)` hint.
    - Explicitly direct the agent to dispatch the Distiller sub-agent via `generalist`.
- **File:** `GEMINI.md` (and global `~/.gemini/GEMINI.md` if applicable)
    - Remove the "1-4 PENDING" rule.
    - Consolidate all PENDING processing into a single rule: "If PENDING signals exist, ALWAYS dispatch Distiller".

### 3. Skill Refinement
- **Files:** `skills/assa-core/SKILL.md` and `skills/assa-core/DISTILLER_SKILL.md`
    - Remove all mentions of `distill_pending`.
    - Strengthen instructions for V3.5 compliance.

### 4. Data Cleanup (Memory)
- **File:** `.memory/patterns.md`
    - Identify and rewrite non-standard patterns (those without Frontmatter) into the standard V3.5 format.
    - Use the Distiller sub-agent itself to perform this cleanup after the logic is updated.

## Verification Plan
1. **Tool Check:** Run `/mcp list` (or equivalent) to ensure `distill_pending` is gone.
2. **Prompt Check:** Verify the new instructions appear in the session context.
3. **End-to-End Test:** 
    - Create a new signal via `submit_memory_signal`.
    - Trigger the Distiller sub-agent.
    - Verify the resulting pattern in `patterns.md` follows the V3.5 Frontmatter standard.
