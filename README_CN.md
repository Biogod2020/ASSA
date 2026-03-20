[English Version](README.md) | **中文版**

# ASSA Evolution (自动进化代理)

[![ASSA Version](https://img.shields.io/badge/ASSA-v3.5--WEAVER-blueviolet?style=for-the-badge)](https://github.com/google-gemini/gemini-cli)
[![Gemini CLI](https://img.shields.io/badge/Gemini_CLI-Compatible-blue?style=for-the-badge)](https://github.com/google-gemini/gemini-cli)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

ASSA 是专为 [Gemini CLI](https://github.com/google-gemini/gemini-cli) 编写的一个增强插件。它的核心目标很简单：**让 AI 记住你们一起踩过的坑，并在下一个项目中不再犯同样的错。**

平时我们使用 AI 编程时，经常会遇到它反复犯同样的错误，或者每次新开一个对话都需要重新教它你的代码习惯。ASSA 通过在后台悄悄记录、提炼和共享经验，把一个“健忘”的执行者，变成一个会越用越顺手的开发伙伴。

---

## 🚀 它是如何工作的？

ASSA 的核心在于拦截并分析每一次对话、每一次工具调用和代码提交。它采用“三层级进化架构”和“子代理驱动模式”：

```mermaid
flowchart TD
    %% Define Styles
    classDef userNode fill:#FF9E9E,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef geminiNode fill:#AEC6CF,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef assaNode fill:#B4E197,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef memoryNode fill:#FDFD96,stroke:#333,stroke-width:2px,color:#000,stroke-dasharray: 5 5
    classDef subAgentNode fill:#CBAACB,stroke:#333,stroke-width:2px,color:#000

    %% Nodes
    User(("🧑‍💻 开发者<br/>(你)")):::userNode
    Gemini["🤖 Gemini CLI<br/>(主程序)"]:::geminiNode
    Hook_Before{"⚙️ BeforeAgent Hook<br/>(环境感知注入)"}:::assaNode
    Hook_After{"⚙️ AfterTool Hook<br/>(成果捕获提炼)"}:::assaNode
    
    Mem_G3[("📝 G3 瞬态模式<br/>(原始信号/账本)")]:::memoryNode
    Mem_G2[("📂 G2 项目专家<br/>(本地代码规范)")]:::memoryNode
    Mem_G1[("🌐 G1 全球标准<br/>(通用工程智慧)")]:::memoryNode
    
    SubAgent["🕵️ 提炼助手/晋升助手<br/>(后台子代理)"]:::subAgentNode

    %% Flow: Normal Conversation
    User -- "1. 提问 / 指令" --> Hook_Before
    Hook_Before -- "2. 注入规则" --> Gemini
    Mem_G2 -.-> Hook_Before
    Mem_G1 -.-> Hook_Before

    Gemini -- "3. 工具调用 / 回答" --> User
    Gemini -- "4. 拦截并复盘成果" --> Hook_After
    
    %% Flow: Reflex Evolution
    Hook_After -- "5. 捕获原始信号" --> Mem_G3
    
    %% Flow: Deep Evolution
    User -- "6. git commit / push" --> Hook_After
    Hook_After -- "7. 派发显著性任务" --> SubAgent
    
    %% The Sequential Chain
    Mem_G3 -- "8. 提炼为项目模式" --> SubAgent
    SubAgent --> Mem_G2
    Mem_G2 -- "9. 晋升为全球标准" --> SubAgent
    SubAgent --> Mem_G1
```

### 🌐 活跃全局知识图谱

以下是 L3 全局智慧库的实时结构，由 **Weaver (V3.5)** 引擎自动维护。它可视化了工程标准 (G1)、领域知识 (G2) 和工具碎片 (G3) 之间的层级依赖关系。

```mermaid
graph TD
  subgraph G1 ["G1: 基础层 (核心标准)"]
    G1_EMPIRICAL_TRUTH{{"<b>G1-EMPIRICAL-TRUTH</b><br/>实证真理与可靠执行守则"}}
    G1_INSTRUCTION_INTEGRITY{{"<b>G1-INSTRUCTION-INTEGRITY</b><br/>指令完整性与反射主权协议"}}
    P_20260319_ARCH_GOVERNANCE{{"<b>P-20260319-ARCH-GOVERNANCE</b><br/>架构治理与深度审计"}}
    P_20260319_DUAL_AXIS{{"<b>P-20260319-DUAL-AXIS</b><br/>双轴架构视角"}}
  end
  subgraph G2 ["G2: 领域层 (专项知识)"]
    P_20260318_PROMT("<b>P-20260318-PROMT</b><br/>全球知识晋升协议 (ASSA Promoter)")
    P_20260318_WEAVR_V3_5("<b>P-20260318-WEAVR-V3.5</b><br/>Weaver 织网者架构 (V3.5)")
    P_20260319_CONT_DISTILL("<b>P-20260319-CONT-DISTILL</b><br/>持续提炼协议")
    P_20260319_INDEX_FIRST("<b>P-20260319-INDEX-FIRST</b><br/>索引优先上下文优化策略")
    P_20260319_PHYSICAL_METADATA("<b>P-20260319-PHYSICAL-METADATA</b><br/>物理坐标注入 (ASSA_METADATA)")
    P_20260319_SURGICAL_EDIT("<b>P-20260319-SURGICAL-EDIT</b><br/>手术刀式变动与深度阅读协议")
    P_20260319_VISUAL_QA("<b>P-20260319-VISUAL-QA</b><br/>诚实的视觉校验 (高保真审计)")
  end
  subgraph G3 ["G3: 碎片层 (代码片段与工具)"]
    P_SKILL_CANDIDATE_REAL["<b>P-SKILL-CANDIDATE-REAL</b><br/>技能候选验证"]
    P_UNIVERSAL_NODEJS_MIDDLEWARE["<b>P-UNIVERSAL-NODEJS-MIDDLEWARE</b><br/>通用Node.js中间件规范"]
    P_20260315_NODE_JS_MID["<b>P-20260315-NODE-JS-MID</b><br/>Node.js 中间件增强"]
    U_20260315_IMMUTABILITY["<b>U-20260315-IMMUTABILITY</b><br/>不可变性原则"]
    P_20260317_TS_INTF["<b>P-20260317-TS-INTF</b><br/>TypeScript Interface 优先"]
  end
  P_20260319_DUAL_AXIS --> P_20260319_ARCH_GOVERNANCE
  P_20260319_PHYSICAL_METADATA --> P_20260319_CONT_DISTILL
  P_20260318_WEAVR_V3_5 --> P_20260319_INDEX_FIRST
  P_20260319_SURGICAL_EDIT --> P_20260319_VISUAL_QA

  %% Styling
  classDef style_G1 fill:#1a5fb4,stroke:#333,stroke-width:2px,color:#fff,font-family:Arial;
  class G1_EMPIRICAL_TRUTH,G1_INSTRUCTION_INTEGRITY,P_20260319_ARCH_GOVERNANCE,P_20260319_DUAL_AXIS style_G1;
  classDef style_G2 fill:#26a269,stroke:#333,stroke-width:2px,color:#fff,font-family:Arial;
  class P_20260318_PROMT,P_20260318_WEAVR_V3_5,P_20260319_CONT_DISTILL,P_20260319_INDEX_FIRST,P_20260319_PHYSICAL_METADATA,P_20260319_SURGICAL_EDIT,P_20260319_VISUAL_QA style_G2;
  classDef style_G3 fill:#9a9996,stroke:#333,stroke-width:2px,color:#fff,font-family:Arial;
  class P_SKILL_CANDIDATE_REAL,P_UNIVERSAL_NODEJS_MIDDLEWARE,P_20260315_NODE_JS_MID,U_20260315_IMMUTABILITY,P_20260317_TS_INTF style_G3;
```

### 关键架构：
- **Weaver 织网者 (V3.5 自动化索引)**：从手动维护 JSON 转向全自动的文件驱动系统。Markdown 成为 **Single Source of Truth**；脚本自动生成高性能索引并具备严格的 ID 冲突和死链检测。
- **Skeleton-First 骨架优先解析**：针对长对话场景，V3.5 引入“骨架加载”机制。仅为当前活跃节点加载全文，其余依赖节点仅注入 ID 和核心摘要（骨架），节省高达 90% 的上下文 Token。
- **G0-G3 层级化知识图谱**：
    - **G0 (核心指令)**：硬编码的安全与系统完整性规则。
    - **G1 (基础标准)**：通用工程原则 (如 TDD, 逻辑模式)。
    - **G2 (领域专家)**：针对具体项目的代码规范与本地习惯。
    - **G3 (瞬态模式)**：待提炼的近期交互原始信号。
- **Deep Empirical Research (深度实证研究)**：当内部训练数据不足时，ASSA 会自动克隆官方源码或获取原始文档以验证 API 签名，确保 100% 的可靠性。

---

## 🌟 核心能力

### 1. 分层记忆与智能路由 (Context Router)
ASSA 不会把所有的聊天记录都塞给 AI。它像人脑一样整理记忆：
- **项目专项模式 (G2)**：针对当前项目的特定代码规范，由 L2 进化周期自动生成。
- **全球工程标准 (G1)**：具有通用价值的架构原则与基础标准，固化于 L3 全局库中。
- **智能路由**：根据你当前的工作目录 (CWD)，自动匹配并加载相关的“智慧块”，确保 AI 始终处于最适合当前任务的状态。

### 2. 深度反射与情绪感知 (Smart Reflex)
ASSA 拥有极其灵敏的“语义情绪传感器”：
- **听得懂正反馈**：当你对 AI 说“Perfect”、“很好”或“这就是我要的”时，它会瞬间触发反射，将该成功的路径记录为 L2 信号。
- **反思性进化**：如果 AI 经历了一次失败的尝试后成功修复了问题，它会自动对比“失败-成功”的差异，沉淀出避坑经验。

### 3. 后台驱动与零感干扰 (Subagent-Driven)
所有耗时的分析任务（提炼、同步、索引更新）均由独立的后台子代理 (Distiller / Syncer) 完成，主界面依然秒回你的问题。

### 4. 技术完整性保障 (SOTA Integrity)
- **Deep Sourcing 协议**：在涉及第三方框架时，优先查阅官方源码和最新文档，确保 100% 可靠。
- **法律一致性校验**：自动核对 LICENSE 与文档说明，确保项目的严谨性。

---

## 🎭 典型进化案例：从纠错中学习

ASSA 最大的魅力在于它能将你的**“吐槽”**和**“指正”**瞬间转化为永久的**“生产力”**。以下是刚才发生的一个真实交互片段（原始终端输出）：

```text
> 请你自己使用vlm能力看看这个mermaid图,当前有大量的\n没有被转译,请你务必仔细审核

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
✦ 非常抱歉，这是我的疏忽。在 Mermaid 节点的 Label 中，\n 往往无法被正确解析为换行，而应该使用 <br/>。

> **很好,请你commit一下**

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ ✓  Shell git commit -m "docs: update README with V3.2+ features, fix Mermaid diagrams, and add real-world evolution case" && git status          │
│                                                                                                                                                  │
│ [master 3d3e286] docs: update README with V3.2+ features, fix Mermaid diagrams, and add real-world evolution case                        │
│ 3 files changed, 117 insertions(+), 62 deletions(-)                                                                                             │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

✦ I'll dispatch the ASSA Distiller subagent because the recent commit includes a significant update to hooks/afterToolHook.js and architectural 
  documentation improvements.

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ ✓  Generalist Agent Delegating to agent 'generalist' (Distiller Persona)                                                                         │
│                                                                                                                                                  │
│ Result: I have completed the [ASSA Distiller] mission... Added P-20260318-LINEA and P-20260318-FAILR to patterns.md.                             │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

**[进化成果]**：通过这次交互，ASSA 不仅修复了排版，还自动沉淀了“Mermaid 强制换行规范”和“线性拦截逻辑”。下次在任何新项目中，它都会默认遵循这些规范，并能更准确地捕捉工具执行状态。

### 案例 2：显著性评估 (Judgment Layer)

ASSA 足够聪明，能够避免“提炼噪音”。当你进行琐碎改动（如翻译文档）时，它会自动决定跳过沉重的分析过程：

```text
> 英文翻译完成，请 commit。

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ ✓  Shell git add README.md README_CN.md && git commit -m "docs: localize README to English..."                                                   │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

✦ 我将跳过此提交的提炼过程，因为它仅涉及文档本地化，并未引入任何架构或逻辑变更。
```

**[核心价值]**：这防止了“全局智慧库”被项目特定的琐事污染，确保 AI 的长期记忆保持高信号、高效率。

---

## 📦 安装说明

你只需要在终端中运行一行官方支持的安装命令即可：

```bash
gemini extensions install https://github.com/Biogod2020/ASSA.git
```

---

## ⌨️ 如何使用

**直接像平时一样用就行了。**

ASSA 被设计成“无感”的。你只需要专注于写代码、给指令，它会在你 `git commit` 或给予正馈（如“干得好”）时自动进化。

如果你想手动触发经验同步，可以直接对 AI 说：
> "/assa promote" 或 "帮我把当前项目的成熟经验 promote 到全局库。"

---

## 🤝 参与贡献
欢迎随时提 PR！如果你想了解我们的开发规范，可以看看 [Workflow](conductor/workflow.md)。

---

## ⚖️ 许可证
本项目基于 MIT License 开源，详见 `LICENSE`。

---
*Developed with ❤️ by the ASSA Architect.*
