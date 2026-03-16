#!/bin/bash
set -e

# Syncer Trigger E2E: Verify that 'git push' automatically triggers pattern promotion to L3.

SANDBOX_DIR="/Users/jay/assa-sandbox-syncer"
REMOTE_REPO="/Users/jay/assa-mock-remote"
PROJECT_ROOT="/Users/jay/LocalProjects/self_evolement"
GLOBAL_ASSA_DIR="$HOME/.gemini/assa"

echo "=== ASSA V3.2 Syncer Trigger E2E ==="
echo ""

# 1. Prepare sandbox
echo "Step 1: Preparing sandbox and mock remote..."
rm -rf "$SANDBOX_DIR" "$REMOTE_REPO"
mkdir -p "$REMOTE_REPO"
git init --bare -q "$REMOTE_REPO"

mkdir -p "$SANDBOX_DIR/.memory"
mkdir -p "$SANDBOX_DIR/hooks"
mkdir -p "$SANDBOX_DIR/agents"
mkdir -p "$SANDBOX_DIR/skills"
mkdir -p "$SANDBOX_DIR/templates"

cd "$SANDBOX_DIR" || exit
git init -q
git remote add origin "$REMOTE_REPO"
echo "# Sandbox" > README.md

# Copy extension files
cp "$PROJECT_ROOT/gemini-extension.json" .
cp "$PROJECT_ROOT/GEMINI.md" .
cp -r "$PROJECT_ROOT/hooks/"* hooks/
cp -r "$PROJECT_ROOT/agents/"* agents/
cp -r "$PROJECT_ROOT/skills/"* skills/
cp -r "$PROJECT_ROOT/templates/"* templates/

git add . && git commit -m "initial commit" -q

# 2. Seed mature L2 patterns (Confidence >= 8)
echo "Step 2: Seeding mature L2 patterns in .memory/patterns.md..."
cat > .memory/patterns.md << 'EOF'
---
id: P-20260315-SYNC-TEST
category: Style
confidence: 10
status: Active
hit_count: 5
---
# Sync Promotion Test Rule
**Rationale**: This rule is highly stable and should be promoted to L3.
**Rule**: Always use 'const' for variables that are never reassigned.
EOF

echo "  ✓ Sandbox ready."
echo ""

# 3. Run Gemini and perform a git push
echo "Step 3: Executing 'git push' via Gemini (Watch for Syncer dispatch)..."
START=$(date +%s)

gemini -e . \
  -p "Run 'git push origin master'. If you see any instructions from the framework after the push, follow them exactly to promote mature patterns to global wisdom." \
  --allowed-mcp-server-names assa-mcp \
  --yolo \
  --output-format text

END=$(date +%s)
echo "  Duration: $((END - START))s"

# 4. Verification
echo ""
echo "Step 4: Final Verification..."

# Check if the rule exists in global library
# Syncer abstracts the rule, so we look for the core instruction text
if grep -r "Always use 'const' for variables" "$GLOBAL_ASSA_DIR/LIBRARY/" > /dev/null 2>&1; then
    echo "  ✓ SUCCESS: Pattern promoted to Global Library!"
else
    echo "  ✗ FAILURE: Pattern not found in Global Library ($GLOBAL_ASSA_DIR/LIBRARY/)"
fi

echo ""
echo "=== E2E Test Complete ==="
