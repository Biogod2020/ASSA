# LESSONS LEARNED

## 2026-03-14: Hook Recursion Infinite Loop
- **Symptom**: Quota exhausted rapidly, `distiller_debug.log` shows 7+ "Starting Distillation" entries within seconds
- **Root Cause**: BeforeAgent hook called `spawnSync('gemini')` → child gemini process triggered BeforeAgent hook → infinite recursion
- **Fix**: Introduced `ASSA_EVOLVING` environment variable as recursion guard
- **Prevention**: Never spawn gemini processes inside hooks. Hooks should only inject context.

## 2026-03-14: Hook Timeout (60s)
- **Symptom**: `Hook execution error: Hook timed out after 10000ms` / `60000ms`
- **Root Cause**: Sub-agent spawned inside hook took too long (model call + quota retries)
- **Fix**: Increased timeout to 60s, then eliminated spawning entirely
- **Prevention**: Follow superpowers pattern — hooks are for context injection only, NEVER for LLM calls

## 2026-03-14: stdin Hang in BeforeAgent
- **Symptom**: Hook fires (log entry created) but no stdin data read, process blocks
- **Root Cause**: `fs.readFileSync(0)` blocks when stdin pipe not properly closed by parent
- **Fix**: Added empty-input fallback and JSON parse error handling
- **Prevention**: Always guard stdin reading with try/catch and empty-input path

## 2026-03-14: Workspace Boundary Errors
- **Symptom**: `Path not in workspace` error when agent tries to read docs/skills
- **Root Cause**: Gemini CLI restricts file access to CWD workspace; extension files were outside
- **Fix**: Copied extension components into sandbox workspace
- **Prevention**: Ensure all files the agent needs are within the workspace boundary

## 2026-03-14: Tool Authorization Failures
- **Symptom**: `Tool "run_shell_command" not found` or `Unauthorized tool call`
- **Root Cause**: `--allowed-mcp-server-names` only authorizes MCP tools, not built-in tools
- **Fix**: Added `--approval-mode yolo` for full tool access in test scenarios
- **Prevention**: Use the correct authorization flags for the tool set needed

## 2026-03-15: Architecture Insight from Superpowers
- **Insight**: Superpowers extension hooks NEVER spawn sub-processes. All sub-agent work is done via native `Task()` dispatch or MCP tool calls.
- **Applied**: Rewrote ASSA hooks to be pure context injectors. Moved distillation into `distill_pending` MCP tool (pure function, no LLM).
- **Result**: Hook execution dropped from 60s+ to <1s
# Subagent Architecture Update
\n## 2026-03-15: Shifted to Native Subagents\n- **Insight**: Sequential execution pollutes the main agent context with distillation metadata.\n- **Applied**: Enabled `experimental.enableAgents` in Gemini CLI. Refactored Hooks and GEMINI.md to dispatch tasks to the `generalist` subagent instead of forcing the main agent to switch personas.\n- **Result**: Clean main thread context, proper background execution.
