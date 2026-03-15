# Implementation Plan: ASSA Smart Reflex (Introspective Evolution)

**Goal:** Transform ASSA into an introspective agent by enabling hook-level behavioral monitoring and automated signal capture.

## Phase 1: Hook Instrumentation
- [x] Task: Update `hooks/beforeAgentHook.js` with Pattern Matching
    - [x] Implement a sliding window scanner for the `transcript`.
    - [x] Inject `### ASSA REFLEX ###` directives based on recognized sequences.
- [~] Task: Update `hooks/afterToolHook.js` (Skipped: Transcript analysis in BeforeAgent is sufficient)

## Phase 2: Instruction Reinforcement (Soul)
- [x] Task: Refactor `templates/SOUL.md` Reflex Instructions
    - [x] Define quantitative thresholds for "Difficulty" and "Success".
    - [x] Add explicit behavior: "Record silently and autonomously".
- [x] Task: Update Global `SOUL.md` (via template update)

## Phase 3: Validation & E2E
- [ ] Task: Verify "Victory After Struggle" Reflex
    - [ ] Simulate 2 tool failures followed by 1 success in a sandbox.
    - [ ] Confirm the agent triggers `submit_memory_signal` automatically.
- [ ] Task: Verify "Technical Barrier" Reflex
    - [ ] Simulate 3 consecutive tool failures.
    - [ ] Confirm the agent records a "Barrier" signal.
- [ ] Task: Conductor - User Manual Verification 'Smart Reflex' (Protocol in workflow.md)
