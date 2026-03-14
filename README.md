# ASSA Evolution: Autonomous Self-Sovereign Agent

ASSA Evolution is a state-of-the-art self-evolving extension for the Gemini CLI. It enables the agent to autonomously learn from user interactions, correct its own mistakes, and adapt to implicit user habits.

## Key Features
- **Hierarchical Memory (HAM)**: Separates context into L1 (Transient Ledger), L2 (Local Project Patterns), and L3 (Global Universal Wisdom).
- **Immutable Ledger**: Uses an append-only JSON ledger with a state machine to track all realizations, including successes and rewinds.
- **Zero Latency**: All heavy knowledge distillation and global synchronization happen asynchronously in background sub-agents.
- **Auto-Setup**: Automatically initializes the global knowledge base (`~/.gemini/assa/`) upon first run.

## Architecture
Built as a Gemini CLI extension using:
- `BeforeAgent` hook for state alignment, rewind detection, and context injection.
- `AfterTool` hook for intercepting git actions and triggering background distillation.
- Custom tools for semantic memory compression.

## Installation
Symlink this directory into your `~/.gemini/extensions/` folder:
```bash
ln -s $(pwd) ~/.gemini/extensions/assa
```
