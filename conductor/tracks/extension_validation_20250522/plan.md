# Implementation Plan: Real-World Validation of ASSA Extension

**Goal:** Rigorously verify the ASSA extension by executing real `gemini` CLI commands and asserting correct memory distillation and context injection.

## Phase 1: Real-World CLI Integration Tests
- [ ] Task: Setup a "Live Test Sandbox"
    - [ ] Create a isolated directory for live testing
    - [ ] Link the current extension into the sandbox environment
- [ ] Task: Verify Real-Time Memory Distillation
    - [ ] Invoke `gemini --prompt "..."` to trigger a memory signal tool call
    - [ ] Verify `evolution_ledger.json` reflects the `PENDING` state
    - [ ] Run a `git commit` in the sandbox and verify the background `distiller` sub-agent is spawned
    - [ ] Assert `patterns.md` is updated with a high-quality distilled rule
- [ ] Task: Verify "Instant Intelligence" (Hot-Reloading)
    - [ ] Trigger a memory update and immediately run a second `gemini` command
    - [ ] Use `--debug` to confirm the new L2 pattern is injected into the prompt
    - [ ] Assert the agent's behavior changes according to the new pattern
- [ ] Task: Conductor - User Manual Verification 'Real-World CLI Integration Tests' (Protocol in workflow.md)

## Phase 2: Edge Case & Stability Validation
- [ ] Task: Verify Rewind Resilience in Live Sessions
    - [ ] Run a multi-turn session and execute `/rewind`
    - [ ] Verify the ledger correctly transitions affected items to `REWOUND` status
- [ ] Task: Verify Global Promotion (L2 -> L3)
    - [ ] Manually trigger `/assa promote` or simulate a `git push`
    - [ ] Assert the local pattern is promoted to `~/.gemini/assa/LIBRARY/`
- [ ] Task: Conductor - User Manual Verification 'Edge Case & Stability Validation' (Protocol in workflow.md)
