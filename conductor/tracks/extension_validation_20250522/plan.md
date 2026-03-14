# Implementation Plan: Comprehensive Trigger Validation (ASSA V3.2)

**Goal:** Rigorously verify that every architectural trigger in the ASSA extension fires correctly under real-world conditions using the actual `gemini` CLI, actively utilizing **Superpowers** skills and **Sub-Agents** for deep investigation and verification.

## Phase 1: Real-World Trigger Verification
- [ ] Task: Setup a "Live Test Sandbox"
    - [ ] Create an isolated directory for live testing.
    - [ ] Link the current extension into the sandbox environment.
    - [ ] **Sub-Agent**: Use `generalist` to verify the environment pathing and ensure no conflicts with existing extensions.
    - [ ] **Superpowers**: Use `verification-before-completion` to confirm the extension is correctly linked and recognized by the CLI.
- [ ] Task: Verify **Trigger 1: User Feedback & Signal Capture**
    - [ ] Provide negative feedback in a live chat.
    - [ ] Confirm the Agent autonomously calls `submit_memory_signal`.
    - [ ] **Sub-Agent**: Use `codebase_investigator` to audit the `evolution_ledger.json` structure and ensure it matches the V3.2 schema exactly.
    - [ ] **Superpowers**: Use `systematic-debugging` if the signal is not captured, tracing the data flow from feedback to ledger.
- [ ] Task: Verify **Trigger 2: Instant Distillation (BeforeAgent)**
    - [ ] Trigger a `PENDING` signal and verify synchronous distillation *before* the next reply.
    - [ ] **Sub-Agent**: Use `generalist` to monitor background processes and capture any non-blocking errors from the `distiller` sub-agent.
    - [ ] **Superpowers**: Use `chrome-devtools` (if applicable) or verbose logging to observe the sub-agent spawning and file updates.
- [ ] Task: Verify **Trigger 3: Git Push & Global Synchronization**
    - [ ] Execute `git push` and verify the `syncer` sub-agent trigger.
    - [ ] **Sub-Agent**: Use `codebase_investigator` to perform a cross-project audit, ensuring the promoted pattern is accessible in a different repository.
    - [ ] **Superpowers**: Use `verification-before-completion` to prove the local pattern reached the global library.
- [ ] Task: Verify **Trigger 4: Time-Travel Resilience (/rewind)**
    - [ ] Execute `/rewind` and assert `REWOUND` status cascade.
    - [ ] **Sub-Agent**: Use `generalist` to perform batch rewind tests (reverting multiple turns at once) to check state stability.
    - [ ] **Superpowers**: Use `systematic-debugging` to verify the state machine's integrity during the rewind.
- [ ] Task: Conductor - User Manual Verification 'Real-World Trigger Verification' (Protocol in workflow.md)

## Phase 2: Traceability & Stability
- [ ] Task: Verify "Instant Intelligence" (Hot-Reloading)
    - [ ] Use `gemini --debug` to confirm context injection.
    - [ ] **Superpowers**: Use `verification-before-completion` to confirm the agent's behavior aligns with the new injected knowledge.
- [ ] Task: Stress-test Atomic Locking
    - [ ] Simulate rapid loops to test `filelock`.
    - [ ] **Sub-Agent**: Use `generalist` to generate high-volume tool calls concurrently to stress-test the `ledgerUtils.js` retry logic.
    - [ ] **Superpowers**: Use `systematic-debugging` to identify any race conditions or lock contention issues.
- [ ] Task: Conductor - User Manual Verification 'Traceability & Stability' (Protocol in workflow.md)
