# Specification: ASSA V3.5 Core Evolution

## Overview
This track implements the core architectural upgrades for ASSA V3.5, focusing on decision persistence, context density optimization, and autonomous memory judgment.

## Functional Requirements

### 1. Distiller Decision Persistence
- Expand the responsibility of the `Distiller` agent to include updating `.memory/decisions.md`.
- When a new pattern is distilled, if it represents a significant architectural shift or choice, Distiller must record the context (why, trade-offs) in `decisions.md`.
- Ensure consistent formatting between `patterns.md` updates and `decisions.md` entries.

### 2. Enhanced BeforeAgent Injection (G1+G2 Full)
- Refactor `beforeAgentHook.js` to support "Indiscriminate Injection" for Tier 1 (Foundation) and Tier 2 (Domain) knowledge.
- Remove hardcoded size thresholds for G1/G2 rules.
- Implement a "Warning & Hint" mechanism: if the total context exceeds 20KB, prepend a prominent warning to the agent suggesting they run `syncer` to consolidate knowledge, instead of silently truncating.

### 3. Internal Memory Judgment (Subconscious Prompt)
- Inject a high-priority "Subconscious Directive" into the `BeforeAgent` hook.
- This directive instructs the agent to:
    - Actively evaluate the current conversation context for implicit learnings or breakthroughs.
    - Explicitly decide *before responding* whether to submit a memory signal via `submit_memory_signal`.
    - Reference lower-level (G0/G1) knowledge whenever a higher-level pattern is triggered.

### 4. Traceability & Knowledge Sourcing
- Update the prompt to require the agent to cite its knowledge sources (Rule IDs) when making architectural recommendations.

## Acceptance Criteria
- [ ] `assa-distiller` skill can successfully update `.memory/decisions.md`.
- [ ] `beforeAgentHook.js` correctly injects full G1/G2 content regardless of size.
- [ ] A >20KB context triggers a warning in the injected hook context.
- [ ] The agent demonstrates proactive memory submission for non-failing but valuable implementations.

## Out of Scope
- Modifying the physically stored `rebuildGraph.js` logic (already V3.5 ready).
