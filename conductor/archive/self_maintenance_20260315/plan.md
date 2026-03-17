# Implementation Plan: ASSA Self-Maintenance & Environment Guard

**Goal:** Implement autonomous environment verification and self-healing capabilities to ensure the ASSA evolution cycle remains uninterrupted.

## Phase 1: Diagnostic Foundation
- [x] Task: Implement `check_system_health` MCP tool
    - [x] Create a diagnostic module to check: `enableAgents` flag, Hook paths, Directory existence, and Ledger integrity.
    - [x] Expose this via the `assa-mcp` server.
- [x] Task: Integrate Health Check into `BeforeAgent` Hook
    - [x] Run a subset of diagnostics in the hook.
    - [x] Inject `### ASSA HEALTH WARNING ###` if critical issues are found.

## Phase 2: Autonomous Self-Healing
- [x] Task: Implement "Template Restorer"
    - [x] In `BeforeAgent`, check for missing L3 templates (`SOUL.md`, etc.) and restore them from the extension directory if missing.
- [x] Task: Autonomous Directory Recovery
    - [x] Ensure `.memory/` and global directories are recreated silently if deleted.
- [x] Task: Configuration Guard
    - [x] Proactively check `~/.gemini/settings.json` and provide a "fix" suggestion string if `enableAgents` is disabled.

## Phase 3: Validation & Stress Testing
- [ ] Task: Verify "Self-Healing" behavior
    - [ ] Manually delete `.memory/` and verify its automatic recreation.
- [ ] Task: Verify "Configuration Alerting"
    - [ ] Disable `enableAgents` and verify the warning injection.
- [ ] Task: Conductor - User Manual Verification 'Self-Maintenance' (Protocol in workflow.md)
