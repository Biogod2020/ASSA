# PATTERNS

- **success-pattern/architecture**: The 'Native Subagent Dispatch' architecture combined with 'Session-Aware Rewind Isolation' and 'Continuous Ledger Pruning' provides a production-grade self-evolution loop that the user finds 'Very Good'. (from mcp-1773565770047)
- **behavioral-evolution/signal-sensitivity**: Enhance 'Signal Sensitivity': The agent must actively scan every user turn for high-sentiment keywords (e.g., '很好', 'Perfect', 'Exactly', '不错') and immediately trigger 'submit_memory_signal' without waiting for manual correction. Missing a praise is as critical as missing a bug. (from mcp-1773566031658)
- **architecture-fix/subagent-synergy**: When dispatching evolution subagents, use 'ASSA_EVOLVING=true' to bypass hook recursion and ensure the distiller has '*' tool permissions in its .md profile. (from mcp-1773580026052)
