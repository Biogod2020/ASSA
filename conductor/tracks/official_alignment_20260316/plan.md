# Implementation Plan: Gemini CLI Contribution Guidelines Alignment (New Repo)

## Phase 0: Knowledge Foundation (Completed)
- [x] Task: Distill Official Guidelines
  - [x] Fetch and summarize `CONTRIBUTING.md` and `README.md`.
  - [x] Create `.memory/OFFICIAL_ALIGNMENT.md`.
- [x] Task: Audit Current Repository State
  - [x] Systematically read and document current structure.
  - [x] Create `.memory/REPO_STATE.md`.

## Phase 1: Repository Initialization and Base Configuration (Completed)
- [x] Task: Initialize New Git Repository Structure
  - [x] Current root `package.json` configured with workspaces.
  - [x] `.gitignore` updated.
- [x] Task: Configure TypeScript
  - [x] Add `tsconfig.json` at the root with strict typing enabled.
- [x] Task: Conductor - User Manual Verification (Done manually)

## Phase 2: Tooling and Automation Setup (Completed)
- [x] Task: Setup ESLint and Prettier
  - [x] `eslint.config.js` and `.prettierrc` created.
  - [x] Root `package.json` has `lint` and `format` scripts.
- [x] Task: Create Makefile
  - [x] `Makefile` created with `build`, `test`, `lint`, `format`.
- [x] Task: Test Automation Setup
  - [x] `jest.config.js` and `ts-jest` configured.
- [x] Task: Conductor - User Manual Verification (Done manually)

## Phase 3: Migration Strategy & Scaffolding (In Progress)
- [~] Task: Scaffold Official-Aligned Package Structure
  - [x] `packages/core` created with `package.json`, `src/hooks`, `src/__tests__`.
- [~] Task: Port Logic with Strict Typing
  - [x] Migrated `ledger.js` logic to `ledger.ts`.
  - [x] Migrated `afterToolHook.js` logic to `afterToolHook.ts`.
  - [~] Migrated `mcpServer.js` logic to `mcpServer.ts` (Core logic only).
- [ ] Task: Conductor - User Manual Verification 'Migration Strategy & Scaffolding' (Protocol in workflow.md)

## Phase 4: Core Logic Testing and Verification (In Progress)
- [x] Task 1: Test LedgerManager (checkpoint: b66f272)
  - [x] **Step 1: Write failing tests for LedgerManager** (Adding signals, marking processed, distilling).
  - [x] **Step 2: Run tests to verify red state**.
  - [x] **Step 3: Fix/Verify LedgerManager implementation** (Minimal code for green state).
  - [x] **Step 4: Run tests to verify green state**.
  - [x] **Step 5: Verify >80% coverage for ledger.ts**.

- [ ] Task 2: Test AfterToolHook (Smart Reflex)
  - [ ] **Step 1: Write failing tests for AfterToolHook** (Victory detection, Barrier detection).
  - [ ] **Step 2: Run tests to verify red state**.
  - [ ] **Step 3: Fix/Verify AfterToolHook implementation**.
  - [ ] **Step 4: Run tests to verify green state**.
  - [ ] **Step 5: Verify >80% coverage for afterToolHook.ts**.

- [ ] Task 3: Test MCP Server Integration (Mocked SDK)
  - [ ] **Step 1: Write failing tests for AssaMcpServer** (Handler registration, Tool calling logic).
  - [ ] **Step 2: Run tests to verify red state**.
  - [ ] **Step 3: Fix/Verify AssaMcpServer implementation**.
  - [ ] **Step 4: Run tests to verify green state**.
