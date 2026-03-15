# ASSA V3.2 Compliance & Auto-Setup Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the ASSA extension to meet Gemini CLI standards and implement an automated setup mechanism for the L3 global tier.

**Architecture:** 
- **Manifest**: Enrich `gemini-extension.json` with metadata and JSON schemas.
- **Auto-Setup**: The `BeforeAgent` hook will detect missing L3 directories and automatically populate them from internal templates.
- **Directory Standard**: `scripts/` -> `hooks/`, add `skills/` and `templates/`.

**Tech Stack:** Python, JSON, Markdown.

---

## Chunk 1: Manifest Enrichment & Directory Migration

### Task 1: Update Manifest & Restructure Folders

**Files:**
- Create: `hooks/` (directory)
- Modify: `gemini-extension.json`

- [ ] **Step 1: Create standard directories**
- [ ] **Step 2: Move existing scripts to `hooks/`**
- [ ] **Step 3: Rewrite `gemini-extension.json` with metadata and schemas**
- [ ] **Step 4: Commit refactor**

---

## Chunk 2: Automated Global Setup

### Task 2: Implement Templates & Auto-Initialization

**Files:**
- Create: `templates/SOUL.md`
- Create: `templates/USER_HANDBOOK.md`
- Create: `templates/index.json`
- Modify: `hooks/before_agent_hook.py`

- [ ] **Step 1: Create default L3 templates in `templates/`**
- [ ] **Step 2: Update `before_agent_hook.py` to handle auto-setup**
- [ ] **Step 3: Commit auto-setup logic**

---

## Chunk 3: Final Polishing

### Task 3: Add README and License

- [ ] **Step 1: Create `README.md`**
- [ ] **Step 2: Create `LICENSE`**
- [ ] **Step 3: Final Commit**
