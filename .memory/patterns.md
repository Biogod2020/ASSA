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

---
id: P-20260315-0008
category: Logic
confidence: 10
status: Active
hit_count: 1
---
# Zero-LLM Infrastructure Verification
**Rationale**: Testing core infrastructure (hooks, MCP servers) using full LLM calls is slow, expensive, and subject to quota limits or flakiness. Infrastructure should be verifiable via pure functional tests or direct JSON-RPC mocks.
**Rule**: Use direct sub-process spawning and JSON-RPC message injection (e.g., `tests/test_mcp_tools.js`) to verify MCP tool logic and hook behavior. Reserve E2E LLM tests for final validation only.

---
id: P-20260315-0009
category: Logic
confidence: 9
status: Active
hit_count: 1
---
# Schema-Enforced Signal Lifecycle
**Rationale**: Manual edits to `.memory/evolution_ledger.json` are prone to syntax errors and race conditions. Enforcing signal submission through a specialized MCP tool ensures schema consistency and maintains a reliable audit trail for the distiller.
**Rule**: Always use the `submit_memory_signal` MCP tool to record new realizations. Avoid manual file manipulation of the ledger to prevent data corruption.

---
id: P-20260315-0010
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Documentation-First Evolution
**Rationale**: In a self-evolving system, architectural shifts must be captured in the `conductor/` directory to provide a "source of truth" for subagents and future iterations. This prevents design drift and ensure that all components (hooks, skills, agents) remain aligned with the primary intent.
Rule: Major architectural changes MUST be accompanied by updates to `conductor/tracks/` and `conductor/product.md`. Verification scripts should check for documentation synchronization before completing a track.

---
id: P-20260315-0011
category: Workflow
confidence: 10
status: Active
hit_count: 1
---
# Track Archival Hygiene
**Rationale**: Accumulating completed tracks in the active `tracks/` directory increases noise for codebase research and bloats the context for subagents. Clean workspaces improve retrieval accuracy.
**Rule**: Immediately move all plan and specification files to a dated sub-directory in `conductor/archive/` upon track completion. Remove the corresponding entries from the active `conductor/tracks.md` to maintain a focused development scope.

---
id: P-20260315-0012
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Priority Health Alerting
**Rationale**: Learning signals and architectural patterns are secondary to system integrity. If the environment is broken (e.g., agents disabled or ledger corrupted), the agent must prioritize fixing the foundation over performing features.
**Rule**: The `BeforeAgent` hook must inject health warnings at the absolute TOP of the `additionalContext` block. Use the `### ASSA HEALTH WARNING ###` header and provide a single, actionable "fix suggestion" command to minimize user friction.

---
id: P-20260315-0013
category: Workflow
confidence: 9
status: Active
hit_count: 1
---
# Scientific Git Commitment
**Rationale**: Vague or incorrect commit messages degrade the quality of the project's audit trail and mislead future analysis by the ASSA Distiller. Verification must precede proclamation.
**Rule**: Before staging any change, run `git status` and `git diff HEAD` to verify the exact scope. Proactively draft commit messages using the Conventional Commits format, focusing on the "why" in the body, and present them for confirmation instead of asking the user for input.

---
id: P-20260315-0014
category: Logic
confidence: 10
status: Active
hit_count: 1
---
# Session-Aware Rewind Isolation
**Rationale**: In environments where multiple sessions share a single `evolution_ledger.json`, a rewind in one session can incorrectly invalidate signals from others if the "Rewind Defense" logic (P-20260315-0004) is not session-aware. This leads to data loss and "false negatives" in the learning loop.
**Rule**: The `BeforeAgent` hook must pass the `sessionId` to the rewind cascade logic. Only signals whose `session_id` matches the current `sessionId` are eligible to be marked as `REWOUND`. Signals from other sessions must remain untouched regardless of their presence in the current transcript.

---
id: P-20260315-0015
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Continuous Ledger Pruning
**Rationale**: The `REWOUND` status is a terminal state for signals that are no longer valid. Leaving these entries in the ledger indefinitely causes unnecessary growth and increases processing latency for the distiller.
**Rule**: The `distill_pending` tool (or equivalent logic in the MCP server) must automatically filter out and remove all entries with `status: "REWOUND"` from the ledger after processing the `PENDING` signals. This ensures the ledger remains a compact source of truth for active and processed learning.
---
id: P-20260315-0016
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Production-Grade Evolution Synergy
**Rationale**: The 'Native Subagent Dispatch' architecture, when unified with 'Session-Aware Rewind Isolation' and 'Continuous Ledger Pruning', creates a robust, production-grade self-evolution loop that minimizes context pollution and ensures data integrity.
**Rule**: Standardize the self-evolution loop on the synergy between Native Subagent Dispatch (P-20260315-0002), Session-Aware Rewind Isolation (P-20260315-0014), and Continuous Ledger Pruning (P-20260315-0015). Any modifications to the evolution pipeline must preserve this three-way integrity.

---
id: P-20260315-0017
category: Behavioral
confidence: 10
status: Active
hit_count: 1
---
# High-Sentiment Signal Sensitivity
**Rationale**: Failing to recognize positive reinforcement (e.g., "很好", "Perfect", "Exactly") results in missed learning opportunities and requires the user to manually point out success patterns. Proactive signal detection is essential for a truly autonomous evolution loop.
Rule: Scan all user turns for high-sentiment keywords (e.g., '很好', 'Perfect', 'Exactly', '不错'). Upon detection, immediately trigger `submit_memory_signal` to record the current state as a success pattern. Missing a praise signal is considered a high-priority behavioral gap.

---
id: P-20260315-0018
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Smart Reflex Architecture (Detection vs. Action Separation)
**Rationale**: Relying on the LLM's long-term memory or "presence of mind" to record signals is unreliable and slows down interaction. Separating the *detection* of behavioral patterns (into fast, non-LLM hooks) from the *action* of recording (into the agent's reflex) ensures high-fidelity signal capture without sacrificing performance.
**Rule**: Implement behavioral detection in the `BeforeAgent` hook using deterministic sliding-window scanners on the `transcript`. Inject targeted `### ASSA REFLEX ###` directives to nudge the agent into performing autonomous, silent actions (like `submit_memory_signal`) without asking for user permission.

---
id: P-20260315-0019
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Event-Driven Subagent Dispatch (EDSD)
**Rationale**: Complex evolution tasks like distillation and synchronization are "expensive" in terms of context and time. Triggering them manually is inefficient. Automatically dispatching specialized subagents based on system events (like `git commit` or `git push`) ensures the evolution loop stays synchronized with the codebase.
**Rule**: The `AfterTool` hook must monitor for specific system-altering events (e.g., `git commit`, `git push`). Upon detection, it must inject a mandatory directive for the main agent to immediately delegate the corresponding evolution task (Distiller or Syncer) to a `generalist` subagent. The main agent must report "Task Dispatched" and return to the primary thread.

---
id: P-20260315-0020
category: Behavioral
confidence: 10
status: Active
hit_count: 1
---
# Behavioral Breakthrough & Barrier Detection (Sequence Matching)
**Rationale**: Isolated tool results rarely tell the full story. A "Victory" is defined by a transition from failure to success; a "Barrier" is defined by repeated failures. Detecting these multi-turn sequences is critical for identifying non-obvious root causes and success patterns.
**Rule**: The reflex system must analyze tool result sequences in the `transcript`. 
- **Victory After Struggle**: A `fail -> success` transition. Triggers a request to summarize the breakthrough.
- **Technical Barrier**: Three or more consecutive failures. Triggers a request for a deep root-cause analysis (negative signal).
These must be recorded silently to preserve the developer's "flow" while still capturing technical realizations.


---
id: P-20260315-0021
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Side-Channel Transcript Ingestion (Buffer-Overflow Resilience)
**Rationale**: Ingesting the full JSON-serialized conversation history through `stdin` is subject to platform-specific pipe buffer limits (often 16KB-64KB). When the transcript exceeds this size, the hook receives truncated data, causing JSON parsing failures and disabling behavioral reflexes.
**Rule**: Prioritize reading the conversation history from the `transcript_path` provided by the CLI. Only fall back to the inline `transcript` array if the file path is missing or inaccessible. This "side-channel" strategy ensures zero-loss data ingestion and stabilizes deep-history analysis in long-running sessions.

---
id: P-20260315-0022
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Metadata-Augmented Behavioral Matching
**Rationale**: Heuristic string matching of tool responses (e.g., "Exit Code: 1") is brittle and prone to false positives/negatives as tool outputs change across environments. Establishing an explicit "ground truth" at the moment of execution simplifies downstream pattern matching.
**Rule**: The `AfterTool` hook must inject explicit, machine-readable status markers (e.g., `<!-- ASSA_METADATA: [SUCCESS/FAILED] -->`) into the context. Behavioral pattern matching logic in `BeforeAgent` must prioritize these markers over raw transcript content to trigger deterministic reflexes (Victory/Barrier) with 100% precision.
