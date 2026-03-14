# Self-Evolving Agent (ASSA) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the core memory foundation and pattern distillation engine for the self-evolving agent.

**Architecture:** A hierarchical memory system (`.memory/`) using file-based storage, a Context Router for intent-based memory injection, and a Reflection-on-Failure loop for low-level knowledge abstraction.

**Tech Stack:** Python, JSON/YAML, Git-diff analysis, Markdown.

---

## Chunk 1: Memory Foundation (HAM)

### Task 1: Initialize `.memory/` Structure

**Files:**
- Create: `.memory/decisions.md`
- Create: `.memory/patterns.md`
- Create: `.memory/user_delta.json`
- Create: `.memory/README.md`

- [ ] **Step 1: Create the directory and initial files**
- [ ] **Step 2: Add initial schema and documentation to `.memory/README.md`**
- [ ] **Step 3: Commit**

### Task 2: Implement Context Router (Core Logic)

**Files:**
- Create: `src/evolution/context_router.py`
- Test: `tests/evolution/test_context_router.py`

- [ ] **Step 1: Write failing test for intent-to-memory mapping**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement minimal `ContextRouter`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

## Chunk 2: Distillation & Delta Engine

### Task 3: Implement Delta Analysis (Git-Diff Logic)

**Files:**
- Create: `src/evolution/delta_engine.py`
- Test: `tests/evolution/test_delta_engine.py`

- [ ] **Step 1: Write failing test for diff capture**
- [ ] **Step 2: Implement `DeltaEngine` with git-diff call**
- [ ] **Step 3: Run tests and verify**
- [ ] **Step 4: Commit**
