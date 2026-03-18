# ASSA Neural System Rewrite: Semantic Precision & High-Fidelity Distillation

## 1. Context & Motivation
The current ASSA triggering system (`beforeAgentHook.js` and `mcpServer.js`) suffers from fragility and low fidelity:
1. **Keyword-based Praise Detection**: Fails to capture semantic approval (e.g., "Good idea", "I agree").
2. **Brittle Victory/Barrier Detection**: Trivial read-only commands (like `ls` or `cat`) clear failure counters, preventing true deadlock recognition. Furthermore, false victories are triggered when a failure is followed by a read-only success.
3. **Low-Fidelity L1 Memory**: The `submit_memory_signal` MCP schema only asks for a single `context` string, resulting in AI-generated summaries that strip away critical raw logs, failed attempts, and precise diffs.

## 2. Architectural Updates

### 2.1. Semantic Reflex (LLM-Native Sentiment Analysis)
Instead of matching arrays of strings (`PRAISE_KEYWORDS`), we will inject a persistent metaprompt into the `beforeAgentHook` that delegates sentiment analysis *directly to the LLM's core cognition*.
- **Implementation**: We will remove the regex/keyword matching in JS. Instead, the hook will append a standing directive to every prompt: 
  > "ASSA Core Directive: You must constantly monitor the user's semantic tone. If the user expresses approval, agreement, or satisfaction (Positive), OR frustration, confusion, or rejection of an approach (Negative), you MUST proactively call `submit_memory_signal` to record the interaction dynamic. Ignore neutral conversational filler."

### 2.2. Robust Tool State Tracking (Sliding Window & Mutator Filtering)
We will rewrite `isToolFailure` and `isToolSuccess` and the array traversal logic.
- **Filter Read-Only Tools**: We will maintain a `READ_ONLY_TOOLS` array (e.g., `list_directory`, `read_file`, `grep_search`, `glob`, `cli_help`, `get_internal_docs`). Any tool not in this list is assumed to be a Mutator. Read-Only tools are entirely filtered out of the Victory/Barrier trajectory analysis.
- **Barrier (Sliding Window)**: We will look at the last 5 Mutator tool calls. If >= 3 are failures, we inject the Barrier trigger. *Edge Case Handling: If fewer than 3 Mutator tool calls exist in the current session history, no Barrier is triggered.*
- **Victory (Isomorphic Breakthrough)**: A Victory is only triggered if a Mutator tool sequence transitions from Failure to Success (ignoring read-only tools in between).

### 2.3. High-Fidelity MCP Schema (The "Four-Part" Signal)
We will refactor the `mcpServer.js` schema for `submit_memory_signal`.
- **New Schema Properties**: (Retaining `type`, `tags`, and `session_id`)
  1. `raw_symptom` (string): The exact error log, failure state, or initial problem (include snippets).
  2. `failed_attempts` (string): What did we try that didn't work and why?
  3. `breakthrough` (string): The exact code diff, command, or paradigm shift that solved it.
  4. `rule` (string): The distilled, abstract rule for future reference.
- **Validation & Error Handling**: The four new fields will be marked as `required`. If the LLM omits a field or provides an empty payload, the MCP server will return a descriptive error message: `Schema Validation Error: You must provide raw_symptom, failed_attempts, breakthrough, and rule to submit a high-fidelity memory signal.` This forces the LLM to auto-correct and retry.
- **Ledger Alignment & Backward Compatibility**: The L1 Ledger (`evolution_ledger.json`) `payload` object will be updated to store these new structured fields. When `distiller` parses the ledger, it will implement a fallback: if `payload.raw_symptom` is undefined, it assumes a legacy record and parses the old `payload.context` string, ensuring old data does not break the distillation loop.

## 3. Data Flow
1. **Hook Interception**: `beforeAgentHook.js` filters transcript tools -> computes Sliding Window Barrier / Isomorphic Victory -> injects Triggers + Semantic Sentiment Directive.
2. **AI Action**: AI reads user prompt. If semantic threshold met OR system trigger present, AI formats the structured 4-part payload.
3. **MCP Server**: `mcpServer.js` receives the 4-part payload, validates it, and commits it to the atomic L1 ledger.

## 4. Testing Strategy
- **Positive Path**: Simulate a transcript with failed shell commands interspersed with `read_file` to prove Barrier triggers and False-Victories are handled correctly.
- **Negative Path (Schema)**: Send an incomplete payload to the `submit_memory_signal` MCP endpoint and verify it returns the correct validation error string.
- **Negative Path (Windowing)**: Simulate a transcript with exactly 2 failing Mutator commands and verify the Barrier is NOT triggered.
- **Backward Compatibility**: Ensure `distiller` can successfully parse a legacy `evolution_ledger.json` entry alongside a new one.
