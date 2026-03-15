---
name: assa-distiller
description: Analyze pending ledger entries and write patterns. Use when PENDING signals appear in L1 context.
---

<SUBAGENT-STOP>
If you were dispatched as a subagent, skip all other skills. This is a focused task.
</SUBAGENT-STOP>

# ASSA Distiller Skill

## When to Use
When you see `### L1 PENDING SIGNALS` in your context, you have unprocessed learning signals. Use the `distill_pending` MCP tool to process them instantly.

## Steps (MAX 2 tool calls)
1. Call `distill_pending` tool — this reads all PENDING ledger entries, writes them to `.memory/patterns.md`, and marks them as PROCESSED. No LLM reasoning needed.
2. Confirm to the user what was distilled.

## DO NOT
- Read any files manually
- Explore the codebase
- Call any other tools
- Spawn sub-agents

## If the `distill_pending` tool is not available
Fall back to:
1. Call `mark_processed_signals` with the message IDs from the PENDING items
2. Inform the user that manual distillation is needed
