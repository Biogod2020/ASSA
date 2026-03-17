#!/bin/bash
echo "--- Running ASSA Sandbox Integration Tests ---"

echo -e "\n1. Testing Semantic Interaction Audit (Praise)..."
node dist/beforeAgentHook.js < tests/praise_prompt.json | grep "SEMANTIC INTERACTION AUDIT" > /dev/null
if [ $? -eq 0 ]; then echo "PASSED"; else echo "FAILED"; fi

echo -e "\n2. Testing Breakthrough Analysis (Victory)..."
echo '{"agentName": "main", "sessionId": "s2", "prompt": "Continue", "transcript_path": "tests/transcript_history.json"}' > tests/call.json
echo '{"messages": [{"type": "agent", "toolCalls": [{"status": "error", "result": "fail"}]}, {"type": "agent", "toolCalls": [{"status": "success", "result": "win"}]}]}' > tests/transcript_history.json
node dist/beforeAgentHook.js < tests/call.json | grep "BREAKTHROUGH ANALYSIS" > /dev/null
if [ $? -eq 0 ]; then echo "PASSED"; else echo "FAILED"; fi

echo -e "\n3. Testing Barrier Identification (Failures)..."
echo '{"messages": [{"type": "agent", "toolCalls": [{"status": "error"}]}, {"type": "agent", "toolCalls": [{"status": "error"}]}, {"type": "agent", "toolCalls": [{"status": "error"}]}]}' > tests/transcript_history.json
node dist/beforeAgentHook.js < tests/call.json | grep "BARRIER IDENTIFICATION" > /dev/null
if [ $? -eq 0 ]; then echo "PASSED"; else echo "FAILED"; fi

echo -e "\n--- Sandbox Tests Complete ---"
