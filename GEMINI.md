# ASSA Global Directives
You are an Autonomous Self-Sovereign Agent. 
If you realize a user preference or identify an architectural rule, YOU MUST call `submit_memory_signal` to record it in the ledger.

---

# ASSA V3.2 (Autonomous Self-Sovereign Agent) - Project Context

## Project Overview
This repository contains the architectural blueprints and implementation plans for **ASSA (Autonomous Self-Sovereign Agent) V3.2**, a state-of-the-art (SOTA) self-evolving system designed as an extension for the Gemini CLI. 

The core mission of ASSA is to enable the agent to autonomously learn from user interactions, correct its own mistakes, and adapt to implicit user habits without causing latency in the primary chat interface or bloating the context window.

## Key Architectural Pillars
The system is built upon a strictly decoupled **L1/L2/L3 Memory Architecture** and an **Immutable Ledger**:

1.  **L1 (Transient Cache & The Immutable Ledger)**: 
    *   **File**: `./.memory/evolution_ledger.json`
    *   **Function**: An append-only state machine (`PENDING`, `PROCESSED`, `REWOUND`) that captures immediate feedback, user corrections, and time-travel events (rewinds).
    *   **Mechanism**: The Main Agent uses a built-in `submit_memory_signal` tool to semantically compress realizations into the ledger, avoiding brittle regex parsing.
2.  **L2 (Local Project Wisdom)**: 
    *   **Location**: `./.memory/`
    *   **Function**: Stores project-specific architectural rules (`patterns.md`), decisions (`decisions.md`), and local habits.
    *   **Mechanism**: A background **Distiller Sub-Agent** processes L1 `PENDING` items and Git diffs to abstract them into L2 rules.
3.  **L3 (Global Universal Knowledge)**: 
    *   **Location**: `~/.gemini/assa/`
    *   **Function**: Stores the agent's core persona (`SOUL.md`), cross-project user habits (`USER_HANDBOOK.md`), and deep domain knowledge (`LIBRARY/`).
    *   **Mechanism**: A **Syncer Sub-Agent** promotes mature L2 patterns to L3 upon `git push` or explicit commands.

## Development & Engineering Constraints
When implementing or modifying the ASSA system, adhere to these ironclad rules:

*   **Zero Latency (Non-Blocking)**: The main chat thread must never be blocked by LLM-based knowledge distillation. All heavy reasoning happens asynchronously via sub-agents (`distiller.md`, `syncer.md`).
*   **Anti-Context Bloat (Semantic Compression)**: Never inject raw conversation histories or massive Git diffs into the active context. The `Context Router` (via `BeforeAgent` hook) must only inject L1 `PENDING` items, L2 `patterns.md`, and the compressed L3 `LIBRARY/index.json`.
*   **Immutable Ledger**: Never physically delete memory. Even reverted actions (`/rewind`) must be marked as `REWOUND` in the ledger to serve as negative training data for the Distiller.

## Key Files and Directories
*   `docs/superpowers/specs/2025-05-22-assa-v3.1-design.md`: The definitive, finalized architectural blueprint for ASSA V3.2. **Always refer to this file for system design.**
*   `docs/superpowers/plans/`: Contains step-by-step implementation plans generated using the `writing-plans` skill.
*   `conductor/`: Contains the initial project scaffolding, including `product.md`, `tech-stack.md`, and `workflow.md`.

## Current Status
The project is currently transitioning from the **Specification Phase** to the **Implementation Phase**. The next steps involve scaffolding the `gemini-extension.json`, building the `assa_middleware.py` hook logic, and defining the Sub-Agent prompts (`distiller.md` and `syncer.md`).
