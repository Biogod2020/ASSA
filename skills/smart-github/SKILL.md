---
name: smart-github
description: Scientific, reasonable, smart, and proactive GitHub workflow. Use when managing git repositories, crafting commits, or opening PRs. Enforces best practices, conventional commits, and safe git operations.
---

# Smart GitHub Workflow

This skill provides a scientific, reasonable, smart, and proactive approach to interacting with Git and GitHub.

## Core Principles

1.  **Scientific Verification**: Never guess what has changed. Always use `git status` and `git diff` to verify the exact scope of modifications before staging or committing.
2.  **Reasonable Judgement**: Ensure commits are logically grouped. Do not lump unrelated changes into a single "WIP" commit.
3.  **Smart Formatting**: Adhere to Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`, `docs:`) to provide immediate context.
4.  **Proactive Assistance**: Do not ask the user "What should the commit message be?". Instead, proactively draft a high-quality commit message based on your analysis of the diff and present it to the user for confirmation.

## The Workflow

### 1. Preparation & Verification (Scientific)

Before creating any commit, you MUST perform these checks:

*   Run `git status` to identify tracked, unstaged, and untracked files.
*   Run `git diff HEAD` (or `git diff --staged` if files are already added) to read the actual code changes.
*   Run `git log -n 3` to understand the project's recent commit style and context.

*Do not skip these steps. Assumptions lead to mistakes.*

### 2. Crafting the Commit (Smart & Proactive)

After verifying the changes:

1.  **Draft a Message**: Based on the `git diff` output, draft a clear and concise commit message.
    *   **Format**: Use Conventional Commits (`type(scope): subject`).
    *   **Body (Optional but recommended)**: Explain *why* the change was made, not just *what* changed (the code shows what).
2.  **Propose to User**: Present the drafted message to the user.
    *   *Example:* "I've reviewed the changes and drafted the following commit message. Shall I proceed with committing?"
3.  **Execute**: Once confirmed, run `git add` for the relevant files and `git commit -m "<message>"`.

### 3. Collaboration & PRs (Reasonable)

If instructed to push or create a Pull Request:

1.  **Check Remote State**: Run `git fetch` and `git status` to ensure you are up to date with the remote branch.
2.  **Pushing**: Only push when explicitly told to do so, or after the user confirms a commit if the task implies publishing the changes. Use `git push origin <branch_name>`.
3.  **Creating PRs (if `gh` CLI is available)**:
    *   Use `gh pr create --title "<Title>" --body "<Body>"`.
    *   The PR body should proactively summarize:
        *   **Context**: Why is this PR needed?
        *   **Changes**: High-level summary of modifications.
        *   **Testing**: How were the changes verified?

## Anti-Patterns (Do NOT Do This)

*   **Blind Committing**: Running `git commit -am "update"` without reviewing diffs.
*   **Lazy Prompting**: Asking "What is the commit message?" without providing a draft.
*   **Unauthorized Pushing**: Executing `git push` without explicit user consent.
*   **Mass Staging**: Using `git add .` when only specific files should be included in a logical commit. Always selectively add files if multiple unrelated changes exist.
