#!/bin/bash
set -e

# ASSA E2E Manual Mock Test (Node.js version)
echo "Starting E2E Mock Test (Node.js)..."

# 1. Simulate Agent realizing something
echo '{"message_id": "node-m1", "session_id": "node-s1", "tool_input": {"type": "positive", "rule": "NODE_E2E_MOCK_RULE", "context": "testing", "tags": ["test"]}}' | node hooks/toolSubmitSignal.js
echo "✓ Realization submitted to ledger."

# 2. Verify PENDING status
grep -q "NODE_E2E_MOCK_RULE" .memory/evolution_ledger.json
grep -q "PENDING" .memory/evolution_ledger.json
echo "✓ Rule is PENDING in ledger."

# 3. Simulate BeforeAgent Hook (Context Injection)
echo '{"transcript": [{"messageId": "node-m1"}]}' | node hooks/beforeAgentHook.js | grep -q "NODE_E2E_MOCK_RULE"
echo "✓ BeforeAgent successfully injected rule into context."

# 4. Simulate AfterTool Hook (Git Commit)
echo '{"tool_name": "run_shell_command", "tool_input": {"command": "git commit -m \"test\""}}' | node hooks/afterToolHook.js
echo "✓ AfterTool triggered."

echo "Node.js E2E Mock Logic Passed!"
