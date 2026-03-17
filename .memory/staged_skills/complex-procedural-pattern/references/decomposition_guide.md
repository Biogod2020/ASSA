# Task Decomposition Guide

## Why Decompose?

Large, complex tasks are difficult to reason about and even more difficult to debug. Decomposition breaks the "Large Problem" into several "Small, Verifiable Problems."

## How to Decompose

1. **Identify the Core Logic**: What is the primary transformation or action?
2. **Identify Dependencies**: What must happen BEFORE the core logic can execute?
3. **Identify Validation Points**: How will you prove that a specific sub-task is correct?
4. **Draft the Sequence**:
   - Step 1: Prerequisites & Environment Setup
   - Step 2: Implementation of Component A
   - Step 3: Implementation of Component B
   - Step 4: Integration
   - Step 5: Final Validation

## Example: Implementing a New MCP Server

- **Step 1**: Create the project structure and install dependencies.
- **Step 2**: Implement the core tool logic.
- **Step 3**: Implement the server transport (e.g., stdio).
- **Step 4**: Run a manual mock test using `tests/test_mcp_tools.js`.
- **Step 5**: Register the server in `gemini-extension.json` and verify in the main agent.
