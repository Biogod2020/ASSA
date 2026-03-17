# Implementation Plan: Gemini CLI Contribution Guidelines Alignment (New Repo)

## Phase 1: Repository Initialization and Base Configuration
- [ ] Task: Initialize New Git Repository
    - [ ] Create a new directory adjacent to the current project and initialize git.
    - [ ] Add `.gitignore` aligned with Node.js/TypeScript standards.
- [ ] Task: Initialize Monorepo Structure
    - [ ] Create `packages/` directory.
    - [ ] Create a root `package.json` with workspace configuration.
- [ ] Task: Configure TypeScript
    - [ ] Add `tsconfig.json` at the root with strict typing enabled.
- [ ] Task: Conductor - User Manual Verification 'Repository Initialization and Base Configuration' (Protocol in workflow.md)

## Phase 2: Tooling and Automation Setup
- [ ] Task: Setup ESLint and Prettier
    - [ ] Install ESLint and Prettier dependencies.
    - [ ] Create `eslint.config.js` and `.prettierrc` (enforcing 80-char line width).
    - [ ] Add `lint` and `format` scripts to the root `package.json`.
- [ ] Task: Create Makefile
    - [ ] Create a `Makefile` at the root with standard targets: `build`, `test`, `lint`, `format`.
- [ ] Task: Test Automation Setup
    - [ ] Configure a basic test runner (e.g., Jest or Vitest) at the root level to satisfy the official requirement for tests in PRs.
- [ ] Task: Conductor - User Manual Verification 'Tooling and Automation Setup' (Protocol in workflow.md)

## Phase 3: Migration Strategy & Scaffolding
- [ ] Task: Scaffold Core Package
    - [ ] Create `packages/core` directory.
    - [ ] Initialize `package.json` for the core package.
    - [ ] Port `gemini-extension.json` structure (as a template) into the new repo.
- [ ] Task: Prepare for Logic Migration
    - [ ] Create stub files for MCP server and hooks in TypeScript (`packages/core/src/hooks/mcpServer.ts`, etc.) to prepare for porting logic from the old repo.
- [ ] Task: Conductor - User Manual Verification 'Migration Strategy & Scaffolding' (Protocol in workflow.md)