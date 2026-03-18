#!/bin/bash
set -e

# ASSA V3.2 High-Performance E2E Validation Script
# Refined based on original SOTA testing architecture.

SANDBOX_DIR="/tmp/assa-e2e-sandbox"
PROJECT_ROOT=$(pwd)

echo "🚀 Starting High-Performance ASSA V3.2 E2E Validation..."
echo "Project Root: $PROJECT_ROOT"
echo "Sandbox: $SANDBOX_DIR"

# 1. Prepare Sandbox (PHYSICAL COPY for consistency)
echo -e "\nStep 1: Preparing Sandbox with full context..."
rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR/.memory"
cd "$SANDBOX_DIR"
git init -q

# Copy essential files like the original repo did
cp "$PROJECT_ROOT/GEMINI.md" .
cp -r "$PROJECT_ROOT/packages/core/templates" ./templates
cp -r "$PROJECT_ROOT/packages/core/agents" ./agents
# Ensure .memory is initialized
echo "# PATTERNS" > .memory/patterns.md
echo "[]" > .memory/evolution_ledger.json

touch base.txt
git add .
git commit -m "initial commit with full context" -q

# Enable extension for this workspace
gemini extensions enable assa-evolution

# 2. Atomic MCP Test (Zero LLM calls, High Speed)
echo -e "\nStep 2: Running Atomic MCP Validation (Direct RPC)..."
cd "$PROJECT_ROOT"
npx --yes ts-node scripts/test_mcp_tools.ts

# 3. LLM Integration Test (AfterTool Trigger)
echo -e "\nStep 3: Testing AfterTool Hook via LLM..."
cd "$SANDBOX_DIR"
echo "trigger change" >> base.txt
git add base.txt
# Run commit through gemini to trigger AfterTool
# We use ASSA_EVOLVING=true to ensure we don't hit recursive limits during test setup
ASSA_EVOLVING=true gemini -e assa-evolution -p "Run shell command: git commit -m 'test trigger'" --yolo --output-format text > /dev/null

# Check diagnostic logs in PROJECT_ROOT
latest_log=$(ls -t "$PROJECT_ROOT/.memory/debug/afterTool_"*.json | head -n 1)
if grep -q "GIT COMMIT DETECTED" "$latest_log"; then
    echo "  ✓ SUCCESS: AfterTool hook detected commit trigger."
else
    echo "  ✗ FAILURE: AfterTool hook missed the trigger."
    exit 1
fi

# 4. Final LLM Decision Test (Deep Distillation)
echo -e "\nStep 4: Testing LLM-led Deep Distillation..."
# Seed 6 signals to hit threshold
cat > .memory/evolution_ledger.json << 'EOF'
[
  {"session_id": "e2e", "message_id": "sig-1", "timestamp": "2026-03-17T12:00:01Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Rule 1", "context": "C1", "tags": ["T1"]}},
  {"session_id": "e2e", "message_id": "sig-2", "timestamp": "2026-03-17T12:00:02Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Rule 2", "context": "C2", "tags": ["T2"]}},
  {"session_id": "e2e", "message_id": "sig-3", "timestamp": "2026-03-17T12:00:03Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Rule 3", "context": "C3", "tags": ["T3"]}},
  {"session_id": "e2e", "message_id": "sig-4", "timestamp": "2026-03-17T12:00:04Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Rule 4", "context": "C4", "tags": ["T4"]}},
  {"session_id": "e2e", "message_id": "sig-5", "timestamp": "2026-03-17T12:00:05Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Rule 5", "context": "C5", "tags": ["T5"]}},
  {"session_id": "e2e", "message_id": "sig-6", "timestamp": "2026-03-17T12:00:06Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Rule 6", "context": "C6", "tags": ["T6"]}}
]
EOF

# Ask LLM to distill - this is where we check if LLM follows our SOUL.md/directives
# We do NOT use ASSA_EVOLVING here because we want to see the "DEEP DISTILLATION REQUIRED" injection
gemini -e assa-evolution -p "I have 6 pending signals. Call the distiller agent to process them." --yolo --output-format text > /dev/null

if grep -q "PROCESSED" .memory/evolution_ledger.json; then
    echo "  ✓ SUCCESS: LLM successfully dispatched distillation."
else
    echo "  ✗ FAILURE: signals still PENDING."
    exit 1
fi

echo -e "\n✨ ALL E2E TESTS PASSED! ASSA V3.2 is officially aligned and optimized."
