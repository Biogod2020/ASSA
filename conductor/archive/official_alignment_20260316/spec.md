# Specification: Gemini CLI Contribution Guidelines Alignment (New Repo)

## Overview
This track aims to create a new, parallel repository that strictly aligns with the official `google-gemini/gemini-cli` `CONTRIBUTING.md` guidelines. This new repository will serve as the "official adapted version" of the ASSA project, incorporating TypeScript, standardized code style, task automation, and a monorepo structure from the ground up, before migrating existing logic over.

## Functional Requirements
1. **New Repository Scaffolding:** Initialize a completely new Git repository separate from the current working environment.
2. **Monorepo Structure:** Set up a `packages/` directory layout from day one.
3. **TypeScript Integration:** Configure TypeScript for all core logic to enhance type safety.
4. **Linting and Formatting:** Configure ESLint and Prettier (with 80-character line width) at the project root of the new repo.
5. **Makefile Automation:** Create a standard `Makefile` at the root with common targets (e.g., `build`, `test`, `lint`, `format`).

## Non-Functional Requirements
1. **Pristine Start:** The new repo must be built purely following the official standards without legacy baggage.
2. **Migration Path:** Define a clear strategy to incrementally port existing logic from the old repo to the new repo once the infrastructure is solid.
3. **Safety:** The existing (current) repository will remain untouched during the initial scaffolding phase.

## Out of Scope
- Deleting or modifying the current existing ASSA repository.
- Complete rewrite of all Python scripts (only core TS/JS infrastructure will be prioritized initially).