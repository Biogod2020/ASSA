# Autonomous Promoter V3.3 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade ASSA to a dependency-aware global intelligence system with recursive context injection and historical integrity.

**Architecture:** 
1.  **Global Graph**: Introduce `graph.json` in `~/.gemini/assa/` to manage rule dependencies.
2.  **Promoter Sub-agent**: Update `agents/syncer.md` logic to perform full L3 ingestion, semantic relationship discovery, and anti-drift validation.
3.  **Recursive BeforeHook**: Modify `hooks/beforeAgentHook.js` to traverse the dependency graph and load all prerequisite wisdom for a given session.

**Tech Stack:** Node.js, Markdown, JSON, Git.

---

## Chunk 1: Global Graph Infrastructure

**Files:**
- Create: `templates/graph.json`
- Modify: `hooks/beforeAgentHook.js:30-40` (ensureL3Setup)
- Test: `tests/graph_initialization.test.js`

### Task 1: Initialize Global Graph Structure

- [ ] **Step 1: Create template for `graph.json`**

```json
{
  "version": "3.3",
  "last_audit": "",
  "rules": {}
}
```

Run: `mkdir -p templates && write_file templates/graph.json`

- [ ] **Step 2: Update `ensureL3Setup` to provision `graph.json`**

Modify `hooks/beforeAgentHook.js` to include `graph.json` in the template copy list.

- [ ] **Step 3: Write test to verify `graph.json` provisioning**

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

test('should provision graph.json to global dir', () => {
    const globalGraph = path.join(os.homedir(), '.gemini', 'assa', 'graph.json');
    expect(fs.existsSync(globalGraph)).toBe(true);
});
```

- [ ] **Step 4: Commit**

```bash
git add templates/graph.json hooks/beforeAgentHook.js
git commit -m "feat(assa): initialize global graph.json infrastructure"
```

---

## Chunk 2: Promoter Logic Upgrade (Syncer V3.3)

**Files:**
- Modify: `agents/syncer.md`
- Modify: `hooks/afterToolHook.js` (Rename Syncer to Promoter in hints)
- Test: `archive/evolution_v3.2/tests/node/syncer_logic.test.js`

### Task 2: Implement "Stable Graph" Protocol in Syncer

- [ ] **Step 1: Update `agents/syncer.md` with Full Ingestion & Anti-Drift Guard**

Rewrite the Syncer persona to read all L3 files and `graph.json` before proposing changes. Add the 30% drift threshold rule.

- [ ] **Step 2: Update terminal hints in `hooks/afterToolHook.js`**

Change the wording from "Syncer" to "Promoter" to align with the new vision.

- [ ] **Step 3: Commit**

```bash
git add agents/syncer.md hooks/afterToolHook.js
git commit -m "feat(promoter): upgrade Syncer to Promoter V3.3 with Stable Graph protocol"
```

---

## Chunk 3: Recursive Context Injection

**Files:**
- Modify: `hooks/beforeAgentHook.js` (Resolve & Assemblage logic)
- Test: `tests/recursive_injection.test.js`

### Task 3: Implement Recursive Dependency Resolution

- [ ] **Step 1: Write a helper function `resolveDependencies(rules, graph)`**

In `hooks/beforeAgentHook.js`, add a function that takes seed rules and recursively returns all IDs in the dependency chain.

- [ ] **Step 2: Update `main` logic to use recursive resolution**

Modify the domain matching section to call `resolveDependencies` and load the resulting file list.

- [ ] **Step 3: Write E2E test for recursive loading**

1. Create Rule A depends on Rule B in global L3.
2. Trigger BeforeHook in a project matching Rule A's domain.
3. Verify Rule B is present in `additionalContext`.

- [ ] **Step 4: Commit**

```bash
git add hooks/beforeAgentHook.js
git commit -m "feat(hook): implement recursive context injection via dependency graph"
```
