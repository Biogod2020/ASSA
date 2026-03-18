**English** | [中文版](README_CN.md)

# ASSA Evolution (Autonomous Self-Sovereign Agent)

[![ASSA Version](https://img.shields.io/badge/ASSA-v3.5--WEAVER-blueviolet?style=for-the-badge)](https://github.com/google-gemini/gemini-cli)
[![Gemini CLI](https://img.shields.io/badge/Gemini_CLI-Compatible-blue?style=for-the-badge)](https://github.com/google-gemini/gemini-cli)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

ASSA is a powerful enhancement plugin designed specifically for [Gemini CLI](https://github.com/google-gemini/gemini-cli). Its core mission is simple: **Enable AI to remember the mistakes you've made together and never repeat them in the next project.**

Normally, when using AI for programming, we often encounter repetitive errors or need to re-teach our coding habits in every new session. ASSA silently records, distills, and shares experiences in the background, transforming a "forgetful" executor into a development partner that gets better the more you use it.

---

## 🚀 How It Works

ASSA works by intercepting and analyzing every conversation, tool call, and code commit. It utilizes a **"Three-Tier Evolution Architecture"** driven by specialized sub-agents:

```mermaid
flowchart TD
    %% Define Styles
    classDef userNode fill:#FF9E9E,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef geminiNode fill:#AEC6CF,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef assaNode fill:#B4E197,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef memoryNode fill:#FDFD96,stroke:#333,stroke-width:2px,color:#000,stroke-dasharray: 5 5
    classDef subAgentNode fill:#CBAACB,stroke:#333,stroke-width:2px,color:#000

    %% Nodes
    User(("🧑‍💻 Developer<br/>(You)")):::userNode
    Gemini["🤖 Gemini CLI<br/>(Main Agent)"]:::geminiNode
    Hook_Before{"⚙️ BeforeAgent Hook<br/>(Context Injection)"}:::assaNode
    Hook_After{"⚙️ AfterTool Hook<br/>(Outcome Distillation)"}:::assaNode
    
    Mem_Local[("📂 L2 Local Memory<br/>(Project-specific)")]:::memoryNode
    Mem_Global[("🌐 L3 Global Wisdom<br/>(Cross-project)")]:::memoryNode
    
    SubAgent["🕵️ Distiller/Syncer<br/>(Background Sub-agents)"]:::subAgentNode

    %% Flow: Normal Conversation
    User -- "1. Question / Directive" --> Hook_Before
    Hook_Before -- "2. Inject Patterns" --> Gemini
    Mem_Local -.-> Hook_Before
    Mem_Global -.-> Hook_Before

    Gemini -- "3. Tool Call / Response" --> User
    Gemini -- "4. Intercept Output" --> Hook_After
    
    %% Flow: Reflex Evolution
    Hook_After -- "5. Detect Success (Victory)" --> Mem_Local
    
    %% Flow: Deep Evolution
    User -- "6. git commit / push" --> Hook_After
    Hook_After -- "7. Evaluate Significance" --> SubAgent
    SubAgent -- "8. Distill & Promote" --> Mem_Global
```

### Key Architectural Pillars:
- **The Weaver (V3.5 Automated Indexing)**: Transitioned from manual JSON maintenance to a fully automated, file-driven system. Markdown is now the **Single Source of Truth**; the `rebuildGraph.js` engine automatically generates high-performance JSON indexes (`graph.json`, `index.json`) with strict ID-collision and broken-link detection. In V3.5, it supports **G1/G2 Full Injection** (Foundation/Domain rules are always present) and **Dynamic Context Warnings** (replacing hard truncation at 20KB).
- **Decision Persistence (Architecture Log)**: Major architectural breakthroughs are now automatically recorded in `.memory/decisions.md` during distillation. This provides a chronological "Architectural Trail" of fundamental design choices, separate from transient coding patterns.
- **Significance Evaluation (Judgment Layer)**: Evolution doesn't blindly trigger on every trivial commit (like typo fixes). It uses a semantic layer to dispatch Distiller tasks only for architectural breakthroughs or logic shifts, saving tokens and improving memory quality.

---

## 🌟 Core Capabilities

### 1. Hierarchical Memory & Context Router
ASSA doesn't bloat the AI's context with everything. It organizes memory like a human brain:
- **Local Memory (L2)**: Project-specific coding standards and conventions.
- **Global Wisdom (L3)**: High-confidence architectural principles.
- **Context Router**: Automatically matches and loads relevant "wisdom blocks" based on your Current Working Directory (CWD), ensuring the AI is always in the optimal state for the task.

### 2. Smart Reflex & Semantic Emotion Sensing
ASSA is equipped with a highly sensitive semantic emotion sensor:
- **Recognizes Praise**: When you say "Perfect", "Good job", or "Exactly", it triggers an immediate reflex to record the successful path.
- **Reflective Evolution**: If the AI succeeds after a failed attempt, it automatically compares the "Failure vs. Success" diff to distill "pitfall avoidance" patterns.
- **Internal Memory Judgment**: The agent autonomously evaluates its own breakthroughs even without explicit praise.
- **Traceability (Source Citation)**: Whenever a rule is applied, the agent is mandated to briefly cite its Rule ID (e.g., [Rule: G1_CORE]) to maintain the evolution chain.

### 3. Subagent-Driven & Zero Friction
All time-consuming analysis (distillation, synchronization, index updates) is handled by isolated background sub-agents (Distiller / Syncer). The main interface remains lightning-fast.

### 4. Technical Integrity (SOTA Standards)
- **Deep Sourcing Protocol**: Prioritizes raw source code and official documentation over outdated training data for third-party frameworks.
- **Legal Consistency**: Automatically cross-checks LICENSE files with documentation to ensure project compliance.

---

## 🎭 Typical Evolution Case: Learning from Correction

The real magic of ASSA is turning your **"feedback"** and **"corrections"** into permanent **"productivity"**. Here is a real interaction log from this session:

```text
> Please check this mermaid diagram yourself using VLM. Many \n characters are not rendered correctly. Please audit carefully.

✦ I'll examine the Mermaid source in README.md and use the replace tool to fix the \n characters, likely by replacing them with <br/> for correct
  rendering.

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ ✓  ReadFile README.md                                                                                                                            │
│                                                                                                                                                  │
│ Read lines 20-60 of 114 from README.md                                                                                                           │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
✦ I'll fix the Mermaid rendering by replacing all literal \n with <br/> in the node labels, ensuring they're correctly interpreted as line breaks.

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ ✓  Edit README.md:     %% Nodes... =>     %% Nodes...                                                                                            │
│                                                                                                                                                  │
│ 27 - User(("🧑‍💻 开发者\n(你)")):::userNode                                                                                                        │
│ 28 - Gemini["🤖 Gemini CLI\n(主程序)"]:::geminiNode                                                                                              │
│ 27 + User(("🧑‍💻 开发者<br/>(你)")):::userNode                                                                                                     │
│ 28 + Gemini["🤖 Gemini CLI<br/>(主程序)"]:::geminiNode                                                                                           │
│ ...                                                                                                                                              │
│ ✓  submit_memory_signal (assa-mcp MCP Server) {"breakthrough":"Mermaid diagram nodes in README.md should use '<br/>' instead of '\\n' for line … │
│                                                                                                                                                  │
│ Signal appended to ledger as PENDING (id: mcp-1773820749980)                                                                                     │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
✦ Apologies for the oversight. In Mermaid node labels, \n is often not parsed correctly; <br/> should be used instead.

> **Great, please commit this.**

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ ✓  Shell git commit -m "docs: update README with V3.2+ features, fix Mermaid diagrams, and add real-world evolution case" && git status          │
│                                                                                                                                                  │
│ [master 3d3e286] docs: update README with V3.2+ features, fix Mermaid diagrams, and add real-world evolution case                        │
│ 3 files changed, 117 insertions(+), 62 deletions(-)                                                                                             │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

✦ I'll dispatch the ASSA Distiller subagent because the recent commit includes a significant update to hooks/afterToolHook.js...

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ ✓  Generalist Agent Delegating to agent 'generalist' (Distiller Persona)                                                                         │
│                                                                                                                                                  │
│ Result: I have completed the [ASSA Distiller] mission... Added P-20260318-LINEA and P-20260318-FAILR to patterns.md.                             │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

**[Outcome]**: Through this single interaction, ASSA automatically distilled the "Mermaid Forced Line-break Standard" and "Linear Interception Logic". In any future project, it will follow these rules by default without being re-taught.

### Case 2: Significance Evaluation (Judgment Layer)

ASSA is smart enough to avoid "distillation noise". When you make trivial changes (like translating documentation), it autonomously decides to skip the heavy analysis:

```text
> Localization to English completed. Commit the changes.

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ ✓  Shell git add README.md README_CN.md && git commit -m "docs: localize README to English..."                                                   │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

✦ I'll skip the distillation for this commit since it only involves documentation localization and doesn't introduce any architectural or logic changes.
```

**[Why this matters]**: This prevents the "Global Wisdom" library from being polluted by project-specific chores, keeping the AI's long-term memory high-signal and cost-efficient.

---

## 📦 Installation

Run the following command in your terminal:

```bash
gemini extensions install https://github.com/Biogod2020/ASSA.git
```

---

## ⌨️ How to Use

**Just use it as you normally would.**

ASSA is designed to be "invisible". Focus on your code and directives; it will evolve automatically when you `git commit` or provide positive feedback (e.g., "Good job").

To manually trigger wisdom promotion:
> "/assa promote" or "Help me promote mature L2 patterns to the global library."

---

## 🤝 Contributing
PRs are welcome! For development standards, see our [Workflow](conductor/workflow.md).

---

## ⚖️ License
MIT License. See `LICENSE` for details.

---
*Developed with ❤️ by the ASSA Architect.*
