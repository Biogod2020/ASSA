# PATTERNS

- **success-pattern/architecture**: The 'Native Subagent Dispatch' architecture combined with 'Session-Aware Rewind Isolation' and 'Continuous Ledger Pruning' provides a production-grade self-evolution loop that the user finds 'Very Good'. (from mcp-1773565770047)
- **behavioral-evolution/signal-sensitivity**: Enhance 'Signal Sensitivity': The agent must actively scan every user turn for high-sentiment keywords (e.g., '很好', 'Perfect', 'Exactly', '不错') and immediately trigger 'submit_memory_signal' without waiting for manual correction. Missing a praise is as critical as missing a bug. (from mcp-1773566031658)
- **architecture-fix/subagent-synergy**: When dispatching evolution subagents, use 'ASSA_EVOLVING=true' to bypass hook recursion and ensure the distiller has '*' tool permissions in its .md profile. (from mcp-1773580026052)
- **architecture-fix/reliability/id-matching**: Cross-Platform Signal Validation: When syncing memory ledger with framework transcripts (Gemini CLI), never rely on single ID fields. Perform exhaustive text-searches across the entire turn content to bridge disparate ID namespaces (UUID vs MCP-ID). (from mcp-1773659112844)
- **success-pattern/deployment-victory/self-evolution**: Evolutionary Milestone: The ASSA V3.2 core reliability patch (incorporating enhanced praise detection, exhaustive ID search for rollbacks, and recovery logic) has been successfully deployed and verified in a live session. This architectural pattern for hook-based memory synchronization is now considered a 'Golden Standard' for future self-evolving extensions. (from mcp-1773661627792)
- **research-protocol/reliability/github-first**: Deep Sourcing Protocol: For any project involving rapidly evolving third-party frameworks or CLIs, DO NOT rely on internal training data or general web searches. You MUST clone the official repository or fetch raw source/docs to verify exact API signatures and payload structures. Empirical source analysis is the only path to 100% reliability in these contexts. (from mcp-1773662122498)

---
id: P-20260316-REFLX
category: Architecture
confidence: 10
status: Active
hit_count: 1
---
# Smart Reflex & Recency Priority
**Rationale**: In long conversations, the agent's core instructions can "drift," leading it to ignore subtle triggers like user praise or transient tool failures. Moving these "reflexes" to the bottom of the injected context (🚨 ASSA IMMEDIATE REFLEXES 🚨) ensures the agent acts on evolutionary impulses with high precision.
**Rule**: Always monitor the `🚨 ASSA IMMEDIATE REFLEXES 🚨` block at the bottom of the injected context. Treat these as high-priority "sub-conscious impulses" that require immediate tool action (e.g., `submit_memory_signal` for praise or victory). Prioritize these over general workflow steps.

---
id: P-20260316-METAD
category: Logic
confidence: 10
status: Active
hit_count: 1
---
# Metadata-Aware Victory Detection
**Rationale**: Fragile regex-based detection of success/failure in conversational history fails due to non-deterministic LLM output. Injecting structured metadata (`ASSA_METADATA: [SUCCESS/FAILED: tool]`) via system hooks provides a reliable source of truth for "Victory" (recovery) and "Barrier" (deadlock) detection, bridging disparate ID namespaces.
**Rule**: Use explicit tool-execution metadata (`ASSA_METADATA`) injected by system hooks to detect successful breakthroughs (Victory) or persistent technical obstacles (Barrier). Never rely solely on textual analysis of conversation history to determine tool success states.

---
id: P-20260316-RESRC
category: Logic
confidence: 10
status: Active
hit_count: 1
---
# Deep Research & Shadow Path Discovery
**Rationale**: Automated analysis tools often clone repositories or stage documentation in extension-specific temporary directories (e.g., `~/.gemini/tmp`) rather than the primary workspace. Limiting audits to known project folders leads to "missing link" failures where existing local resources are ignored.
**Rule**: When performing deep research or codebase mapping, systematically scan extension temporary directories (e.g., `~/.gemini/tmp`) in addition to primary workspace paths to identify hidden framework clones or research artifacts.
- **documentation-fix/release-integrity/victory-pattern**: Documentation Consistency & Legal Alignment: Before any release or public push, perform a mandatory cross-check between the physical LICENSE file and the README badges/sections. Legal consistency is a pillar of 'SOTA' technical integrity. (from mcp-1773663082852)
