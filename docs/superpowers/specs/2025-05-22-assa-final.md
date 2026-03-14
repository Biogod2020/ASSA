# ASSA 2.0: The "Instant-Evolution" Agent Architecture
**Status**: Finalized Design Blueprint
**Date**: 2025-05-22

## 1. System Vision
ASSA (Autonomous Self-Sovereign Agent) is a highly reactive, self-evolving system built as a Gemini CLI extension. It sacrifices minimal chat latency (5-10s) in exchange for **instant, synchronous learning**. When you correct it, it learns immediately before speaking again.

---

## 2. Memory Architecture (HAM with Indexing)
To prevent Token Explosion while maintaining deep knowledge, memory is split into full texts and a summarized index.

### A. Global Layer (`~/.gemini/assa/`)
- `SOUL.md`: Core personality and unbreakable rules.
- `USER_HANDBOOK.md`: Your coding style and habits.
- `LIBRARY/`: The heavy encyclopedias (e.g., `PYTHON.md`, `ARCHITECTURE.md`).
- `index.json`: **The Knowledge Map**. A highly compressed summary of everything in the `LIBRARY/`.

### B. Local Layer (`./.memory/`)
- `patterns.md`: Project-specific quirks and rules.
- `state.json`: The "Last Processed Turn ID" (used for Rewind detection).

---

## 3. The "Single-Hook" Synchronous Engine
All complexity is handled by a single, powerful Python middleware script attached to the `BeforeAgent` hook.

### A. Rewind & State Healing
Every time you press Enter, `BeforeAgent` receives the full dialogue `transcript`.
- If `transcript_length < state.json[last_id]`: The hook knows you used `/rewind`. It instantly deletes any patterns learned after that turn, preventing "ghost learning."

### B. Synchronous Sub-Agent Spawning (The 5-10s Pause)
- The hook analyzes the new turns. If it detects a trigger (e.g., you said "Wrong", or a `git commit` occurred), it **pauses**.
- It synchronously spawns a Gemini CLI Sub-Agent (`gemini --agent distiller --prompt "Analyze these diffs..."`) in the background.
- The Sub-Agent updates `.memory/patterns.md`.
- The hook waits for the Sub-Agent to finish, ensuring the knowledge is written *before* the main agent generates its reply.

### C. Index Summarization Injection
- Once distillation is done, the hook reads `index.json` (the compressed map) and `patterns.md`.
- It injects this lightweight summary into `additionalContext`. 
- *Result*: The Main Agent knows *what* it knows, and can use tools to read the full `LIBRARY/` files if it needs deep details, saving massive amounts of tokens.

---

## 4. The Distiller Sub-Agent
A dedicated `.md` agent profile packaged with the extension.
- **Input**: Raw `git diff` data and recent chat history.
- **Task**: Answer "Why did the user make this change?"
- **Output**: Writes a concise rule to `patterns.md` or updates `USER_HANDBOOK.md`.

---

## 5. Implementation Roadmap
1. **Extension Scaffolding**: Create `gemini-extension.json` and the `agents/distiller.md` profile.
2. **The Middleware**: Write `scripts/assa_middleware.py` containing the `BeforeAgent` logic, Rewind detection, and synchronous `subprocess` spawning.
3. **Memory Initialization**: Create the local `.memory/` and global `~/.gemini/assa/` structures with the initial `index.json`.