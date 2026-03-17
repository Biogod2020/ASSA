# Specification: Comprehensive Extension Validation (ASSA V3.2)

## Overview

This track focuses on building a rigorous, multi-tiered validation suite for the ASSA (Autonomous Self-Sovereign Agent) extension. The goal is to ensure that the L1/L2/L3 memory hierarchy, hook execution, and sub-agent reasoning are 100% reliable, traceable, and produce high-quality, effective memories.

## Functional Requirements

1.  **Memory Logic Validation**:
    - Verify all state transitions in the Immutable Ledger (`PENDING` -> `PROCESSED` -> `REWOUND`).
    - Ensure the `BeforeAgent` hook correctly prioritizes memory resolution (SOUL -> L1 -> L2 -> L3).
2.  **Hook Reliability Suite**:
    - Test hooks in a simulated real-world environment to ensure they fire synchronously and non-blockingly where intended.
3.  **Agent Behavior & Memory Quality**:
    - Implement a "Heuristic Evaluation" to verify that distilled rules in `patterns.md` are technically sound and genuinely useful for future tasks.
    - Verify the Syncer sub-agent's "Global Promotion" heuristics.
4.  **Full Traceability**:
    - Implement detailed logging for all memory transitions and hook payloads to allow for deep auditing.

## Non-Functional Requirements

1.  **Resilience Testing**:
    - Stress-test the atomic file locking mechanism under high concurrency.
    - Validate system recovery from missing or corrupted `.memory/` or `~/.gemini/assa/` files.
2.  **Edge Case Coverage**:
    - Verify state consistency during deeply nested or interrupted `/rewind` commands.
    - Test large context payloads to identify potential token overflow risks.

## Acceptance Criteria

- [ ] Comprehensive Node.js unit tests for all utility functions and hook logic.
- [ ] Integration tests demonstrating a full "feedback -> distill -> sync" cycle.
- [ ] A "Heuristic Eval" report showing that the agent's behavior improved after memory distillation.
- [ ] Successful execution of the "Race Condition" stress test without data corruption.
- [ ] All tests produce granular logs providing full traceability of the evolution loop.
