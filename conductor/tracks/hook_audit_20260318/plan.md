# Implementation Plan: Official Hook Alignment & Reliability Audit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit all ASSA hooks against the official Gemini CLI repository to ensure reliability and V3.5 feature integrity, implementing surgical fixes where needed.

**Architecture:**
- Use `google_web_search` and `web_fetch` to analyze the official `google-gemini/gemini-cli` repository.
- Leverage the existing `scripts/tests/` suite for TDD verification.
- Adhere to the V3.5 hierarchical graph resolution logic in `beforeAgentHook.js`.

**Tech Stack:** Node.js, TypeScript (for reference), Shell, Vitest (for tests).

---

### Phase 1: Official Specification Analysis & Test Baseline

- [x] Task: Deep Audit of `google-gemini/gemini-cli` Hook Infrastructure [checkpoint: f1872ce]
    - [x] Search official repo for 'hooks' and 'BeforeAgent'/'AfterTool' definitions.
    - [x] Analyze `packages/core/src/hooks/` or equivalent paths in the official source.
    - [x] Verify payload structures (JSON schemas) for hook events.
- [x] Task: Establish Comprehensive Test Baseline [checkpoint: f1872ce]
    - [x] Analyze existing `scripts/tests/beforeAgentHook.test.js` and `scripts/tests/assaV3.5.test.js`.
    - [x] Create a new test suite `scripts/tests/officialAlignment.test.js` to mock official payloads.
    - [x] **TDD: Write failing tests** for any suspected discrepancies or edge cases identified in research.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Official Specification Analysis & Test Baseline' (Protocol in workflow.md)

### Phase 2: Hook Logic Alignment & Reliability Hardening

- [ ] Task: Audit and Refactor `beforeAgentHook.js`
    - [ ] Compare local logic with official event lifecycle.
    - [ ] Ensure `additionalContext` injection is correctly handled per official standards.
    - [ ] Harden error handling for file reads and JSON parsing.
- [ ] Task: Audit and Refactor `afterToolHook.js`
    - [ ] Verify tool-call outcome capture against official `AfterTool` event schema.
    - [ ] Refine `ASSA_METADATA` injection logic for reliability.
- [ ] Task: Audit `mcpServer.js` & Tool Interception
    - [ ] Verify MCP protocol compliance and tool-call routing.
    - [ ] Ensure zero-latency requirements are met during interception.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Hook Logic Alignment & Reliability Hardening' (Protocol in workflow.md)

### Phase 3: V3.5 Feature Integrity & Final Validation

- [ ] Task: Verify Weaver Indexing Integrity
    - [ ] Run `rebuildGraph.js` and verify against official file-system standards.
    - [ ] Ensure all 11 core rules are correctly resolved in the injected context.
- [ ] Task: Validate Semantic Emotion Sensor & Subconscious Directives
    - [ ] Test proactive signal submission and Rule ID citation in a mocked session.
    - [ ] Confirm 20KB dynamic warning behavior.
- [ ] Task: Final System Health Check
    - [ ] Run `node hooks/healthCheck.js` and resolve any remaining warnings.
    - [ ] Perform a final audit of the `README.md` for technical accuracy.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: V3.5 Feature Integrity & Final Validation' (Protocol in workflow.md)
