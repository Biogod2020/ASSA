# ASSA Distillation Schema (V3.5)

To maintain a searchable and high-signal pattern library, every distilled rule in `.memory/patterns.md` MUST follow this schema.

## 📝 YAML Frontmatter
```yaml
---
id: [P-YYYYMMDD-XXXX]         # Unique ID (e.g., P-20260318-REGEX)
category: [Architecture | Style | Logic | Habit]
confidence: [1-10]            # Initial confidence (usually 5-8)
status: [Experimental | Active | Deprecated]
hit_count: [NUMBER]           # Number of times this pattern was applied/observed
---
```

## 📖 Content Structure
```markdown
# [Concise Title]
**Rationale**: [The "Architectural Why" - Why is this rule necessary? What physical failure or user preference does it solve?]
**Rule**: [The literal, actionable instruction for the agent. Avoid "we should", use "you MUST".]
```

## 🧬 Lifecycle
1. **New Signal**: Captured in `evolution_ledger.json`.
2. **Distillation**: Subagent runs `assa-distiller` skill -> `.memory/patterns.md`.
3. **Promotion**: Subagent runs `assa-promoter` skill -> Global Library.
