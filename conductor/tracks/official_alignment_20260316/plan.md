# Implementation Plan: Gemini CLI Contribution Guidelines Alignment (New Repo)

## Phase 1: Repository Initialization and Base Configuration
- [x] Task: Initialize New Git Repository
    - [x] Create a new directory adjacent to the current project and initialize git.
    - [x] Add `.gitignore` aligned with Node.js/TypeScript standards.
- [x] Task: Initialize Monorepo Structure
    - [x] Create `packages/` directory.
    - [x] Create a root `package.json` with workspace configuration.
- [x] Task: Configure TypeScript
    - [x] Add `tsconfig.json` at the root with strict typing enabled.
- [x] Task: Conductor - User Manual Verification 'Repository Initialization and Base Configuration' (Protocol in workflow.md) [checkpoint: cc07645]

## Phase 2: Tooling and Automation Setup
- [x] Task: Setup ESLint and Prettier
    - [x] Install ESLint and Prettier dependencies.
    - [x] Create `eslint.config.js` and `.prettierrc` (enforcing 80-char line width).
    - [x] Add `lint` and `format` scripts to the root `package.json`.
- [x] Task: Create Makefile
    - [x] Create a `Makefile` at the root with standard targets: `build`, `test`, `lint`, `format`.
- [x] Task: Test Automation Setup
    - [x] Configure a basic test runner (e.g., Jest or Vitest) at the root level to satisfy the official requirement for tests in PRs.
- [ ] Task: Conductor - User Manual Verification 'Tooling and Automation Setup' (Protocol in workflow.md)

## Phase 3: Migration Strategy & Scaffolding
- [x] Task: Scaffold Core Package
    - [x] Create `packages/core` directory.
    - [x] Initialize `package.json` for the core package.
    - [x] Port `gemini-extension.json` structure (as a template) into the new repo.
- [x] Task: Prepare for Logic Migration
    - [x] Create stub files for MCP server and hooks in TypeScript (`packages/core/src/hooks/mcpServer.ts`, etc.) to prepare for porting logic from the old repo.
- [x] Task: Conductor - User Manual Verification 'Migration Strategy & Scaffolding' (Protocol in workflow.md) [checkpoint: 12ff532]