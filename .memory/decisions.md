# DECISIONS

- **2026-03-19**: Migrated from "Event-Driven Evolution" to "Continuous Distillation" to ensure every user turn's delta is captured. (from mcp-1773901217232)
- **2026-03-19**: Hardened the hook reflex system by mandating English-only triggers and explicit tool-call instructions. (from mcp-1773900869387)
- **2026-03-19**: Established "Technical Narrative Principles" for project retrospectives, prioritizing ideas and authenticity over technical implementation. (from mcp-1773899990217)
- **2026-03-19**: Implemented "Recency Weighting" in context injection to mitigate Instruction Drift by leveraging the LLM's recency effect. (from mcp-1773902219426)
- **2026-03-19**: Introduced "Physical Coordinate Injection (ASSA_METADATA)" to resolve History Reading Failure and eliminate semantic ambiguity in tool outputs. (from mcp-1773902620892)
- **2026-03-19**: Mandated a "Visual QA Protocol" (VLM-based audit) for all tasks involving visual assets (SVG, Mermaid, PDF) within the `pdf_process` environment. (from mcp-1773903324305)
- **2026-03-19**: Pivoted to "High-Fidelity Visual QA" (Headless Chrome) to resolve blurry and broken renderings caused by lightweight PDF libraries (fitz). (from mcp-1773908886938)
