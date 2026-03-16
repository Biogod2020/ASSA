#!/bin/bash
set -e

# ASSA V3.2 Industrial Integration Test
# Focus: Installation, Workspace Scaffolding, and Global Sync.

SANDBOX_DIR="/Users/jay/assa-master-sandbox"
PROJECT_ROOT="/Users/jay/LocalProjects/self_evolement"
GLOBAL_ASSA_DIR="$HOME/.gemini/assa"

echo "🚀 Starting ASSA V3.2 Industrial Integration Test..."
echo ""

# 1. Prepare Sterile Sandbox
rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR"
cd "$SANDBOX_DIR" || exit
git init -q
echo "# Sandbox Project" > README.md
git add README.md
git commit -m "initial commit" -q

# 2. Formal Extension Installation
echo "Step 1: Formally installing ASSA extension into sandbox..."
# Ensure clean state
gemini extension uninstall assa-evolution || true
# Using --consent to skip confirmation
gemini extension install "$PROJECT_ROOT" --consent > /dev/null

# 3. Trigger Workspace Scaffolding
echo "Step 2: Triggering BeforeAgent self-healing..."
# We use a non-interactive prompt to fire the hook
gemini -p "who are you?" --yolo --output-format text > /dev/null

if [ -d ".memory" ] && [ -f ".memory/patterns.md" ] && [ -f ".memory/decisions.md" ]; then
    echo "  ✓ SUCCESS: .memory and local patterns automatically scaffolded."
else
    echo "  ✗ FAILURE: Workspace scaffolding failed."
    ls -la
    exit 1
fi

# 4. Verify Local Signal Capture
echo "Step 3: Verifying local pattern capture (MCP)..."
gemini -p "Record a positive signal with rule 'Verify Metadata' and context 'Integration Test'." --yolo --output-format text > /dev/null

if grep -q "Verify Metadata" .memory/evolution_ledger.json; then
    echo "  ✓ SUCCESS: Pattern successfully recorded in local ledger."
else
    echo "  ✗ FAILURE: MCP tool failed to write to ledger."
    exit 1
fi

# 5. Global Memory Modification (L3 Sync)
echo "Step 4: Modifying global memory from sandbox..."
# Seed a mature pattern in the sandbox
cat > .memory/patterns.md << 'EOF'
---
id: P-SANDBOX-GLOBAL-PROMOTION
category: Architecture
confidence: 10
status: Active
hit_count: 10
---
# Global Integration Principle
**Rationale**: Proof that a sandbox can update the global soul.
**Rule**: Always use non-interactive prompts for automated validation.
EOF

# Use ASSA_EVOLVING to bypass recursion check during sync
ASSA_EVOLVING=true gemini @syncer "Audit and promote the 'Global Integration Principle' from this workspace to the global library." --yolo --output-format text > /dev/null

# Check if the global library was actually modified
if grep -r "Global Integration Principle" "$GLOBAL_ASSA_DIR/LIBRARY/" > /dev/null 2>&1; then
    echo "  ✓ SUCCESS: Global memory modified and synchronized from sandbox."
else
    echo "  ✗ FAILURE: Global sync from sandbox failed."
    exit 1
fi

echo ""
echo "✨ INTEGRATION TEST COMPLETE: ASSA V3.2 is fully portable and functional."
