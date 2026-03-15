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

# Copy ledgerUtils.js and beforeAgentHook.js
mkdir -p skills/assa-core/scripts
cp "$PROJECT_ROOT/skills/assa-core/scripts/ledgerUtils.js" skills/assa-core/scripts/
cp "$PROJECT_ROOT/hooks/beforeAgentHook.js" hooks/

# 2. Seed ledger with 2 signals
echo "Step 2: Seeding ledger with signals from Turn 1 and Turn 2..."
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
  }
]
EOF

# 3. Simulate BeforeAgent Hook with Truncated Transcript (Rewind turn 2)
# We provide a transcript that ONLY contains msg-001. msg-002 should become REWOUND.
echo "Step 3: Simulating BeforeAgent hook after a rewind (Turn 2 removed)..."
# The hook expects JSON on stdin
echo '{"agentName": "main", "transcript": [{"messageId": "msg-001"}]}' | node hooks/beforeAgentHook.js > /dev/null

# 4. Verification
echo "Step 4: Final Verification..."
if grep -q "\"message_id\": \"msg-002\"" .memory/evolution_ledger.json && grep -A 5 "msg-002" .memory/evolution_ledger.json | grep -q "REWOUND"; then
    echo "  ✓ SUCCESS: Signal msg-002 correctly marked as REWOUND!"
else
    echo "  ✗ FAILURE: Signal msg-002 status not updated correctly."
    cat .memory/evolution_ledger.json
fi

echo ""
echo "=== E2E Test Complete ==="
