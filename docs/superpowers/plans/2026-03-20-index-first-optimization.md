# Index-First Context Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize injected memory context by transitioning from "Full-Meat" injection to "Index-First" (Skeleton) for L2 patterns and G2 domain rules, reducing overhead from 25KB to ~5-8KB.

**Architecture:** 
1.  Refactor `hooks/beforeAgentHook.js` to categorize rules into `meat` (full text) or `skeleton` (summarized) based on their tier (G1 vs G2/L2).
2.  Implement a local pattern parser to skeletonize `.memory/patterns.md`.
3.  Harden the "Proactive Reading Directive" at the end of the injected context to ensure Agent autonomy in fetching full rule content.

**Tech Stack:** Node.js (Hook environment), JavaScript.

---

### Task 1: Research & Baseline

**Files:**
- Modify: `hooks/beforeAgentHook.js`
- Test: Create `tests/context_baseline_test.js`

- [ ] **Step 1: Read the current Hook source code**
I need to understand the exact structure of `resolveGraph` and the injection loop.
Run: `cat hooks/beforeAgentHook.js`

- [ ] **Step 2: Create a reproduction script to measure current context size**
Create a script that simulates the `BeforeAgent` hook execution with the current `.memory/patterns.md` and global library.
Expected: Output showing ~25KB of data.

### Task 2: Refactor resolveGraph for Tiered Loading

**Files:**
- Modify: `hooks/beforeAgentHook.js`

- [ ] **Step 1: Update resolveGraph logic**
Modify the logic to only add G0 and G1 nodes to the `meat` set. All other nodes (G2, G3, L2) should default to the `skeleton` set.
- [ ] **Step 2: Implement Skeleton formatter**
Ensure the skeleton format includes: `#### RULE ID: [ID] - [Title]\nRationale: [Rationale]\n[Triggers]\nPath: [Physical Path]`

### Task 3: Local Pattern Skeletonization

**Files:**
- Modify: `hooks/beforeAgentHook.js`

- [ ] **Step 1: Implement parseLocalPatterns**
Create a function that reads `.memory/patterns.md` and extracts only the YAML metadata + Rationale for each block, instead of the full file.
- [ ] **Step 2: Integrate into injection loop**
Replace the full-file read of `patterns.md` with the skeletonized output.

### Task 4: Directive Hardening & Final Assembly

**Files:**
- Modify: `hooks/beforeAgentHook.js`

- [ ] **Step 1: Add [ARCHITECTURAL SENSITIVITY MANDATE]**
Inject the proactive reading directive at the absolute end of the `additionalContext`.
- [ ] **Step 2: Verification of Context Size**
Run the reproduction script from Task 1.
Expected: Output showing context size < 10KB.

### Task 5: Final Validation & Cleanup

- [ ] **Step 1: End-to-End Test**
Ask a question that triggers a skeletonized G2 rule and verify that I (the Agent) proactively call `read_file` to see the full content.
- [ ] **Step 2: Commit & Final Push**

### Task 6: Conflict & Redundancy Management (Main Agent)

- [ ] **Step 1: Implement Redundancy Detection Instruction**
Add a directive to the system prompt (or injected context) that instructs the Agent to compare newly read rule content with existing indexed rules.
- [ ] **Step 2: Define "Ask User" Protocol**
Specify that if a conflict or redundancy is found, the Agent MUST NOT proceed with modification/promotion silently. It MUST read all involved entries and present a consolidation proposal to the user.
- [ ] **Step 3: Verification of Inter-Rule Integrity**
Simulate a scenario where a local pattern overlaps with an L3 rule and verify the Agent asks the user for guidance.

