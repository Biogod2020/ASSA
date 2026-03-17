---
name: complex-procedural-pattern
description: Enforces a decomposed, step-by-step verification workflow for complex feature implementation, ensuring that each logical unit is validated before final execution.
---

# Complex Procedural Pattern

## Overview

The Complex Procedural Pattern provides a rigorous framework for implementing non-trivial features by decomposing them into a sequence of verified sub-tasks. This approach minimizes the risk of cascading failures and ensures high-fidelity results through incremental validation.

## Workflow: Verified Decomposition

When tasked with a complex feature or multi-stage implementation, you MUST follow this procedural sequence:

### 1. Architectural Decomposition

Break the high-level request into discrete, manageable logical units (Step 1, Step 2, ..., Step N). Each step must have a clear objective and a verifiable outcome.

### 2. Incremental Implementation & Verification

For each step identified in the decomposition:

1. **Implement**: Execute the code changes or configurations required for that specific step.
2. **Verify**: Run targeted tests, linting, or manual checks to confirm that the step's objective has been met.
3. **Checkpoint**: Do NOT proceed to the next step until the current step is 100% verified.

### 3. Final Integration & Global Validation

After all incremental steps are completed and verified:

1. **Integrate**: Ensure all components work together as a unified feature.
2. **Global Validation**: Execute the final, comprehensive validation command (e.g., E2E tests, full build, or system-wide health checks) to confirm the overall integrity of the feature.

## Rationale

This pattern is mandatory for complex engineering contexts to prevent "silent failures" where a bug in an early stage remains undetected until the final integration, significantly increasing the cost of debugging and rework.

## Resources

### references/

- `decomposition_guide.md`: Detailed strategies and examples for breaking down complex tasks into verifiable units.
