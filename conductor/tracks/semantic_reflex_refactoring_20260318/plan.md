# Implementation Plan: ASSA V3.3 Semantic Reflex Refactoring

## Phase 1: Structured MCP Payload Upgrade
- [x] Task: Update `submit_memory_signal` schema [0b66a2a]
    - [ ] Write tests verifying `mcpServer.js` rejects payloads missing `raw_symptom`, `failed_attempts`, `breakthrough`, or `rule`.
    - [ ] Update `mcpServer.js` tool schema to require the 4-part structure.
    - [ ] Update `ledgerUtils.js` or `mcpServer.js` to correctly concatenate these 4 fields into the L1 ledger `context` field.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Structured MCP Payload Upgrade' (Protocol in workflow.md) [4a6fe04]
## Phase 2: Configurable Tool Whitelist & Victory Logic
- [x] Task: Implement Tool Whitelist Configuration [535bd71]
    - [x] Write tests for loading a whitelist config (e.g., from `.memory/config.json` or a default array).
    - [x] Implement the config loader in `beforeAgentHook.js` / `afterToolHook.js`.
- [x] Task: Refactor `isToolFailure` and `isToolSuccess` [535bd71]
    - [x] Write tests for `isToolFailure` / `isToolSuccess` to ensure whitelisted tools (e.g., `read_file`) return false or are ignored.
    - [x] Implement the ignore logic for read-only tools.
- [x] Task: Implement Isomorphic Victory Detection [535bd71]
    - [x] Write tests verifying that a Victory is only triggered when a state-changing tool fails and then *the same category of tool* succeeds.
    - [x] Update the Victory detection loop in `beforeAgentHook.js`.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Configurable Tool Whitelist & Victory Logic' (Protocol in workflow.md) [4a6fe04]

## Phase 3: Sliding-Window Barrier Detection
- [x] Task: Implement Sliding-Window Logic [535bd71]
    - [x] Write tests to verify that 3 failures within the last 5 state-changing tools trigger a Barrier, even if interspersed with successes or read-only tools.
    - [x] Refactor the Barrier detection loop in `beforeAgentHook.js` to use a sliding window over the filtered tool history.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Sliding-Window Barrier Detection' (Protocol in workflow.md) [4a6fe04]

## Phase 4: Semantic Emotion Sensor
- [x] Task: Replace Keyword Matching with Subconscious Directive [82357b7]
    - [x] Write tests (or mock tests) verifying that `PRAISE_KEYWORDS` logic is removed from `beforeAgentHook.js`.
    - [x] Remove `PRAISE_KEYWORDS` string matching from `beforeAgentHook.js`.
    - [x] Inject the "Subconscious Directive" into the `additionalContext` of the `BeforeAgent` hook. Ensure it explicitly instructs the Main Agent to analyze sentiment and announce its learnings.
- [x] Task: Conductor - User Manual Verification 'Phase 4: Semantic Emotion Sensor' (Protocol in workflow.md) [4a6fe04]