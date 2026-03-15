# Specification: ASSA Self-Maintenance & Environment Guard

## Overview
This track aims to implement the "Self-Maintenance" core feature of ASSA. The goal is to make the system resilient to environmental misconfigurations, missing dependencies, or corrupted state. ASSA should be able to "heal" itself or at least proactively alert the user when its evolution cycle is broken.

## Functional Requirements
1.  **Environment Self-Check**:
    *   ASSA should verify its own configuration (e.g., `settings.json` experimental flags) on every startup.
    *   It should check if necessary directories (`.memory/`, `~/.gemini/assa/`) and files exist.
    *   It should verify that its Hooks are correctly registered and accessible.
2.  **Proactive Alerting**:
    *   If a critical failure is detected (e.g., `enableAgents` is false), ASSA must inject a high-priority warning into the `BeforeAgent` context.
    *   Provide clear instructions or "fix commands" to the user to resolve the issue.
3.  **Automated Self-Healing**:
    *   Automatically recreate missing default templates or directories if they are deleted.
    *   Attempt to fix minor configuration issues (e.g., missing `index.json`) autonomously.
4.  **Health Dashboard Tool**:
    *   Implement a tool (e.g., `check_system_health`) that provides a summary of the current ASSA state, memory stats, and environment integrity.

## Non-Functional Requirements
1.  **Zero Overhead**: The health check must be extremely fast (<5ms) to maintain the "Zero Latency" rule for hooks.
2.  **Non-Intrusive**: Warnings should only appear when the system's ability to evolve is actually compromised.

## Acceptance Criteria
- [ ] `BeforeAgent` hook performs a mandatory health check on startup.
- [ ] User receives a clear warning if `experimental.enableAgents` is disabled.
- [ ] System automatically recovers from a missing `.memory/` directory.
- [ ] `assa-mcp` server provides a `check_health` tool with detailed diagnostic output.
- [ ] A "Self-Healing" test case where a deleted template is automatically restored.
