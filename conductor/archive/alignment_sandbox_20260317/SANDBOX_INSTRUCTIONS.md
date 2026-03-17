# ASSA V3.2 Sandbox Testing Guide

This sandbox is an isolated environment to test the **ASSA Semantic Reflection** and **Self-Evolution** logic without affecting the main repository.

## Components
- `dist/`: Compiled TypeScript hooks (CommonJS).
- `.memory/`: Local L1/L2 memory (Signals and Patterns).
- `gemini-extension.json`: The extension manifest.
- `templates/`: Soul and User Handbook templates for L3 initialization.

## How to Test
1. **Trigger Semantic Reflex**:
   Run the `beforeAgentHook.js` with a prompt containing implicit preferences.
   ```bash
   node dist/beforeAgentHook.js < tests/praise_prompt.json
   ```

2. **Verify Breakthrough Analysis**:
   Simulate a tool failure followed by success in a mock transcript.

3. **Check System Health**:
   Verify the sandbox health in this isolated context.
