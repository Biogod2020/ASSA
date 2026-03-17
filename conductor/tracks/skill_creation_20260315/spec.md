# Specification: Autonomous Skill Evolution (Pattern-to-.skill)

## Overview

This track implements the final evolutionary leap for ASSA: the ability to transform distilled knowledge (L2/L3 Patterns) into executable capabilities (Native .skill files). This moves ASSA from "learning by remembering" to "evolving by building tools."

## Functional Requirements

1.  **L3 Skill Auditor**:
    - Extend the `syncer` subagent or create an `auditor` agent to scan L3 Global Library for "Skill Candidates".
    - Criteria: Patterns with high confidence (>=9) and clear procedural steps.
2.  **Autonomous Skill Generator**:
    - Leverage the internal `skill-creator` tool logic to scaffold a new `.skill` project.
    - Convert Markdown rules into `SKILL.md` instructions and bundled scripts if necessary.
3.  **Validation Pipeline (Test-Before-Deploy)**:
    - Before installation, the generator must create a mock test turn to verify the new skill's effectiveness.
    - Must pass `validate_skill.cjs` (from core) to ensure YAML frontmatter and structure are 100% correct.
4.  **One-Click Deployment**:
    - Provide an automated CLI command to package and install the generated `.skill` to the user's scope.

## Technical Constraints

- **Format**: Must output standard Gemini CLI `.skill` packages.
- **Security**: No auto-installation of code that performs non-read-only operations without a specific safety profile.
- **Zero Bloat**: Only promote patterns that cannot be effectively handled by prompt-only injection.

## Acceptance Criteria

- [ ] Auditor can identify a "Skill Candidate" from L3 wisdom.
- [ ] Generator creates a valid `.skill` package that passes `gemini skills validate`.
- [ ] Verification turn successfully proves the new skill improves task performance.
- [ ] User can install the generated skill with a single confirmation.
