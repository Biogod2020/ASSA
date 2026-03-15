# PATTERNS

---
id: P-20260315-0001
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Hook Isolation & Context Purity
**Rationale**: Spawning sub-processes (like `gemini`) or performing heavy LLM-based reasoning within hooks leads to infinite recursion loops and severe execution timeouts (60s+). Hooks must remain "fast context injectors" to ensure zero-latency for the user.
**Rule**: NEVER spawn `gemini` processes or perform LLM-heavy reasoning within `BeforeAgent` or `AfterTool` hooks. Use hooks strictly to inject L1/L2/L3 context and environment warnings. Execution must remain under 100ms.

---
id: P-20260315-0002
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Subagent-Driven Forensics
**Rationale**: Knowledge distillation and global synchronization require deep analysis of ledger entries and multi-commit diffs. Performing this in the main conversation thread pollutes the context with metadata and risks hitting model capacity limits.
**Rule**: Delegate all heavy architectural distillation (ASSA Distiller) and global promotion (ASSA Syncer) tasks to the `generalist` subagent. The main agent must dispatch the specific task prompt and return immediately to maintain a clean primary interaction thread.

---
id: P-20260315-0003
category: Logic
confidence: 9
status: Active
hit_count: 1
---
# Self-Healing Environment Integrity
**Rationale**: The ASSA evolution cycle is fragile and depends on the presence of `.memory/` and `~/.gemini/assa/` directories and templates. Environmental entropy (manual deletion or config drift) can silently break the learning loop.
**Rule**: Proactively verify environment health (via `check_health` MCP tool) at the start of every session. Automatically restore missing templates (`SOUL.md`, `USER_HANDBOOK.md`) and recreate local `.memory/` structures before injecting context.

---
id: P-20260315-0004
category: Logic
confidence: 9
status: Active
hit_count: 1
---
# Ledger-Transcript Synchronization (Rewind Defense)
**Rationale**: Gemini CLI allows users to rewind conversations, which deletes messages from the history. However, the persistent ledger may still contain `PENDING` or `PROCESSED` signals from those "future" turns that no longer exist, leading to "time-travel" inconsistencies.
**Rule**: In the `BeforeAgent` hook, cross-reference the ledger with the current `payload.transcript`. Mark any ledger entries whose `message_id` is missing from the active transcript as `REWOUND` to preserve data integrity and prevent false learning.

---
id: P-20260315-0005
category: Logic
confidence: 10
status: Active
hit_count: 1
---
# Subagent Termination Guarantee
**Rationale**: Automated subagents (like Distiller or Syncer) dispatched via hook-injected context often fail to close the session because the prompt doesn't explicitly mandate a termination tool call, resulting in session hangs or user confusion.
**Rule**: Every subagent task prompt injected via hooks MUST append an explicit instruction: "注意：完成写入后，你必须调用 `complete_task` 工具来结束任务。" (Note: After completing the task, you must call the `complete_task` tool to end the task.)

---
id: P-20260315-0006
category: Architecture
confidence: 9
status: Active
hit_count: 1
---
# Proactive Configuration Alerting
**Rationale**: Critical flags such as `experimental.enableAgents` are mandatory for the subagent-based ASSA loop. If disabled, the system fails silently. Proactive alerting transforms a silent failure into a guided recovery.
**Rule**: The health check module must verify the `enableAgents` flag in `settings.json`. If `false`, the `BeforeAgent` hook must inject a high-priority `### ASSA HEALTH WARNING ###` block containing a specific fix command (e.g., `gemini /settings`).

---
id: P-20260315-0007
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Node-First Middleware Strategy
**Rationale**: Standardizing hooks and MCP servers on Node.js minimizes cold-start latency and simplifies the dependency graph for the core environment, avoiding the overhead of managing dual-runtime (Python/Node) logic for simple middleware.
**Rule**: Prefer Node.js (v18+) for all hooks and MCP servers. Maintain zero-dependency implementations where possible to ensure maximum portability and minimize the risk of environment-level failures due to missing packages.
