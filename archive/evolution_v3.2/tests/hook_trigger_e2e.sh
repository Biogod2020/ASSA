#!/bin/bash
set -e

# Hook Trigger E2E: Verify that 'git commit' automatically triggers distillation via Subagent.
# This is the most critical automation test for ASSA V3.2.

SANDBOX_DIR="/Users/jay/assa-sandbox-hooks"
PROJECT_ROOT="/Users/jay/LocalProjects/self_evolement"

echo "=== ASSA V3.2 Hook Trigger E2E ==="
echo ""

# 1. Prepare sandbox
echo "Step 1: Preparing sandbox environment..."
rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR/.memory"
mkdir -p "$SANDBOX_DIR/hooks"
mkdir -p "$SANDBOX_DIR/agents"
mkdir -p "$SANDBOX_DIR/skills"
mkdir -p "$SANDBOX_DIR/templates"

cd "$SANDBOX_DIR" || exit
git init -q
echo "# Sandbox" > README.md

# Copy extension files
cp "$PROJECT_ROOT/gemini-extension.json" .
cp "$PROJECT_ROOT/GEMINI.md" .
cp -r "$PROJECT_ROOT/hooks/"* hooks/
cp -r "$PROJECT_ROOT/agents/"* agents/
cp -r "$PROJECT_ROOT/skills/"* skills/
cp -r "$PROJECT_ROOT/templates/"* templates/

git add . && git commit -m "initial commit" -q

# 2. Seed PENDING signals
echo "Step 2: Seeding 6 PENDING signals to trigger Deep Distillation..."
cat > .memory/evolution_ledger.json << 'EOF'
[
  {"session_id": "hook-test", "message_id": "h-sig-001", "timestamp": "2026-03-15T12:00:01Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Use async/await for all file operations.", "context": "Style", "tags": ["node", "fs"]}},
  {"session_id": "hook-test", "message_id": "h-sig-002", "timestamp": "2026-03-15T12:00:02Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Always specify character encoding as 'utf8'.", "context": "Safety", "tags": ["node", "encoding"]}},
  {"session_id": "hook-test", "message_id": "h-sig-003", "timestamp": "2026-03-15T12:00:03Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Use path.join instead of string concatenation for paths.", "context": "Portability", "tags": ["node", "path"]}},
  {"session_id": "hook-test", "message_id": "h-sig-004", "timestamp": "2026-03-15T12:00:04Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Check if file exists before reading.", "context": "Robustness", "tags": ["node", "fs"]}},
  {"session_id": "hook-test", "message_id": "h-sig-005", "timestamp": "2026-03-15T12:00:05Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Use try/catch blocks around JSON.parse.", "context": "Stability", "tags": ["node", "json"]}},
  {"session_id": "hook-test", "message_id": "h-sig-006", "timestamp": "2026-03-15T12:00:06Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Export functions using CommonJS module.exports.", "context": "Compatibility", "tags": ["node", "modules"]}}
]
EOF
echo "# PATTERNS" > .memory/patterns.md

echo "  ✓ Sandbox ready."
echo ""

# 3. Run Gemini and perform a git commit
# We expect:
# 1. Agent runs 'git commit'
# 2. AfterTool hook fires, injects "Call generalist subagent" instruction
# 3. Agent reads the instruction and calls generalist
# 4. Subagent finishes and calls complete_task
echo "Step 3: Executing 'git commit' via Gemini (Watch for Subagent dispatch)..."
START=$(date +%s)

# We use a multi-step prompt to ensure the agent processes the hook output
gemini -e . \
  -p "Modify README.md by adding a line 'Triggering hook...', then run 'git commit -am \"trigger subagent distillation\"'. If you see any instructions from the framework after the commit, follow them exactly." \
  --allowed-mcp-server-names assa-mcp \
  --yolo \
  --output-format text

END=$(date +%s)
echo "  Duration: $((END - START))s"

# 4. Verification
echo ""
echo "Step 4: Final Verification..."

# Check if ledger was updated to PROCESSED
if grep -q "PROCESSED" .memory/evolution_ledger.json; then
    echo "  ✓ SUCCESS: Ledger signals marked PROCESSED (Subagent worked!)"
else
    echo "  ✗ FAILURE: Ledger signals still PENDING (Subagent was not triggered or failed)"
fi

# Check if patterns.md contains the new rules
if grep -q "async/await" .memory/patterns.md; then
    echo "  ✓ SUCCESS: patterns.md updated with new rules"
else
    echo "  ✗ FAILURE: patterns.md not updated"
fi

echo ""
echo "=== E2E Test Complete ==="
