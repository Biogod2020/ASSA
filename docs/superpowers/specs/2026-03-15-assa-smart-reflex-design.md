# Design Specification: ASSA Smart Reflex (Introspective Evolution)

**Date**: 2026-03-15
**Status**: Draft
**Version**: 1.0 (Feedback Synergy, Victory Capture, and YOLO Silent Signaling)

## 1. Architectural Vision
The "Smart Reflex" system aims to transform ASSA from a reactive tool into an introspective agent. It establishes a "nervous system" that monitors its own performance, recognizes technical breakthroughs, and captures project-specific nuances without explicit user prompting.

## 2. Component Design

### 2.1 Peripheral Nervous System (Hooks)
*   **Enhanced `AfterTool`**:
    *   **Function**: Intercepts `tool_response` for ALL tool calls.
    *   **Data Capture**: Stores metadata (tool name, status, error type, attempt count) in a fast-access state (volatile context).
*   **Analytic `BeforeAgent`**:
    *   **Function**: Performs pattern matching on the conversation `transcript`.
    *   **Pattern 1: Victory After Struggle**: Recognizes a `[Fail] -> [Fail] -> [Success]` sequence.
    *   **Pattern 2: Depth of Mud**: Recognizes `[Fail] * 3` or solve time > 3 turns.
    *   **Injection**: Injects meta-instructions into the prompt, forcing the agent to explain its "Eureka" moment or admit a technical barrier.

### 2.2 Core Soul (Prompt Evolution)
*   **Contextual Heartbeat**: Upgrades the "Self-Evolution Heartbeat" to trigger on task completion (e.g., test passed, code pushed, track archived).
*   **Reflexive Quantization**: Signals must include:
    *   `Technical Domain`: (e.g., Node.js, Workspace API, Git).
    *   `Familiarity Score`: (Based on attempt count).
    *   `Rationale`: The "Aha!" insight that finally worked.

### 2.3 Execution Instinct (YOLO Silent Reflex)
*   **Behavior**: When `yolo: true` is detected, the agent MUST perform `submit_memory_signal` immediately upon reflex trigger.
*   **Feedback Loop**: Provides a non-intrusive notification: `*Reflex: Captured [Domain] insights*`.

## 3. Data Flow
1.  `Tool Call` -> `AfterTool Hook` (Store Result).
2.  `Next Turn` -> `BeforeAgent Hook` (Scan Sequence).
3.  `Reflex Directive` -> `Agent Decision` (Recognize Success/Difficulty).
4.  `Task Done` -> `Meta-Audit` (Final Review).
5.  `YOLO Trigger` -> `Silent Signal` -> `L1 Ledger`.

## 4. Success Criteria
*   Zero manual prompts required to record "Aha!" moments.
*   Automatic identification of "Hard Topics" in `patterns.md`.
*   Clean main interaction context maintained via silent sub-turn signaling.
