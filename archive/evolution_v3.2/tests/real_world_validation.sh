#!/bin/bash
set -e

# ASSA V3.2 Real-World Validation
# Verifies installation, local file generation, and global memory modification.

SANDBOX_DIR="/Users/jay/assa-real-world-sandbox"
PROJECT_ROOT="/Users/jay/LocalProjects/self_evolement"
GLOBAL_ASSA_DIR="$HOME/.gemini/assa"

echo "🌍 Starting ASSA V3.2 Real-World Validation..."
echo ""

# 1. Clean environment
rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR"
cd "$SANDBOX_DIR" || exit
git init -q
touch README.md
git add README.md
git commit -m "initial commit" -q

echo "Step 1: Running Gemini with extension loaded..."
# We use gemini -e to load the extension from the source directory.
# This simulates how it would behave if installed.
# We use a simple prompt to trigger the BeforeAgent hook.
gemini -e "$PROJECT_ROOT" -p "Status check. Are you active?" --yolo --output-format text > /dev/null

# 2. Verify Local File Generation
echo "Step 2: Verifying local file generation (.memory/)..."
if [ -d ".memory" ] && [ -f ".memory/patterns.md" ] && [ -f ".memory/decisions.md" ]; then
    echo "  ✓ SUCCESS: .memory directory and baseline files created in workspace."
else
    echo "  ✗ FAILURE: Workspace initialization failed."
    ls -la
    exit 1
fi

# 3. Verify Global Memory Generation
echo "Step 3: Verifying global memory generation (~/.gemini/assa/)..."
if [ -d "$GLOBAL_ASSA_DIR" ] && [ -f "$GLOBAL_ASSA_DIR/SOUL.md" ]; then
    echo "  ✓ SUCCESS: Global ASSA directory and SOUL.md verified."
else
    echo "  ✗ FAILURE: Global initialization failed."
    exit 1
fi

# 4. Verify MCP Tool Functionality (Signal Submission)
echo "Step 4: Testing signal submission via MCP..."
# We run gemini again, this time asking it to record a signal.
gemini -e "$PROJECT_ROOT" -p "Record a positive signal with rule 'Test Logic' and context 'Verification'." --yolo --output-format text > /dev/null

if grep -q "Test Logic" .memory/evolution_ledger.json; then
    echo "  ✓ SUCCESS: Signal successfully recorded in the local ledger via MCP."
else
    echo "  ✗ FAILURE: MCP tool failed to write to ledger."
    cat .memory/evolution_ledger.json
    exit 1
fi

# 5. Verify Hook Trigger (AfterTool Git Commit)
echo "Step 5: Testing AfterTool Hook trigger (Git Commit)..."
echo "new content" > README.md
# This commit should trigger the 'distiller' instruction in additionalContext.
# Since we are in non-interactive mode, we check the debug log to see if it fired.
git add README.md
# We run the commit via gemini shell to ensure it goes through AfterTool
gemini -e "$PROJECT_ROOT" -p "Run shell command: git commit -m 'test trigger'" --yolo --output-format text > /dev/null

if grep -q "Detected git commit → instructing main agent to dispatch Distiller" "$PROJECT_ROOT/hook_debug.log"; then
    echo "  ✓ SUCCESS: AfterTool hook detected commit and injected distiller instruction."
else
    echo "  ✗ FAILURE: AfterTool hook failed to detect commit."
    exit 1
fi

echo ""
echo "✨ REAL-WORLD VALIDATION COMPLETE! ASSA V3.2 is fully integrated and functional."
