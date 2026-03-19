# ASSA V3.5 Core Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the architectural core of ASSA V3.5: Distiller decision persistence, G1+G2 full injection in BeforeAgent hook, and autonomous subconscious memory judgment.

**Architecture:**
- **Distiller Skill**: Extend `assa-distiller` SOP to update `.memory/decisions.md` alongside `patterns.md`.
- **BeforeAgent Hook**: 
    - Always load full content (meat) for Tier 1 (Foundation) and Tier 2 (Domain) rules.
    - Replace hard context truncation at 20KB with a "Warning & Hint" mechanism.
    - Inject the "Subconscious Directive" to prompt the agent for proactive memory submission and source citation.

**Tech Stack:** Node.js, Shell, Vitest (for unit/integration testing).

---

### Task 1: Distiller Decision Persistence SOP

**Files:**
- Modify: `skills/assa-distiller/SKILL.md`
- Modify: `skills/assa-distiller/references/distillation_schema.md` (if exists)

- [ ] **Step 1: Update Distiller SOP**
    - Add a new section in `SKILL.md` for "Step 3.5: Decision Documentation".
    - Instruct the agent to identify significant architectural choices and log them in `.memory/decisions.md`.

- [ ] **Step 2: Verify with mock distillation**
    - Create a mock PENDING signal in `evolution_ledger.json`.
    - Manually trigger `distiller` (via `generalist`) and verify it updates both `patterns.md` and `decisions.md`.

- [ ] **Step 3: Commit**
```bash
git add skills/assa-distiller/SKILL.md
git commit -m "feat(distiller): expand SOP to update decisions.md during distillation"
```

---

### Task 2: Enhanced BeforeAgent Injection (T1/T2 Full)

**Files:**
- Create: `scripts/tests/assaV3.5.test.js`
- Modify: `hooks/beforeAgentHook.js`

- [ ] **Step 1: Write failing test for G1/G2 Injection**
    - In `scripts/tests/assaV3.5.test.js`, mock a `graph.json` with large G1/G2 rules.
    - Assert that `additionalContext` contains the *full* text of these rules, not just skeletons.

- [ ] **Step 2: Run test to verify failure**
Run: `node scripts/tests/assaV3.5.test.js`
Expected: FAIL (currently uses skeleton strategy for dependencies).

- [ ] **Step 3: Refactor `beforeAgentHook.js` injection logic**
    - Update `resolveGraph` or its usage to treat G1/G2 as "meat" seeds.
    - Ensure `G1_FOUNDATION` and `G2_DOMAIN` rules are always added to the `meat` Set.

- [ ] **Step 4: Run test to verify pass**
Run: `node scripts/tests/assaV3.5.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add hooks/beforeAgentHook.js scripts/tests/assaV3.5.test.js
git commit -m "feat(hook): implement full injection for G1 and G2 knowledge tiers"
```

---

### Task 3: Context Overflow Warning & Subconscious Prompt

**Files:**
- Modify: `scripts/tests/assaV3.5.test.js`
- Modify: `hooks/beforeAgentHook.js`

- [ ] **Step 1: Write failing test for 20KB Warning**
    - Mock a massive `additionalContext` (>20KB).
    - Assert that the response includes the `CONTEXT OVERHEAD EXCEEDED` warning but *retains* reflexes and essential metadata.

- [ ] **Step 2: Write failing test for Subconscious Prompt**
    - Assert that `additionalContext` contains the "Internal Memory Judgment" and "Traceability" directives.

- [ ] **Step 3: Update `beforeAgentHook.js`**
    - Refactor the 20KB guard block.
    - Update the `Emotion Sensor` prompt to include "Memory Judgment" and "Source Citation" requirements.

- [ ] **Step 4: Run tests to verify pass**
Run: `node scripts/tests/assaV3.5.test.js`
Expected: ALL PASS.

- [ ] **Step 5: Commit**
```bash
git add hooks/beforeAgentHook.js scripts/tests/assaV3.5.test.js
git commit -m "feat(hook): implement dynamic context warning and V3.5 subconscious directives"
```

---

### Task 4: Final Verification & Conductor Update

- [ ] **Step 1: Run full project health check**
Run: `node hooks/healthCheck.js`

- [ ] **Step 2: Manual End-to-End confirmation**
    - Start a fresh session.
    - Ask the agent: "你现在的注入逻辑有什么变化？你会如何记录我们的架构决策？"
    - Verify it mentions G1/G2 full injection and Distiller's new role.

- [ ] **Step 3: Update Conductor Track status**
```bash
# Update metadata.json to "completed"
```

- [ ] **Step 4: Final Commit**
```bash
git add conductor/tracks/assa_v3_5_core_evolution_20260318/
git commit -m "feat: complete ASSA V3.5 Core Evolution track"
```
