# Implementation Plan: Autonomous Skill Evolution (Pattern-to-.skill)

**Goal:** Implement the ability to autonomously transform high-confidence L3 patterns into native Gemini CLI skills.

## Phase 1: Auditor & Candidate Identification
- [ ] Task: Extend `agents/syncer.md` with Auditor logic
    - [ ] Update Syncer prompt to identify "Skill Candidates" (patterns with procedural logic and high confidence).
- [ ] Task: Implement `check_skill_candidates` logic in Syncer
    - [ ] Create a mock test case for auditor identification.
- [ ] Task: Conductor - User Manual Verification 'Auditor & Candidate Identification' (Protocol in workflow.md)

## Phase 2: Skill Generation Engine
- [ ] Task: Create `agents/skill_generator.md` subagent profile
    - [ ] Define prompt for converting Markdown rules into `SKILL.md` format.
    - [ ] Add support for generating basic accompanying scripts (Node.js).
- [ ] Task: Implement Skill Scaffolding logic
    - [ ] Integration with `skill-creator` core script.
- [ ] Task: Conductor - User Manual Verification 'Skill Generation Engine' (Protocol in workflow.md)

## Phase 3: Validation & One-Click Deploy
- [ ] Task: Implement Automated Validation Turn
    - [ ] Use `validate_skill.cjs` to ensure structural integrity of the generated skill.
- [ ] Task: Implement Staging & Installation command
    - [ ] Provide a wrapper for `gemini skills install --scope user`.
- [ ] Task: Conductor - User Manual Verification 'Validation & One-Click Deploy' (Protocol in workflow.md)
