#!/bin/bash
set -e

# Rewind Resilience E2E: Verify that signals are marked REWOUND when Turn 1 is removed from transcript.

SANDBOX_DIR="/Users/jay/assa-sandbox-rewind"
PROJECT_ROOT="/Users/jay/LocalProjects/self_evolement"

echo "=== ASSA V3.2 Rewind Resilience E2E ==="
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

# 2. Seed ledger with signals from Turn 1, Turn 2, and another session
echo "Step 2: Seeding ledger with signals from multiple sessions..."
cat > .memory/evolution_ledger.json << 'EOF'
[
  {
    "session_id": "rewind-test",
    "message_id": "msg-001",
    "timestamp": "2026-03-15T13:00:01Z",
    "status": "PENDING",
    "type": "negative",
    "payload": {"rule": "Bad rule from turn 1", "context": "Error", "tags": []}
  },
  {
    "session_id": "rewind-test",
    "message_id": "msg-002",
    "timestamp": "2026-03-15T13:00:02Z",
    "status": "PENDING",
    "type": "positive",
    "payload": {"rule": "Good rule from turn 2", "context": "Correct", "tags": []}
  },
  {
    "session_id": "other-session",
    "message_id": "other-msg-001",
    "timestamp": "2026-03-15T13:00:03Z",
    "status": "PENDING",
    "type": "positive",
    "payload": {"rule": "Rule from another session", "context": "Cross-Session", "tags": []}
  }
]
EOF

# 3. Simulate BeforeAgent Hook with Truncated Transcript (Rewind turn 2 in 'rewind-test')
echo "Step 3: Simulating BeforeAgent hook after a rewind (Session: rewind-test, Turn 2 removed)..."
cat > .memory/mock_transcript.json << 'EOF'
{
  "messages": [
    { "messageId": "msg-001", "role": "user", "content": "test" }
  ]
}
EOF
# Pass transcript_path instead of transcript array
echo '{"agentName": "main", "sessionId": "rewind-test", "transcript_path": ".memory/mock_transcript.json"}' | node hooks/beforeAgentHook.js > /dev/null

# 4. Verification
echo "Step 4: Final Verification..."
# msg-002 should be REWOUND
if grep -A 5 "msg-002" .memory/evolution_ledger.json | grep -q "REWOUND"; then
    echo "  ✓ SUCCESS: Signal msg-002 (current session) correctly marked as REWOUND!"
else
    echo "  ✗ FAILURE: Signal msg-002 status not updated correctly."
    cat .memory/evolution_ledger.json
fi

# other-msg-001 should still be PENDING
if grep -A 5 "other-msg-001" .memory/evolution_ledger.json | grep -q "PENDING"; then
    echo "  ✓ SUCCESS: Signal other-msg-001 (other session) remained PENDING!"
else
    echo "  ✗ FAILURE: Signal other-msg-001 was incorrectly marked as REWOUND."
    cat .memory/evolution_ledger.json
fi

echo ""
echo "=== E2E Test Complete ==="
