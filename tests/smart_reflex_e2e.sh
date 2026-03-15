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
echo "Step 2: Simulating BeforeAgent hook with Victory Pattern (via Metadata)..."
cat > .memory/mock_victory.json << 'EOF'
{
  "messages": [
    { "role": "user", "content": "fix the bug" },
    { "role": "tool", "content": "<!-- ASSA_METADATA: [FAILED: run_shell_command] -->" },
    { "role": "tool", "content": "<!-- ASSA_METADATA: [SUCCESS: run_shell_command] -->" }
  ]
}
EOF

RESULT=$(echo '{"agentName": "main", "sessionId": "test-session-123", "transcript_path": ".memory/mock_victory.json"}' | node hooks/beforeAgentHook.js)

if echo "$RESULT" | grep -q "ASSA REFLEX: VICTORY DETECTED"; then
    echo "  ✓ SUCCESS: Victory reflex detected via Metadata!"
else
    echo "  ✗ FAILURE: Victory reflex not detected via Metadata."
    echo "$RESULT"
fi

if echo "$RESULT" | grep -q "ASSA SESSION ID: test-session-123"; then
    echo "  ✓ SUCCESS: Session ID correctly injected!"
else
    echo "  ✗ FAILURE: Session ID missing from context."
fi

# 3. Mock Transcript with "Barrier" pattern
# Sequence: Tool (Fail) -> Tool (Fail) -> Tool (Fail)
echo "Step 3: Simulating BeforeAgent hook with Barrier Pattern..."
cat > .memory/mock_barrier.json << 'EOF'
{
  "messages": [
    { "role": "tool", "content": "Error 1. Exit Code: 1" },
    { "role": "tool", "content": "Error 2. Exit Code: 1" },
    { "role": "tool", "content": "Error 3. Exit Code: 1" }
  ]
}
EOF

RESULT=$(echo '{"agentName": "main", "transcript_path": ".memory/mock_barrier.json"}' | node hooks/beforeAgentHook.js)

if echo "$RESULT" | grep -q "ASSA REFLEX: BARRIER DETECTED"; then
    echo "  ✓ SUCCESS: Barrier reflex injected into context!"
else
    echo "  ✗ FAILURE: Barrier reflex not detected."
    echo "$RESULT"
fi

# 4. Mock Transcript with "Praise" pattern
echo "Step 4: Simulating BeforeAgent hook with Praise Pattern..."
cat > .memory/mock_praise.json << 'EOF'
{
  "messages": [
    { "role": "user", "content": "很好, 这个问题解决得非常完美" }
  ]
}
EOF

RESULT=$(echo '{"agentName": "main", "transcript_path": ".memory/mock_praise.json"}' | node hooks/beforeAgentHook.js)

if echo "$RESULT" | grep -q "ASSA REFLEX: PRAISE DETECTED"; then
    echo "  ✓ SUCCESS: Praise reflex injected into context!"
else
    echo "  ✗ FAILURE: Praise reflex not detected."
    echo "$RESULT"
fi

echo ""
echo "=== E2E Test Complete ==="
