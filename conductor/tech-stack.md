# Tech Stack: Self-Evolvement System for Gemini CLI

## Core Approach
- **Prompt Engineering Focus**: The primary engine for self-evolution is highly structured, sophisticated prompt engineering. The system will prioritize refinement and expansion through prompt design over external complexity.

## Languages & Logic
- **Minimal External Dependencies**: The system should remain lean and focused on the core Gemini CLI environment.
- **Node.js**: Primary language for middleware hooks and MCP servers, focusing on low-latency, zero-dependency implementations.
- **Python-Based (Optional)**: Secondary language for legacy logic or data analysis.

## State & Data Management
- **JSON/YAML Storage**: Use JSON and YAML for structured configuration, metadata, and skill definitions.
- **Diagnostic Foundation**: A dedicated health check module verifies environment integrity (e.g., experimental flags, hook connectivity) on every startup.

## Testing & Validation
- **Incremental Expansion Protocol**: Before any self-evolved code or skill is deployed, it must pass through a multi-stage validation process:
  - **Small-Scale (Unit) Tests**: Verifying individual logic components.
  - **Medium-Scale (Integration) Tests**: Ensuring compatibility with other skills.
  - **Large-Scale (System) Tests**: Validating full operation within the Gemini CLI environment.
- **Simulation/Dry-Run**: All tests must be completed and passed before the system can commit or execute any permanent updates.
