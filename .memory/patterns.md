# PATTERNS

---
id: P-20260319-CONT-DISTILL
category: Architecture
confidence: 9
status: Active
hit_count: 2
---
# Continuous Distillation Protocol
**Rationale**: Technical decisions and session deltas were being lost because the system only recorded explicit "breakthroughs" or "corrections". Continuous distillation ensures a 100% capture rate of the architectural intent and delta behind every user turn, preventing knowledge gaps in long sessions.
**Rule**: After every user turn, you MUST analyze the dialogue delta and current intent. You MUST call `submit_memory_signal` (type: positive/neutral) to persist technical realizations, path choices, or project context even if no explicit breakthrough or correction occurred. This action takes precedence over the final response.

---
id: P-20260319-RECENCY-WEIGHTING
category: Architecture
confidence: 10
status: Active
hit_count: 3
---
# Recency-Based Context Injection
**Rationale**: LLM attention is naturally biased towards the end of the provided context (Recency Effect). Instructions placed at the top of a long, code-heavy prompt are frequently "diluted" or overridden by subsequent tokens, leading to Instruction Drift.
**Rule**: Always place mission-critical system instructions, mandatory next-step directives, and ASSA Reflex triggers at the absolute end of the injected context in the `BeforeAgent` hook. This ensures they are the "last thing" the model processes before generating a response, maximizing compliance and preventing stylistic drift.

---
id: P-20260319-PHYSICAL-METADATA
category: Tooling
confidence: 9
status: Active
hit_count: 2
---
# Physical Coordinate Injection (ASSA_METADATA)
**Rationale**: Relying on the agent to semantically "guess" the outcome of previous tool calls from a messy transcript leads to History Reading Failure and hallucinations. Providing unforgeable physical markers ensures the agent has a reliable "ground truth" to reason from.
**Rule**: All state-mutating tool outputs MUST be wrapped in physical status markers (e.g., `[SUCCESS: tool_name]`, `[ERROR: tool_name]`) via the `AfterTool` hook. When performing distillation or history analysis, the agent MUST prioritize these physical markers over semantic inference to avoid misinterpreting the physical state of the repository.

---
id: P-20260319-LAZY-AGENT-GUARD
category: Style
confidence: 9
status: Active
hit_count: 2
---
# Lazy Agent Mitigation (Zero-Truncation)
**Rationale**: Agents may attempt to "cut corners" by truncating long-form content, omitting visual assets (Mermaid, SVG), or providing generic summaries instead of deep narratives. This usually happens during high-load tasks or when "polishing" existing work.
**Rule**: NEVER truncate, remove, or summarize established long-form content (e.g., blogs, specs) or visual assets unless explicitly instructed to do so. For project retrospectives, you MUST maintain a minimum narrative depth (e.g., 200+ lines) and ensure all previously generated diagrams are preserved and integrated. Prioritize "Thought Evolution" over generic filler.

---
id: P-20260319-NARRATIVE-STYLE
category: Style
confidence: 8
status: Active
hit_count: 2
---
# Technical Narrative Principles
**Rationale**: Standard technical blogs often get bogged down in low-level code details, losing the "Human Experience" and the "Conceptual Why". Users prefer high-level architectural journeys that are authentic to the physical Git history and dialogue logs.
**Rule**: When drafting technical retrospectives or project sharings:
1. **Narrative Authenticity**: You MUST perform exhaustive cross-referencing between physical Git history (diffs/logs) and semantic conversation transcripts. Do not rely on internal memory for historical facts.
2. **Conceptual Focus**: Prioritize 'Conceptual Why' and 'Human Experience' over technical implementation details. Use high-level architectural terminology (e.g., 'MCP to Sub-agents') unless deep technical diving is requested.
3. **End-to-End Journey**: Structure the narrative as a chronological journey from start to finish, highlighting key milestones.

---
id: P-20260319-HARDENING
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Instruction Hardening & Linguistic Standardization
**Rationale**: Mixed-language or soft-suggestive prompts lead to non-deterministic tool execution and "lazy" agent behavior where memory persistence is skipped. Hardening ensures critical reflex actions (like memory submission) are always performed.
**Rule**: All system-level directives and reflex triggers MUST be defined in English and MUST include explicit, mandatory instructions to call specific MCP tools. Avoid soft suggestions; use 'You MUST IMMEDIATELY call [tool_name]'. Every trigger MUST be linked to a specific, mandatory tool-call action.

---
id: P-20260319-VISUAL-QA-FIDELITY
category: Verification
confidence: 10
status: Active
hit_count: 3
---
# Honest Visual Verification (Fidelity Audit)
**Rationale**: Lightweight PDF/HTML injectors (e.g., PyMuPDF) often fail to render complex SVG, CSS, or JS-based charts (like Mermaid), leading to blurry, broken, or incomplete assets. Relying on "Visual Success" without high-fidelity rendering and rigorous auditing creates a "False Victory" where the user receives a broken product despite the agent's confidence. High-fidelity rendering is the ultimate truth.
**Rule**: For all high-stakes visual assets (SVG, Mermaid, PDF, or Project Retrospectives):
1. **Browser-First Rendering**: You MUST NOT rely on basic HTML-to-PDF injectors. ALWAYS prefer a headless browser (Chrome) for high-fidelity rendering to ensure all CSS, SVG, and JS components are fully processed.
2. **Post-Process DOM Transformation**: When rendering Mermaid diagrams in a browser, avoid renderers that inject destructive HTML tags (like `<br>`) into code blocks. Instead: (a) Render raw Markdown to HTML, (b) Manually transform syntax blocks in the DOM, (c) Call `mermaid.run()` explicitly.
3. **Full-Context Injection**: NEVER use partial testing templates for public assets. ALWAYS inject the full final source into the renderer to ensure layout consistency.
4. **High-Resolution Ground Truth**: Specify a minimum resolution (e.g., 300+ DPI or 2x device scale) and verify that SVG rendering is natively supported in the output.
5. **Syntax Simplification**: If diagrams fail to render, prioritize "Syntax Simplification" (e.g., switching from subgraphs to flowcharts) to ensure stability.
6. **Honest Visual QA**: Before declaring victory, you MUST perform a "Fidelity Audit" via VLM or manual inspection, checking for: (a) Blurriness, (b) SVG/Icon success, (c) Layout precision, (d) Textual fallback reliability.

---
id: P-20260319-ARCH-DUAL-AXIS
category: Architecture
confidence: 10
status: Active
hit_count: 2
---
# Dual-Axis Architectural Perspective
**Rationale**: Conflating the recursive summarization process (L-series) with the hierarchical knowledge graph (G-series) leads to logical ambiguity. A dual-axis perspective ensures clarity between "How data moves" and "How data is organized".
**Rule**: When documenting or designing the system, you MUST distinguish between:
1. **L-Series (L1-L3)**: Vertical Depth / Process Evolution (Recursive summarization path: Ledger -> Pattern -> Library).
2. **G-Series (G0-G3)**: Horizontal Breadth / Structure Evolution (Hierarchical knowledge tiers within the Weaver Graph).
Use these terms precisely to reflect the evolution from "Recursive Lists" to "Hierarchical Graphs" and avoid logical drift.
