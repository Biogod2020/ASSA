# Implementation Plan: Comprehensive Trigger Validation (ASSA V3.2)

**Goal:** Rigorously verify that every architectural trigger in the ASSA extension fires correctly under real-world conditions using the actual `gemini` CLI.

## Phase 1: Real-World Trigger Verification
- [ ] Task: Setup a "Live Test Sandbox"
    - [ ] Create a isolated directory for live testing
    - [ ] Link the current extension into the sandbox environment
- [ ] Task: Verify **Trigger 1: User Feedback & Signal Capture**
    - [ ] Provide negative feedback in a live chat (e.g., "Don't use semicolons")
    - [ ] Confirm the Agent autonomously calls `submit_memory_signal`
    - [ ] Assert `evolution_ledger.json` contains a new `PENDING` item
- [ ] Task: Verify **Trigger 2: Instant Distillation (BeforeAgent)**
    - [ ] Trigger a `PENDING` signal
    - [ ] Send another prompt and verify the `distiller` sub-agent is triggered synchronously *before* the reply
    - [ ] Assert `patterns.md` is updated and the ledger item is now `PROCESSED`
- [ ] Task: Verify **Trigger 3: Git Push & Global Synchronization**
    - [ ] Execute `git push` in the sandbox
    - [ ] Verify the `syncer` sub-agent is triggered via `AfterTool`
    - [ ] Assert the local pattern is promoted to `~/.gemini/assa/LIBRARY/`
- [ ] Task: Verify **Trigger 4: Time-Travel Resilience (/rewind)**
    - [ ] Execute `/rewind` in a live session to erase a turn that generated a signal
    - [ ] Assert the ledger item status is cascaded to `REWOUND`
- [ ] Task: Conductor - User Manual Verification 'Real-World Trigger Verification' (Protocol in workflow.md)

## Phase 2: Traceability & Stability
- [ ] Task: Verify "Instant Intelligence" (Hot-Reloading)
    - [ ] Use `gemini --debug` to confirm that newly distilled L2 patterns are injected into the *next* prompt's `additionalContext`.
- [ ] Task: Stress-test Atomic Locking
    - [ ] Simulate rapid feedback loops to ensure the `filelock` prevents ledger corruption.
- [ ] Task: Conductor - User Manual Verification 'Traceability & Stability' (Protocol in workflow.md)
