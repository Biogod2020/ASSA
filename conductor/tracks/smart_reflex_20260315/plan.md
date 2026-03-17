# Implementation Plan: ASSA Smart Reflex (Introspective Evolution)

**Goal:** Transform ASSA into an introspective agent by enabling hook-level behavioral monitoring and automated signal capture.

## Phase 1: Hook Instrumentation
- [x] Task: Update `hooks/afterToolHook.js` to capture all tool metadata
    - [x] (Refined: Implemented pattern matching in BeforeAgent using the full transcript history instead of AfterTool state).
- [x] Task: Update `hooks/beforeAgentHook.js` with Pattern Matching
    - [x] Implement a sliding window scanner for the `transcript`.
    - [x] Inject `### ASSA REFLEX ###` directives based on recognized sequences (Praise, Victory, Barrier).

## Phase 2: Instruction Reinforcement (Soul)
- [x] Task: Refactor `templates/SOUL.md` Reflex Instructions
    - [x] Define quantitative thresholds for "Difficulty" and "Success".
    - [x] Add explicit YOLO behavior: "Record silently without asking".
- [x] Task: Update Global `SOUL.md` via Syncer logic.

## Phase 3: Validation & E2E
- [x] Task: Verify "Victory After Struggle" Reflex
    - [x] Simulate 2 tool failures followed by 1 success in a sandbox.
    - [x] Confirm the agent triggers `submit_memory_signal` automatically.
- [x] Task: Verify "Technical Barrier" Reflex
    - [x] Simulate 3 consecutive tool failures.
    - [x] Confirm the agent records a "Barrier" signal.
- [x] Task: Conductor - User Manual Verification 'Smart Reflex' (Protocol in workflow.md)
