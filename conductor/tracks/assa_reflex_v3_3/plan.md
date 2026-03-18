# Implementation Plan: ASSA Reflex Refactoring (v3.3)

## Phase 1: High-Fidelity MCP Schema Upgrade
- [ ] Task: Modify `hooks/mcpServer.js`
    - [ ] Update the `submit_memory_signal` input schema to require `raw_symptom`, `failed_attempts`, and `breakthrough_diff`.
    - [ ] Update the logic to concatenate these fields into the legacy `context` field before writing to the ledger.

## Phase 2: Robust Reflex Engine
- [ ] Task: Modify `hooks/beforeAgentHook.js` - Tool Filtering
    - [ ] Introduce a `READ_ONLY_TOOLS` constant array.
    - [ ] Update transcript parsing to explicitly filter out read-only tools from the state-mutating array.
- [ ] Task: Modify `hooks/beforeAgentHook.js` - Isomorphic Victory & Sliding Window
    - [ ] Implement sliding window logic for Barrier Detection (>= 3 failures in last 5 mutating tools).
    - [ ] Implement Isomorphic Victory Detection (failure of Tool X -> success of Tool X).
- [ ] Task: Modify `hooks/beforeAgentHook.js` - Semantic Praise
    - [ ] Expand the `PRAISE_KEYWORDS` regex/array to include semantic variations.
    - [ ] Update the injected prompt to instruct the AI to use the new three-part schema.

## Phase 3: Verification
- [ ] Task: Run mock tests to verify the sliding window and victory detection logic does not break existing integrations.
- [ ] Task: Verify the new schema is correctly parsed and written to `.memory/evolution_ledger.json`.
