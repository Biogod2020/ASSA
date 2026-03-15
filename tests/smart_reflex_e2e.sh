#!/bin/bash
set -e

# Smart Reflex E2E: Verify that patterns are matched from transcript.

SANDBOX_DIR="/Users/jay/assa-sandbox-reflex"
PROJECT_ROOT="/Users/jay/LocalProjects/self_evolement"

echo "=== ASSA V3.2 Smart Reflex E2E ==="
echo ""

# 1. Prepare sandbox
echo "Step 1: Preparing sandbox..."
rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR/.memory"
mkdir -p "$SANDBOX_DIR/hooks"
cd "$SANDBOX_DIR" || exit

# Copy dependencies
mkdir -p skills/assa-core/scripts
cp "$PROJECT_ROOT/skills/assa-core/scripts/ledgerUtils.js" skills/assa-core/scripts/
cp "$PROJECT_ROOT/hooks/beforeAgentHook.js" hooks/
cp "$PROJECT_ROOT/hooks/healthCheck.js" hooks/

# 2. Mock Transcript with "Victory After Struggle" pattern
# Sequence: User -> Tool (Fail) -> Tool (Success)
echo "Step 2: Simulating BeforeAgent hook with Victory Pattern..."
PAYLOAD='{
  "agentName": "main",
  "transcript": [
    { "role": "user", "content": "fix the bug" },
    { "role": "tool", "content": "Error: compilation failed. Exit Code: 1" },
    { "role": "tool", "content": "Compilation successful. Exit Code: 0" }
  ]
}'

RESULT=$(echo "$PAYLOAD" | node hooks/beforeAgentHook.js)

if echo "$RESULT" | grep -q "ASSA REFLEX: VICTORY DETECTED"; then
    echo "  ✓ SUCCESS: Victory reflex injected into context!"
else
    echo "  ✗ FAILURE: Victory reflex not detected."
    echo "$RESULT"
fi

# 3. Mock Transcript with "Barrier" pattern
# Sequence: Tool (Fail) -> Tool (Fail) -> Tool (Fail)
echo "Step 3: Simulating BeforeAgent hook with Barrier Pattern..."
PAYLOAD='{
  "agentName": "main",
  "transcript": [
    { "role": "tool", "content": "Error 1. Exit Code: 1" },
    { "role": "tool", "content": "Error 2. Exit Code: 1" },
    { "role": "tool", "content": "Error 3. Exit Code: 1" }
  ]
}'

RESULT=$(echo "$PAYLOAD" | node hooks/beforeAgentHook.js)

if echo "$RESULT" | grep -q "ASSA REFLEX: BARRIER DETECTED"; then
    echo "  ✓ SUCCESS: Barrier reflex injected into context!"
else
    echo "  ✗ FAILURE: Barrier reflex not detected."
    echo "$RESULT"
fi

# 4. Mock Transcript with "Praise" pattern
echo "Step 4: Simulating BeforeAgent hook with Praise Pattern..."
PAYLOAD='{
  "agentName": "main",
  "transcript": [
    { "role": "user", "content": "很好, 这个问题解决得非常完美" }
  ]
}'

RESULT=$(echo "$PAYLOAD" | node hooks/beforeAgentHook.js)

if echo "$RESULT" | grep -q "ASSA REFLEX: PRAISE DETECTED"; then
    echo "  ✓ SUCCESS: Praise reflex injected into context!"
else
    echo "  ✗ FAILURE: Praise reflex not detected."
    echo "$RESULT"
fi

echo ""
echo "=== E2E Test Complete ==="
