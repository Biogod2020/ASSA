# Specification: ASSA Smart Reflex (Introspective Evolution)

## Overview
Implement a "Smart Reflex" system that enhances ASSA's self-evolution by automatically recognizing technical successes and barriers. This track focuses on hook-level monitoring and prompt-driven introspection to ensure high-quality, zero-prompt memory capture.

## Functional Requirements
1.  **Instrumented Hooks**:
    *   `AfterTool` hook must pass tool execution results (metadata) to the volatile context.
    *   `BeforeAgent` hook must analyze the last 5 turns for `[Fail] -> [Success]` or `[Fail] * 3` patterns.
2.  **Pattern Recognition**:
    *   **Trigger A (Victory)**: If a tool failed in Turn N-1 and succeeded in Turn N, inject a directive to signal the breakthrough rationale.
    *   **Trigger B (Barrier)**: If a tool fails 3 times consecutively, inject a directive to signal a technical difficulty.
3.  **End-of-Task Reflection**:
    *   Add a logic to the "Internal Audit" turn to perform a full process review when a task context is closed.
4.  **YOLO Integration**:
    *   In YOLO mode, signaling must be silent and automated.

## Technical Constraints
*   **Threshold**: 3 failures for barrier detection.
*   **Domain Identification**: AI-driven inference (Agent determines the domain of the signal).
*   **Latency**: Hooks must remain <100ms.

## Acceptance Criteria
- [ ] Hooks correctly identify and inject "Victory" and "Barrier" directives.
- [ ] Agent performs silent signaling in YOLO mode.
- [ ] `patterns.md` successfully records a "Victory" signal after a simulated struggle.
