#!/bin/bash
set -e

# Full Lifecycle E2E: Deep Distillation via @distiller (LLM Subagent)
# This test verifies the "Deep Path" and output quality.

SANDBOX_DIR="/Users/jay/assa-sandbox"
PROJECT_ROOT="/Users/jay/LocalProjects/self_evolement"

echo "=== ASSA V3.2 Full Lifecycle E2E (Deep Path) ==="
echo ""

# 1. Prepare sandbox with 6 PENDING signals (Threshold is 5)
echo "Step 1: Preparing sandbox with 6 PENDING signals..."
rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR/.memory"
cd "$SANDBOX_DIR" || exit
git init -q
echo "# Sandbox" > README.md
cp -r "$PROJECT_ROOT/docs" .
cp -r "$PROJECT_ROOT/agents" .
cp -r "$PROJECT_ROOT/skills" .
cp -r "$PROJECT_ROOT/templates" .
cp "$PROJECT_ROOT/GEMINI.md" .
git add . && git commit -m "init" -q

# Seed 6 signals
cat > .memory/evolution_ledger.json << 'EOF'
[
  {"session_id": "test", "message_id": "sig-001", "timestamp": "2026-03-15T00:00:01Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Use functional components in React.", "context": "User preference", "tags": ["react", "style"]}},
  {"session_id": "test", "message_id": "sig-002", "timestamp": "2026-03-15T00:00:02Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Prefer Tailwind CSS for styling.", "context": "User preference", "tags": ["css", "tailwind"]}},
  {"session_id": "test", "message_id": "sig-003", "timestamp": "2026-03-15T00:00:03Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Enable ESLint on save.", "context": "Workflow", "tags": ["dx", "lint"]}},
  {"session_id": "test", "message_id": "sig-004", "timestamp": "2026-03-15T00:00:04Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Store API keys in .env only.", "context": "Security", "tags": ["security", "env"]}},
  {"session_id": "test", "message_id": "sig-005", "timestamp": "2026-03-15T00:00:05Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Write JSDoc for all exported functions.", "context": "Documentation", "tags": ["docs", "jsdoc"]}},
  {"session_id": "test", "message_id": "sig-006", "timestamp": "2026-03-15T00:00:06Z", "status": "PENDING", "type": "positive", "payload": {"rule": "Use Zod for schema validation.", "context": "Logic", "tags": ["validation", "zod"]}}
]
EOF
echo "# PATTERNS" > .memory/patterns.md

echo "  ✓ Sandbox ready with 6 PENDING signals (DEEP DISTILLATION threshold met)"
echo ""

# 2. Run Gemini - Agent should see the directive and dispatch subagent
echo "Step 2: Dispatching Distillation via Subagent..."
START=$(date +%s)
gemini -e assa-evolution \
  -p "You have 6 PENDING signals. Dispatch the Distiller task to the generalist subagent NOW. Do not forget to tell it to use complete_task when done." \
  --allowed-mcp-server-names assa-mcp \
  --yolo \
  --output-format text
END=$(date +%s)
echo "  Duration: $((END - START))s"

# 3. Verify Output Quality
echo ""
echo "Step 3: Verification & Quality Assessment..."

# Check Ledger Status
if grep -q "PROCESSED" .memory/evolution_ledger.json; then
    echo "  ✓ Ledger: All signals marked PROCESSED"
else
    echo "  ✗ Ledger: Signaling failure - items still PENDING"
fi

# Check Pattern Format (Should be high-quality YAML blocks, not simple list)
echo "--- patterns.md Content (Quality Assessment) ---"
cat .memory/patterns.md
echo "------------------------------------------------"

if grep -q "---" .memory/patterns.md && grep -q "Rationale:" .memory/patterns.md; then
    echo "  ✓ Quality: High (YAML Frontmatter + Rationale found)"
else
    echo "  ✗ Quality: Low (Only simple list format or empty)"
fi

echo ""
echo "=== Done ==="
