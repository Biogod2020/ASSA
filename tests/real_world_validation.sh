#!/bin/bash
set -e

# Lightweight E2E: Single LLM call to verify agent behavior
# Uses pre-seeded ledger so agent only needs to call distill_pending

SANDBOX_DIR="/Users/jay/assa-sandbox"
PROJECT_ROOT="/Users/jay/LocalProjects/self_evolement"

echo "=== Lightweight E2E: Single LLM Call ==="
echo ""

# 1. Prepare sandbox with pre-seeded PENDING signal
echo "Step 1: Preparing sandbox with pre-seeded signal..."
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

# Pre-seed a PENDING signal in ledger
cat > .memory/evolution_ledger.json << 'EOF'
[
  {
    "session_id": "test",
    "message_id": "test-signal-001",
    "timestamp": "2026-03-15T00:00:00Z",
    "status": "PENDING",
    "type": "positive",
    "payload": {
      "rule": "Always use TypeScript strict mode.",
      "context": "Team coding standard",
      "tags": ["typescript", "strictness"]
    },
    "git_anchor": ""
  }
]
EOF
echo "# PATTERNS" > .memory/patterns.md

echo "  ✓ Sandbox ready with 1 PENDING signal"
echo ""

# 2. Single LLM call — agent should see PENDING and call distill_pending
echo "Step 2: Single LLM call (agent should auto-distill)..."
START=$(date +%s)
gemini -e assa-evolution \
  -p "You have PENDING signals. Call the distill_pending tool NOW." \
  --allowed-mcp-server-names assa-mcp \
  --output-format json > trigger.json 2>&1 || true
END=$(date +%s)
echo "  Duration: $((END - START))s"

# 3. Verify
echo ""
echo "Step 3: Verification..."
if grep -q "PROCESSED" .memory/evolution_ledger.json; then
    echo "  ✓ Ledger: Signal marked PROCESSED"
else
    echo "  ✗ Ledger: Signal still PENDING"
fi

if grep -q "TypeScript" .memory/patterns.md; then
    echo "  ✓ Patterns: TypeScript rule distilled"
else
    echo "  ✗ Patterns: Not updated"
fi

echo ""
echo "=== Done ==="
