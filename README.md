# 🤖 ASSA Evolution: The Self-Evolving Architect

[![ASSA Version](https://img.shields.io/badge/ASSA-v3.2--SOTA-blueviolet?style=for-the-badge)](https://github.com/google-gemini/gemini-cli)
[![Gemini CLI](https://img.shields.io/badge/Gemini_CLI-Compatible-blue?style=for-the-badge)](https://github.com/google-gemini/gemini-cli)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**ASSA Evolution** is an Autonomous Self-Sovereign Agent extension for the [Gemini CLI](https://github.com/google-gemini/gemini-cli). It transforms a standard AI agent into a self-evolving system that learns from its own mistakes, captures user preferences, and distills project-specific patterns into long-term architectural wisdom.

---

## 🚀 Key Features

### 🧠 Hierarchical Memory (HAM)
ASSA implements a three-tier memory hierarchy to ensure high-performance context management:
- **L1 (Transient Ledger)**: Captures raw signals and realizations during a session.
- **L2 (Local Patterns)**: Distills project-specific rules, styles, and "Architectural Whys" into `.memory/patterns.md`.
- **L3 (Global Wisdom)**: Promotes mature patterns to a universal library (`~/.gemini/assa/`) shared across all your projects.

### ⚡ Smart Reflex (Introspective Evolution)
ASSA V3.2 introduces the **Smart Reflex** system. By injecting "sub-conscious impulses" at the bottom of the context, the agent can:
- **Praise Sensitivity**: Automatically capture successful patterns when you say "Perfect" or "Good job."
- **Victory Detection**: Recognize when a previously failing tool succeeds and analyze the "breakthrough."
- **Barrier Detection**: Perform Root Cause Analysis (RCA) on persistent technical deadlocks.

### 🔄 Subagent-Driven Execution
To maintain zero latency and avoid context pollution, ASSA delegates heavy cognitive tasks to specialized sub-agents:
- **[ASSA Distiller]**: A forensic analyst that extracts architectural rules from git diffs and logs.
- **[ASSA Syncer]**: A curator that promotes project-level wisdom to global engineering principles.

### 🛡️ Metadata-Aware Reliability
Built for the real world, ASSA uses hook-injected metadata (`ASSA_METADATA`) to bridge disparate session namespaces, ensuring 100% reliable success/failure detection even when LLM output is non-deterministic.

---

## 🛠️ Architecture

ASSA operates through a sophisticated hook-and-agent loop:

1.  **BeforeAgent Hook**: Aligns state, detects conversation "Rewinds," and injects the memory hierarchy.
2.  **MCP Server**: Provides the `assa-mcp` tools for signaling, distilling, and promoting patterns.
3.  **AfterTool Hook**: Intercepts Git actions (commit/push) to trigger asynchronous evolution.
4.  **Specialized Agents**: Independent `.md` profiles for the Distiller, Syncer, and Skill Generator.

---

## 📦 Installation

### 1. Clone the Extension
```bash
git clone https://github.com/your-username/assa-evolution.git
cd assa-evolution
```

### 2. Install Dependencies
```bash
npm install # if applicable
# Or ensure you have the required Python environment for background scripts
pip install -r archive/python/requirements.txt
```

### 3. Register Extension
Symlink the project into your Gemini CLI extensions directory:
```bash
ln -s $(pwd) ~/.gemini/extensions/assa
```

---

## ⌨️ Usage

ASSA is designed to be **invisible but intelligent**. Simply use the Gemini CLI as you normally would.

- **Automatic Evolution**: ASSA will automatically record patterns when you commit or provide positive feedback.
- **Manual Promotion**: You can force a global synchronization by saying:
  > "/assa promote" or "Audit and sync my patterns."
- **Skill Generation**: ASSA can even generate its own tools and skills based on the patterns it has learned.

---

## 📜 ASSA Philosophy

> "An agent that doesn't learn from its mistakes is just a script. An agent that evolves is a partner."

ASSA is built on the principle of **Autonomous Self-Sovereignty**. It doesn't just execute commands; it guards technical integrity and pioneers the path towards truly autonomous engineering.

---

## 🤝 Contributing

We welcome contributions to the ASSA core! Please see our [Workflow](conductor/workflow.md) for architectural guidelines.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Developed with ❤️ by the ASSA Architect.*
