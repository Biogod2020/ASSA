# Specification: ASSA V3.3 Semantic Reflex Refactoring

## Overview
This track focuses on overhauling the ASSA plugin's "Reflex" systems. The current trigger mechanisms are fragile, often missing genuine learning opportunities while generating false positives (e.g., mistaking a successful `read_file` for a bug fix). The upgrade will introduce a LLM-based semantic emotion sensor, isomorphic victory detection, sliding-window barrier detection, and a structured MCP payload to guarantee high-fidelity memory recording.

## Functional Requirements

### 1. Semantic Emotion Sensor
- Remove the hardcoded `PRAISE_KEYWORDS` array.
- Inject a highest-priority "Subconscious Directive" into the `BeforeAgent` hook, exclusively for the Main Agent.
- The prompt will instruct the LLM to actively analyze the user's recent replies for implicit positive reinforcement (e.g., "This is a great idea") or negative frustration.
- Upon detecting these emotions, the Agent must explicitly acknowledge the learning to the user and call `submit_memory_signal`.

### 2. Isomorphic Victory & Tool Filtering
- Implement a configurable "Tool Whitelist" (e.g., `read_file`, `list_directory`, `grep_search`) defined via configuration, not hardcoded.
- Ignore tools in this whitelist when calculating the consecutive chain of failures and successes.
- **Isomorphic Victory**: A "Victory" is strictly defined as a state-changing tool (e.g., `run_shell_command`) transitioning from a `FAILED` state to a `SUCCESS` state, ensuring "reading logs" isn't misidentified as a fix.

### 3. Sliding-Window Barrier Detection
- Replace the strict "3 consecutive failures" rule.
- Implement a sliding window analyzing the last 5 *state-changing* tool executions.
- If ≥3 out of 5 executions result in failure, trigger the "Barrier" reflex (prompting an RCA and memory signal).

### 4. Structured MCP Payload (High-Fidelity Context)
- Update `mcpServer.js` to enforce a structured, 4-part payload for the `submit_memory_signal` tool:
  - `raw_symptom`: The original error or phenomenon (requires actual logs/snippets).
  - `failed_attempts`: Previous failed attempts and why they failed.
  - `breakthrough`: The exact diff or action that resolved the issue.
  - `rule`: The abstracted core principle.

## Acceptance Criteria
- [ ] Positive sentiment without explicit praise keywords triggers a memory signal.
- [ ] Running `read_file` successfully after a failed build does NOT trigger a Victory.
- [ ] 3 failures across 5 state-changing tools correctly triggers a Barrier warning.
- [ ] `submit_memory_signal` correctly parses and records the 4-part structured context into the L1 ledger.

## Out of Scope
- Modifying the Distiller or Syncer sub-agent logic (beyond receiving the structured context).