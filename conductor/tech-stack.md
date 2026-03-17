# Tech Stack: Self-Evolvement System for Gemini CLI

## Core Approach
- **Prompt Engineering Focus**: The primary engine for self-evolution is highly structured, sophisticated prompt engineering. The system will prioritize refinement and expansion through prompt design over external complexity.

## Languages & Logic
- **Minimal External Dependencies**: The system should remain lean and focused on the core Gemini CLI environment.
- **TypeScript (Strict)**: Mandatory for all new core logic (Hooks, MCP servers). Must follow official `google-gemini/gemini-cli` standards.
- **Node.js**: Primary runtime, utilizing Monorepo patterns (packages/*) for modular logic management.
- **Python-Based (Optional)**: Secondary language for legacy logic or data analysis.

## Repository Architecture
- **Monorepo Structure**: Core logic organized into packages (e.g., `packages/core`).
- **Official Compliance**: Adhere to official `CONTRIBUTING.md` standards (Prettier 80-char width, ESLint, Makefile-driven workflow).

## State & Data Management
- **JSON/YAML Storage**: Use JSON and YAML for structured configuration, metadata, and skill definitions.
- **Selective State Migration**: During structural transitions, only planning (Conductor) and memory (.memory) state should be migrated, keeping codebase pristine.
- **Diagnostic Foundation**: A dedicated health check module verifies environment integrity (e.g., experimental flags, hook connectivity) on every startup.

## Testing & Validation
- **Official Test Integration**: All core packages must include tests (Jest/Vitest) to satisfy official PR requirements.
- **Incremental Expansion Protocol**: Before any self-evolved code or skill is deployed, it must pass through a multi-stage validation process:
  - **Small-Scale (Unit) Tests**: Verifying individual logic components.
  - **Medium-Scale (Integration) Tests**: Ensuring compatibility with other skills.
  - **Large-Scale (System) Tests**: Validating full operation within the Gemini CLI environment.
- **Simulation/Dry-Run**: All tests must be completed and passed before the system can commit or execute any permanent updates.
