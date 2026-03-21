---
name: assa-distiller-legacy-stub
description: DEPRECATED. Use the specialized 'assa-distiller' skill instead.
---

# DEPRECATED: ASSA Distiller (Legacy)

This skill is deprecated. All distillation logic has been moved to the specialized **assa-distiller** skill.

## Mandatory Redirection
You MUST call `activate_skill("assa-distiller")` to perform any architectural distillation. 

**Standard Operating Procedure (V3.5):**
1. Read PENDING signals from `.memory/evolution_ledger.json`.
2. Perform Root Cause Analysis (RCA).
3. Generate high-quality L2 patterns with **YAML Frontmatter** in `.memory/patterns.md`.
4. Mark signals as PROCESSED via `mcp_assa-mcp_mark_processed_signals`.
