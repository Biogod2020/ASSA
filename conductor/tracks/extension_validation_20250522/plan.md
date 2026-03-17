# Implementation Plan: Comprehensive Trigger Validation (ASSA V3.2)

**Goal:** Rigorously verify that every architectural trigger in the ASSA extension fires correctly under real-world conditions using the actual `gemini` CLI, actively utilizing **Superpowers** skills and **Sub-Agents** for deep investigation and verification.

## Phase 1: Real-World Trigger Verification

- [x] Task: Setup a "Live Test Sandbox"
  - [x] Create an isolated directory for live testing.
  - [x] Link the current extension into the sandbox environment.
  - [x] **Sub-Agent**: Use `generalist` to verify the environment pathing and ensure no conflicts with existing extensions.
  - [x] **Superpowers**: Use `verification-before-completion` to confirm the extension is correctly linked and recognized by the CLI.
- [x] Task: Verify **Trigger 1: User Feedback & Signal Capture**
  - [x] Provide negative feedback in a live chat.
  - [x] Confirm the Agent autonomously calls `submit_memory_signal`.
  - [x] **Sub-Agent**: Use `codebase_investigator` to audit the `evolution_ledger.json` structure and ensure it matches the V3.2 schema exactly.
  - [x] **Superpowers**: Use `systematic-debugging` if the signal is not captured, tracing the data flow from feedback to ledger.
- [x] Task: Verify **Trigger 2: Instant Distillation (BeforeAgent)**
  - [x] Trigger a `PENDING` signal and verify synchronous distillation _before_ the next reply.
  - [x] **Sub-Agent**: Use `generalist` to monitor background processes and capture any non-blocking errors from the `distiller` sub-agent.
  - [x] **Superpowers**: Use `chrome-devtools` (if applicable) or verbose logging to observe the sub-agent spawning and file updates.
- [x] Task: Verify **Trigger 3: Git Push & Global Synchronization**
  - [x] Execute `git push` and verify the `syncer` sub-agent trigger.
  - [x] **Sub-Agent**: Use `codebase_investigator` to perform a cross-project audit, ensuring the promoted pattern is accessible in a different repository.
  - [x] **Superpowers**: Use `verification-before-completion` to prove the local pattern reached the global library.
- [x] Task: Verify **Trigger 4: Time-Travel Resilience (/rewind)**
  - [x] Execute `/rewind` and assert `REWOUND` status cascade.
  - [x] **Sub-Agent**: Use `generalist` to perform batch rewind tests (reverting multiple turns at once) to check state stability.
  - [x] **Superpowers**: Use `systematic-debugging` to verify the state machine's integrity during the rewind.
- [x] Task: Conductor - User Manual Verification 'Real-World Trigger Verification' (Protocol in workflow.md)

## Phase 2: Traceability & Stability

- [x] Task: Verify "Instant Intelligence" (Hot-Reloading)
  - [x] Use `gemini --debug` to confirm context injection.
  - [x] **Superpowers**: Use `verification-before-completion` to confirm the agent's behavior aligns with the new injected knowledge.
- [x] Task: Stress-test Atomic Locking
  - [x] Simulate rapid loops to test `filelock`.
  - [x] **Sub-Agent**: Use `generalist` to generate high-volume tool calls concurrently to stress-test the `ledgerUtils.js` retry logic.
  - [x] **Superpowers**: Use `systematic-debugging` to identify any race conditions or lock contention issues. (Found and fixed Read-Modify-Write atomicity bug via `updateLedger` method).
- [x] Task: Conductor - User Manual Verification 'Traceability & Stability' (Protocol in workflow.md)
