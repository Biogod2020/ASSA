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
    classDef globalNode fill:#85C1E9,stroke:#333,stroke-width:2px,color:#000

    %% Nodes
    User(("🧑‍💻 Developer<br/>(You)")):::userNode
    Gemini["🤖 Gemini CLI<br/>(Main Agent)"]:::geminiNode
    Hook_Before{"⚙️ BeforeAgent Hook<br/>(Context Injection)"}:::assaNode
    Hook_After{"⚙️ AfterTool Hook<br/>(Signal Capture)"}:::assaNode
    
    Mem_L1[("📝 L1 Transient Memory<br/>(Raw Signals/Ledger)")]:::memoryNode
    Mem_L2[("📂 L2 Local Patterns<br/>(Project-specific)")]:::memoryNode
    
    subgraph L3 ["🌐 L3 Global Wisdom (The Weaver Library)"]
        direction TB
        G0["G0 Core Mandates"]
        G1["G1 Foundation Standards"]
        G2["G2 Domain Knowledge"]
        G3["G3 Tech Fragments"]
    end
    class L3 globalNode

    Sub_Distill["🕵️ Distiller Subagent"]
    Sub_Promote["🕵️ Promoter Subagent"]

    %% Flow: Normal Conversation
    User -- "1. Question / Directive" --> Hook_Before
    Hook_Before -- "2. Inject Rules" --> Gemini
    Mem_L2 -.-> Hook_Before
    L3 -.-> Hook_Before

    Gemini -- "3. Tool Call / Response" --> User
    Gemini -- "4. Intercept Output" --> Hook_After
    
    %% Flow: Evolution Chain
    Hook_After -- "5. Record" --> Mem_L1
    Mem_L1 -- "6. Distill" --> Sub_Distill
    Sub_Distill -- "7. Local Pattern" --> Mem_L2
    Mem_L2 -- "8. Promote" --> Sub_Promote
    Sub_Promote -- "9. Global Rule" --> L3
```

### 🌐 Active Global Knowledge Graph

Below is the live structure of the L3 Global Wisdom library, automatically maintained by the **Weaver (V3.5)** engine. It visualizes the hierarchical dependencies between engineering standards (G1), domain knowledge (G2), and utility fragments (G3).

```mermaid
graph TD
  subgraph G1 ["G1: Foundation (Core Standards)"]
    G1_EMPIRICAL_TRUTH{{"<b>G1-EMPIRICAL-TRUTH</b><br/>Empirical Truth & Reliable Execution"}}
    G1_INSTRUCTION_INTEGRITY{{"<b>G1-INSTRUCTION-INTEGRITY</b><br/>Instruction Integrity & Reflex Sovereignty"}}
    P_20260319_ARCH_GOVERNANCE{{"<b>P-20260319-ARCH-GOVERNANCE</b><br/>Architectural Governance & Deep Auditing"}}
    P_20260319_DUAL_AXIS{{"<b>P-20260319-DUAL-AXIS</b><br/>Dual-Axis Architectural Perspective"}}
  end
  subgraph G2 ["G2: Domain (Specialized Knowledge)"]
    P_20260318_PROMT("<b>P-20260318-PROMT</b><br/>Global Knowledge Curation (ASSA Promoter)")
    P_20260318_WEAVR_V3.5("<b>P-20260318-WEAVR-V3.5</b><br/>The Weaver Architecture (V3.5)")
    P_20260319_CONT_DISTILL("<b>P-20260319-CONT-DISTILL</b><br/>Continuous Distillation Protocol")
    P_20260319_INDEX_FIRST("<b>P-20260319-INDEX-FIRST</b><br/>Index-First Context Optimization Strategy")
    P_20260319_PHYSICAL_METADATA("<b>P-20260319-PHYSICAL-METADATA</b><br/>Physical Coordinate Injection (ASSA_METADATA)")
    P_20260319_SURGICAL_EDIT("<b>P-20260319-SURGICAL-EDIT</b><br/>Surgical Mutation & Deep Reading Protocol")
    P_20260319_VISUAL_QA("<b>P-20260319-VISUAL-QA</b><br/>Honest Visual Verification (Fidelity Audit)")
  end
  subgraph G3 ["G3: Fragment (Snippets & Tools)"]
    P_SKILL_CANDIDATE_REAL["<b>P-SKILL-CANDIDATE-REAL</b><br/>P-SKILL-CANDIDATE-REAL"]
    P_UNIVERSAL_NODEJS_MIDDLEWARE["<b>P-UNIVERSAL-NODEJS-MIDDLEWARE</b><br/>P-UNIVERSAL-NODEJS-MIDDLEWARE"]
    P_20260315_NODE_JS_MID["<b>P-20260315-NODE-JS-MID</b><br/>P-20260315-NODE-JS-MID"]
    U_20260315_IMMUTABILITY["<b>U-20260315-IMMUTABILITY</b><br/>U-20260315-IMMUTABILITY"]
    P_20260317_TS_INTF["<b>P-20260317-TS-INTF</b><br/>P-20260317-TS-INTF"]
  end
  P_20260319_DUAL_AXIS --> P_20260319_ARCH_GOVERNANCE
  P_20260319_PHYSICAL_METADATA --> P_20260319_CONT_DISTILL
  P_20260318_WEAVR_V3.5 --> P_20260319_INDEX_FIRST
  P_20260319_SURGICAL_EDIT --> P_20260319_VISUAL_QA

  %% Styling
  classDef style_G1 fill:#1a5fb4,stroke:#333,stroke-width:2px,color:#fff,font-family:Arial;
  class G1_EMPIRICAL_TRUTH,G1_INSTRUCTION_INTEGRITY,P_20260319_ARCH_GOVERNANCE,P_20260319_DUAL_AXIS style_G1;
  classDef style_G2 fill:#26a269,stroke:#333,stroke-width:2px,color:#fff,font-family:Arial;
  class P_20260318_PROMT,P_20260318_WEAVR_V3.5,P_20260319_CONT_DISTILL,P_20260319_INDEX_FIRST,P_20260319_PHYSICAL_METADATA,P_20260319_SURGICAL_EDIT,P_20260319_VISUAL_QA style_G2;
  classDef style_G3 fill:#9a9996,stroke:#333,stroke-width:2px,color:#fff,font-family:Arial;
  class P_SKILL_CANDIDATE_REAL,P_UNIVERSAL_NODEJS_MIDDLEWARE,P_20260315_NODE_JS_MID,U_20260315_IMMUTABILITY,P_20260317_TS_INTF style_G3;
```

### Key Architectural Pillars:
- **The Weaver (V3.5 Automated Indexing)**: Transitioned from manual JSON maintenance to a fully automated, file-driven system. Markdown is now the **Single Source of Truth**; the `rebuildGraph.js` engine automatically generates high-performance JSON indexes (`graph.json`, `index.json`) with strict ID-collision and broken-link detection.
- **Skeleton-First Resolution**: To prevent context window saturation in long sessions, V3.5 implements "Skeleton Loading." It loads full content only for active "Seed" nodes, while injecting only the ID, rationale, and file path (the Skeleton) for dependencies, reducing token overhead by up to 90%.
- **Evolutionary Tiers (L1-L3)**:
    - **L1 (Transient Memory)**: Raw tool outputs and semantic signals captured by the `AfterTool` hook.
    - **L2 (Local Patterns)**: Distilled project-specific conventions stored in `.memory/patterns.md`.
    - **L3 (Global Wisdom)**: Promoted cross-project knowledge organized into the **G-Series Hierarchy**:
        - **G0 (Core Mandates)**: Hardcoded safety and system integrity rules.
        - **G1 (Foundational Standards)**: Universal engineering principles (e.g., Instruction Integrity).
        - **G2 (Domain Knowledge)**: Specialized rules (e.g., Weaver Architecture, Promotion Protocol).
        - **G3 (Tech Fragments)**: Fine-grained snippets and specific tool knowledge.
- **Deep Empirical Research Protocol**: When internal training data is insufficient, ASSA is mandated to clone official repositories or fetch raw source code to verify API signatures, ensuring 100% reliability for modern frameworks.

---

## 🌟 Core Capabilities

### 1. Hierarchical Memory & Context Router
ASSA doesn't bloat the AI's context with everything. It organizes memory like a human brain:
- **Domain-Specific Patterns (G2)**: Project-specific coding standards and conventions derived from the L2 evolution cycle.
- **Global Engineering Standards (G1)**: High-confidence architectural principles and foundation standards stored in the L3 global library.
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
