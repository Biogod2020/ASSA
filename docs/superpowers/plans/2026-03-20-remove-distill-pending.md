# Remove distill_pending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all distillation logic into the Distiller sub-agent by removing the `distill_pending` MCP tool and updating all references.

**Architecture:** Immediate cutover to Distiller-only mode. Update MCP server, hooks, and documentation.

**Tech Stack:** Node.js (MCP Server), Markdown (Patterns & Skills).

---

### Task 1: MCP Server Refactoring

**Files:**
- Modify: `hooks/mcpServer.js`

- [ ] **Step 1: Remove tool definition**
    Remove the `distill_pending` tool from the `list_tools` array (lines 57-65).
- [ ] **Step 2: Remove tool handler**
    Remove the `else if (name === 'distill_pending')` block (lines 135-163).
- [ ] **Step 3: Update promotion instruction**
    Update the `request_global_promotion` response (lines 165-171) to ensure it only recommends the sub-agent approach.
- [ ] **Step 4: Verify syntax**
    Run: `node -c hooks/mcpServer.js`
    Expected: No syntax errors.

### Task 2: Prompt Instruction Update

**Files:**
- Modify: `hooks/beforeAgentHook.js`
- Modify: `GEMINI.md`
- Modify: `~/.gemini/GEMINI.md` (Check for existence)

- [ ] **Step 1: Update Hook hint**
    In `hooks/beforeAgentHook.js`, remove the `(use distill_pending tool...)` text.
- [ ] **Step 2: Update local GEMINI.md**
    Remove the "1-4 PENDING" rule from `GEMINI.md`.
    Update the "≥ 5 PENDING" rule to "Any PENDING | Dispatch Distiller".
- [ ] **Step 3: Update global GEMINI.md**
    Perform the same update in `~/.gemini/GEMINI.md`.

### Task 3: Skill Cleanup

**Files:**
- Modify: `skills/assa-core/SKILL.md`
- Modify: `skills/assa-core/DISTILLER_SKILL.md`

- [ ] **Step 1: Remove MCP mentions**
    Search and remove all mentions of the `distill_pending` tool in both skill files.
- [ ] **Step 2: Strengthen Distiller SOP**
    Ensure the `assa-distiller` skill explicitly mandates V3.5 Frontmatter.

### Task 4: Memory Cleanup (Handover to Distiller)

**Files:**
- Modify: `.memory/patterns.md`

- [ ] **Step 1: Trigger Distiller for existing junk**
    Dispatch the Distiller sub-agent:
    `Dispatch the Distiller sub-agent via generalist: "执行最终蒸馏任务。读取 .memory/patterns.md，识别所有没有 Frontmatter 的模式，按照 V3.5 标准（P-YYYYMMDD-XXXX）重新编写它们并执行 Root Cause Analysis。完成后标记信号为 PROCESSED。"`
- [ ] **Step 2: Verify patterns.md**
    Ensure all patterns now follow the standard format.

### Task 5: Final Verification

- [ ] **Step 1: MCP Tool Check**
    Restart MCP server or run `/mcp list` (manual check for user).
- [ ] **Step 2: Ledger/Signal Test**
    Call `submit_memory_signal` to create a new PENDING item.
    Verify that the context injection now ONLY recommends Distiller.
- [ ] **Step 3: Commit all changes**
    ```bash
    git add .
    git commit -m "feat(assa): remove distill_pending mcp and consolidate to distiller sub-agent"
    ```
