# Implementation Plan: ASSA V3.3 Semantic Reflex Refactoring

## Phase 1: Structured MCP Payload Upgrade
- [x] Task: Update `submit_memory_signal` schema [0b66a2a]
    - [ ] Write tests verifying `mcpServer.js` rejects payloads missing `raw_symptom`, `failed_attempts`, `breakthrough`, or `rule`.
    - [ ] Update `mcpServer.js` tool schema to require the 4-part structure.
    - [ ] Update `ledgerUtils.js` or `mcpServer.js` to correctly concatenate these 4 fields into the L1 ledger `context` field.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Structured MCP Payload Upgrade' (Protocol in workflow.md)

## Phase 2: Configurable Tool Whitelist & Victory Logic
- [ ] Task: Implement Tool Whitelist Configuration
    - [ ] Write tests for loading a whitelist config (e.g., from `.memory/config.json` or a default array).
    - [ ] Implement the config loader in `beforeAgentHook.js` / `afterToolHook.js`.
- [ ] Task: Refactor `isToolFailure` and `isToolSuccess`
    - [ ] Write tests for `isToolFailure` / `isToolSuccess` to ensure whitelisted tools (e.g., `read_file`) return false or are ignored.
    - [ ] Implement the ignore logic for read-only tools.
- [ ] Task: Implement Isomorphic Victory Detection
    - [ ] Write tests verifying that a Victory is only triggered when a state-changing tool fails and then *the same category of tool* succeeds.
    - [ ] Update the Victory detection loop in `beforeAgentHook.js`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Configurable Tool Whitelist & Victory Logic' (Protocol in workflow.md)

## Phase 3: Sliding-Window Barrier Detection
- [ ] Task: Implement Sliding-Window Logic
    - [ ] Write tests to verify that 3 failures within the last 5 state-changing tools trigger a Barrier, even if interspersed with successes or read-only tools.
    - [ ] Refactor the Barrier detection loop in `beforeAgentHook.js` to use a sliding window over the filtered tool history.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Sliding-Window Barrier Detection' (Protocol in workflow.md)

## Phase 4: Semantic Emotion Sensor
- [ ] Task: Replace Keyword Matching with Subconscious Directive
    - [ ] Write tests (or mock tests) verifying that `PRAISE_KEYWORDS` logic is removed from `beforeAgentHook.js`.
    - [ ] Remove `PRAISE_KEYWORDS` string matching from `beforeAgentHook.js`.
    - [ ] Inject the "Subconscious Directive" into the `additionalContext` of the `BeforeAgent` hook. Ensure it explicitly instructs the Main Agent to analyze sentiment and announce its learnings.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Semantic Emotion Sensor' (Protocol in workflow.md)