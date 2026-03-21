# PATTERNS

---
id: P-20260319-NARRATIVE-STYLE
category: Style
confidence: 8
status: PROMOTED
hit_count: 3
---
# Technical Narrative Principles
**Rationale**: Standard technical blogs often get bogged down in low-level code details, losing the "Human Experience" and the "Conceptual Why".
**Rule**: When drafting technical retrospectives or project sharings, you MUST:
1. **Maintain Narrative Authenticity**: Perform exhaustive cross-referencing between physical Git history (diffs/logs) and semantic conversation transcripts. You MUST NOT rely on internal memory for historical facts.
2. **Prioritize Conceptual Focus**: Focus on the 'Conceptual Why' and 'Human Experience' over technical implementation details. You MUST use high-level architectural terminology (e.g., 'MCP to Sub-agents') unless deep technical diving is requested.
3. **Structure as an End-to-End Journey**: Organize the narrative as a chronological journey from start to finish, highlighting key milestones.

---
id: P-20260319-INDEX-FIRST
category: Architecture
confidence: 10
status: PROMOTED
hit_count: 2
---
# Index-First Context Optimization Strategy
**Rationale**: When context overhead exceeds manageable limits, injecting the full content of all patterns leads to token bloat and performance degradation.
**Rule**: When context overhead exceeds manageable limits, you MUST prioritize 'Index-Skeleton' (ID and Title) injection over 'Full-Meat' content. You MUST be explicitly prompted to use 'read_file' proactively for any matched rule IDs.

---
id: P-20260319-SURGICAL-EDIT
category: Tooling
confidence: 10
status: PROMOTED
hit_count: 6
---
# Surgical Mutation & Deep Reading Protocol
**Rationale**: Overwriting entire files destroys nuance and introduces risk of regression. Multi-line logic in shell commands is fragile.
**Rule**: You MUST perform a 'Surgical-Edit-after-Deep-Read':
1. **Deep Reading**: Read the full target block before modification.
2. **Precision Edits**: Use the `replace` tool with significant context (5-10 lines) to ensure precision. You MUST NOT perform 'Lazy Overwrites'.
3. **Buffer-and-Move**: For updates outside the workspace (e.g., L3 Library), you MUST NOT use complex multi-line shell logic. Instead:
    - Use `write_file` to create a clean, unescaped temp file in the workspace.
    - Use a single-line shell command (e.g., `cat temp >> target`) to update the target.
4. **Local Repository Constraint**: Specifically prioritize deep reading of 'external/gemini-cli-source' when modifying hook logic.

---
id: P-20260319-PROGRESS-AUDIT
category: Inquiry
confidence: 10
status: PROMOTED
hit_count: 1
---
# Dual-Axis Progress Audit Protocol
**Rationale**: Progress tracking should encompass both task completion (Horizontal) and system evolution maturity (Vertical).
**Rule**: When a user asks for 'progress', you MUST perform a dual-axis audit:
1. **Horizontal Audit**: Review progress across all active Conductor tracks.
2. **Vertical Audit**: Assess the maturity of the ASSA evolution (L/G series).
3. **Evidence Citation**: You MUST cite the most recent 'Victory' or 'Breakthrough' from the ledger for narrative continuity.

---
id: P-20260320-REDUNDANCY-GOV
category: Governance
confidence: 10
status: PROMOTED
hit_count: 2
---
# Redundancy & Conflict Governance
**Rationale**: Automated resolution of conflicting patterns can lead to loss of nuance or destructive updates.
**Rule**: When you detect redundancy, overlap, or conflict between patterns (L2 or L3):
1. **Deep Read**: You MUST perform a deep read of all involved patterns to understand their delta.
2. **Main Process Only**: Resolution MUST be restricted to the main process.
3. **Human-in-the-Loop**: You MUST ask the user for modification or consolidation advice before making any changes.

---
id: P-20260320-PROCESS-SOVEREIGNTY
category: Architecture
confidence: 10
status: PROMOTED
hit_count: 2
---
# Cross-Process Sovereignty & Flagging
**Rationale**: Subagents cannot interact with users; directing them to do so causes failure.
**Rule**: 
1. **No Consultation**: Subagents (e.g., Promoter, Distiller) MUST NOT attempt interactive user consultation.
2. **Flagging Mechanism**: If a subagent detects a condition requiring user input, it MUST signal this back to the local ledger or via a specific context flag.
3. **Main Agent Authority**: The Main Agent MUST be the sole authority for user consultation and final consolidation.

---
id: P-20260320-INSTALL-RESILIENCE
category: Infrastructure
confidence: 9
status: PROMOTED
hit_count: 2
---
# Installation Resilience Fallback
**Rationale**: Network restrictions or 403 errors can break standard npm/release downloads.
**Rule**: When standard extension installation fails, you MUST fallback to 'git clone' mode. Immediately after reinstallation, you MUST verify the physical synchronization of the Weaver graph and configuration files.

---
id: P-20260320-MANIFEST-ALIGN
category: Governance
confidence: 10
status: PROMOTED
hit_count: 1
---
# Manifest & Metadata Alignment
**Rationale**: Mismatched versions and descriptions across manifest, README, and internal directives cause cognitive drift.
**Rule**: During systematic manifest updates, you MUST align versioning and descriptions across extension metadata, README.md, and internal 'Soul' directives.

---
id: P-20260320-RELEASE-HYGIENE
category: Governance
confidence: 10
status: PROMOTED
hit_count: 1
---
# Release Readiness & Snapshot Archiving
**Rationale**: Stale snapshots and temporary files clutter the repository and increase cognitive load.
**Rule**: For every version bump, you MUST:
1. **Audit Snapshots**: Identify and archive superseded snapshots to 'archive/memory_snapshots/'.
2. **Harden Ignore**: Update '.gitignore' to exclude session-specific temporary files and log artifacts.

---
id: P-20260320-GIT-HYGIENE
category: Optimization
confidence: 10
status: PROMOTED
hit_count: 1
---
# Large Repository Exclusion (Git Hygiene)
**Rationale**: Tracking large research clones or mirror repositories in the main index causes massive bloat and sync issues.
**Rule**: You MUST exclude large research clones or mirror repositories from the main repo's git index using `git rm --cached` and appropriate `.gitignore` entries.
