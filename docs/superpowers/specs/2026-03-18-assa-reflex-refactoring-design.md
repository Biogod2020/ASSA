# ASSA Reflex System Refactoring (Design Spec)

## Overview
This refactoring aims to upgrade the ASSA (Autonomous Self-Sovereign Agent) trigger mechanism. The current system relies on rigid keyword matching for praise detection and fragile sequential checks for tool failures. We will replace these with LLM-driven semantic detection, state-aware tool filtering, sliding window failure detection, and a high-fidelity MCP schema to ensure robust memory capture.

## 1. LLM-Driven Semantic Sentiment Detection (Replacing Keywords)
**Current State:** 
`PRAISE_KEYWORDS = ['很好', 'Perfect', ...]`
If the user says "I agree" or "This is a great idea," it fails to trigger.

**Proposed Change:**
Remove all hardcoded `PRAISE_KEYWORDS` from the JavaScript hook (`hooks/beforeAgentHook.js`).
Instead, we will use the agent's inherent prompt to make it self-aware. We will inject a permanent, lightweight "Sentiment Sensor" directive into the hook's standard context injection:
> "If the user expresses agreement, satisfaction, or indicates that an approach works well (even without explicit praise words), you MUST proactively synthesize this into a Success Pattern using the `submit_memory_signal` tool."
*This shifts the burden of sentiment analysis from dumb string matching in JS to the LLM itself.*

## 2. State-Aware Tool Filtering for Victory/Barrier
**Current State:**
Read-only tools (like `read_file`, `list_directory`) break the continuous failure chain.

**Proposed Change:**
Introduce a `STATE_MUTATING_TOOLS` constant in `beforeAgentHook.js` (e.g., `['run_shell_command', 'shell', 'replace', 'write_file', 'edit']`).
When calculating tool success/failure chains, we will *filter out* all read-only tools.
- **Isomorphic Victory:** A Victory is ONLY triggered if a state-mutating tool (e.g., `run_shell_command` running `npm run build`) fails, and later, a state-mutating tool of the *same type* succeeds.
- **Sliding Window Barrier:** We will look at the last 5 *state-mutating* tool calls. If 3 or more of them are marked as `[FAILED]`, it triggers the Barrier Detected reflex.

## 3. High-Fidelity MCP Schema (The "Meme" / Context Preserver)
**Current State:**
The `submit_memory_signal` MCP tool only takes `rule`, `context`, `tags`. The `context` is often too brief.

**Proposed Change:**
Update `hooks/mcpServer.js` to require a structured, high-fidelity context.
```javascript
properties: {
    rule: { type: 'string', description: 'The abstracted, actionable rule or lesson.' },
    raw_symptom: { type: 'string', description: 'The exact raw error message, log snippet, or initial failure state.' },
    failed_attempts: { type: 'string', description: 'What did you try that did NOT work?' },
    breakthrough_diff: { type: 'string', description: 'The exact code change, command, or logic shift that fixed it.' },
    tags: { type: 'array', items: { type: 'string' } },
    session_id: { type: 'string' }
}
```
The MCP server will then internally concatenate `raw_symptom`, `failed_attempts`, and `breakthrough_diff` into a rich markdown block and save it as the `context` field in the L1 ledger, ensuring the `distiller` agent has the full story.

## Implementation Steps
1. Edit `hooks/mcpServer.js` to update the `submit_memory_signal` JSON Schema and concatenation logic.
2. Edit `hooks/beforeAgentHook.js`:
   - Remove `PRAISE_KEYWORDS` logic.
   - Inject the new "Semantic Sentiment Sensor" prompt universally.
   - Refactor `recognizeReflex` to use `STATE_MUTATING_TOOLS` filtering.
   - Implement the "3 out of 5" sliding window for Barrier detection.
   - Implement "Isomorphic Victory" detection.
