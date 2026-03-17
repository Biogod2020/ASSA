# Gemini CLI Official Alignment Guidelines

Distilled from `CONTRIBUTING.md` and `README.md` on 2026-03-17.

## 1. Project Structure (Monorepo)

- **`packages/cli/`**: CLI implementation.
- **`packages/core/`**: Core logic.
- **`packages/test-utils/`**: Test infrastructure.
- **`docs/`**: Documentation (managed by `sidebar.json`).
- **`scripts/`**: Build/test/dev scripts.

## 2. Code Style & Standards

- **Formatting**: Prettier (`npm run format`).
- **Linting**: ESLint (`npm run lint`), strictly no cross-package relative imports.
- **Docs**: Google Developer Documentation Style Guide (2nd person, present tense, short paragraphs).
- **Line Width**: Enforce 80 characters (standard for Gemini projects).

## 3. Development Workflow

- **Node.js**: `~20.19.0` (Development), `>=20` (Production).
- **Commands**:
  - `npm install`: Install deps.
  - `npm run build`: Build.
  - `npm start`: Start CLI.
  - `npm run preflight`: Run all checks (test, lint, format) before PR.
- **Sandboxing**: `GEMINI_SANDBOX=true` for safety.

## 4. Testing Requirements

- **Unit/Integration**: `npm run test` (Jest/Vitest).
- **E2E**: `npm run test:e2e`.
- **Requirement**: All PRs must include tests.

## 5. PR & Contribution

- **Issue Association**: Every PR must link to an approved Issue.
- **Atomic Commits**: Small, focused PRs.
- **Commit Messages**: [Conventional Commits](https://www.conventionalcommits.org/).
- **Self-Review**: Run `./scripts/review.sh <PR_NUMBER>`.
- **Legal**: Sign Google CLA.
