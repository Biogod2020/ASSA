# Repository State Overview (2026-03-17)

## 1. Architecture: Monorepo

- **Root**: Managed by `npm` workspaces.
- **Packages**:
  - `packages/core`: The main package containing ASSA logic.
    - `src/hooks/`: MCP server and hooks (currently JS/TS mixed).
    - `src/__tests__/`: Smoke tests.
    - `agents/`: Agent definitions (Distiller, Syncer, Skill Generator).

## 2. Tech Stack

- **Language**: TypeScript (v5.9.3) as the target.
- **Environment**: Node.js.
- **Tooling**:
  - **Lint**: ESLint (v10) with TypeScript support.
  - **Format**: Prettier (v3.8.1).
  - **Test**: Jest (v30) with `ts-jest`.
  - **Automation**: `Makefile` with `build`, `test`, `lint`, `format` targets.

## 3. Evolution System (ASSA)

- **Memory**: Managed in `.memory/` directory.
  - `evolution_ledger.json`: The raw signal ledger.
  - `patterns.md`: Distilled patterns (L2).
  - `staged_skills/`: Skills in development.
- **Hooks**: Located in `packages/core/src/hooks/`.

## 4. Current Goal

- **Official Alignment**: Migrating the current project structure and tooling to strictly follow the Gemini CLI official contributing guidelines.
- **Parallel Scaffolding**: Work is currently happening within this repo, aiming for a "Pristine Start" within `packages/`.
