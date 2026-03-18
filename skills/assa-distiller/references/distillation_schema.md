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

## 📜 Decision Record Format
Significant architectural decisions should be appended to `.memory/decisions.md` following this structure:
```markdown
- **YYYY-MM-DD**: [Concise summary of the decision] (from [message_id])
```

### Criteria for a "Decision":
- **Fundamental Shift**: Changes to the core communication protocol or hook architecture.
- **Milestones**: Deployment of a new versioned pattern (e.g., ASSA V3.5).
- **Consensus**: A pattern that has reached high confidence (9+) or has been explicitly praised as "critical" by the user.

## 🧬 Lifecycle
1. **New Signal**: Captured in `evolution_ledger.json`.
2. **Distillation**: Subagent runs `assa-distiller` skill -> `.memory/patterns.md`.
3. **Decision Record**: If significant -> `.memory/decisions.md`.
4. **Promotion**: Subagent runs `assa-promoter` skill -> Global Library.
