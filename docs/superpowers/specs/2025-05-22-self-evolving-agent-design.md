# Design Specification: Self-Evolving Agent for Gemini CLI (ASSA)
**Date**: 2025-05-22
**Status**: Draft

## Overview
A State-of-the-Art (SOTA) self-evolving system for Gemini CLI, focused on autonomous improvement through hierarchical memory, pattern distillation, and habit adaptation.

## Architectural Pillars

### 1. Hierarchical Agent Memory (HAM)
- **Layer 1: Task Context**: Transient session history, current files, and logs.
- **Layer 2: Distilled Memory (`.memory/`)**:
    - `decisions.md`: Records "Why" for architectural choices to prevent regression.
    - `patterns.md`: Distilled "low-level" insights (e.g., "User prefers functional React components").
    - `user_delta.json`: Tracks the difference (delta) between agent proposals and final user edits.
- **Layer 3: Core Wisdom (`SOUL.md`, `SKILLS/`)**: Persistent personality, core rules, and verified capabilities.
- **Context Router**: A middleware logic that selects and injects the relevant `.memory/` files into the system prompt based on the detected task intent.
    - **Intent-to-Memory Mapping**:
        - `frontend` → `.memory/ui_patterns.md`, `.memory/styling_decisions.md`
        - `refactor` → `.memory/clean_code_patterns.md`, `.memory/architectural_decisions.md`
        - `bugfix` → `.memory/error_reflection.md`, `.memory/past_bugs.md`
        - `default` → `.memory/general_patterns.md`, `.memory/decisions.md`

### 2. Pattern Distillation Engine
- **Mechanism**: "Reflection-on-Failure" and "Success Audit."
- **Heartbeat Triggers**: The evolution loop is triggered **after every 5 tasks** or upon an explicit **user-requested audit**.
- **Success Audit**: Uses an "LLM-as-a-judge" approach to compare the final task output against the original user requirements, identifying patterns of success.
- **Data Schema (`patterns.md`)**:
    ```markdown
    # Pattern: <Pattern Name>
    - **ID**: `P-YYYYMMDD-XXXX`
    - **Category**: [UI | Logic | Architecture | Habit]
    - **Description**: Concise summary of the learned pattern.
    - **Evidence**: Link to `task_id` or `user_delta.json` entry.
    - **Rule**: Literal instruction to be injected into the prompt.
    ```
- **Data Schema (`user_delta.json`)**:
    ```json
    {
      "task_id": "string",
      "proposal_sha": "string",
      "final_sha": "string",
      "detected_patterns": ["string"],
      "confidence": 0.0-1.0
    }
    ```

### 3. Implicit Habit Adaptation (Delta Analysis)
- **Technique**: The agent performs a `git diff <initial_sha> <final_commit_sha>` analysis of its proposed changes against the final committed state.
- **Goal**: Automatically identify and internalize stylistic preferences, naming conventions, and logic patterns without explicit user prompting.

### 4. Deep Meta-Evolution Loop
- **Process**: The "Heartbeat" mechanism periodically reviews the distilled patterns and habit data.
- **Prompt Verification Strategy**: Before a "Meta-Patch" is deployed to `SOUL.md`, it must pass a **Gold Standard Evaluation Suite**. This suite consists of 5 fixed, high-complexity scenarios where the new prompt must produce outputs of equal or higher quality than the current version.
- **Reversibility**: An **Emergency Rollback** command (`/conductor:rollback`) is implemented to instantly revert any `SOUL.md` or `SKILL.md` changes to the previous Git-tracked state.

## Implementation Phases
1. **Phase 1: Memory Foundation**: Implement the `.memory/` structure and Context Router.
2. **Phase 2: Distillation & Delta Engine**: Build the reflection loops and diff-based learning logic.
3. **Phase 3: Meta-Evolution & Verification**: Implement the autonomous system prompt updating and multi-stage testing suite.

## Success Criteria
- Agent can autonomously identify and fix its own repeated logic errors.
- Agent's proposals increasingly align with the user's coding style and preferences over time.
- All evolution steps are transparently logged and fully reversible via Git.
