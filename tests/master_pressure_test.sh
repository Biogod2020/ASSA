#!/bin/bash
set -e

# ASSA V3.2 Master Pressure Test (Robustness Edition)
# Verifies: Self-Healing, Guard, Reflex, Evolution, Sync, and Hook Robustness.

SANDBOX_DIR="/Users/jay/assa-master-sandbox"
PROJECT_ROOT="/Users/jay/LocalProjects/self_evolement"
GLOBAL_ASSA_DIR="$HOME/.gemini/assa"

echo "🚀 Starting ASSA V3.2 Master Pressure Test..."
echo ""

# --- PHASE 1: SELF-HEALING ---
echo "Phase 1: Testing Self-Healing..."
rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR"
cd "$SANDBOX_DIR" || exit
git init -q

# Initialize extension structure
mkdir -p hooks agents skills/assa-core/scripts templates .memory
cp "$PROJECT_ROOT/gemini-extension.json" .
cp "$PROJECT_ROOT/GEMINI.md" .
cp -r "$PROJECT_ROOT/hooks/"* hooks/
cp -r "$PROJECT_ROOT/agents/"* agents/
cp -r "$PROJECT_ROOT/skills/"* skills/
cp -r "$PROJECT_ROOT/templates/"* templates/

# Simulate BeforeAgent with missing files - Should recreate them
rm -rf .memory patterns.md
echo '{"agentName": "main"}' | node hooks/beforeAgentHook.js > /dev/null
if [ -d ".memory" ] && [ -f ".memory/patterns.md" ]; then
    echo "  ✓ SUCCESS: .memory and patterns.md auto-recreated."
else
    echo "  ✗ FAILURE: Self-healing failed."
    exit 1
fi

# --- PHASE 2: HEALTH GUARD ---
echo "Phase 2: Testing Health Guard..."
MOCK_SETTINGS="$SANDBOX_DIR/mock_settings.json"
echo '{"experimental": {"enableAgents": false}}' > "$MOCK_SETTINGS"
# Test 1: Disabled subagents
RESULT=$(echo "{\"agentName\": \"main\", \"transcript_path\": \".memory/patterns.md\", \"overrides\": {\"settingsPath\": \"$MOCK_SETTINGS\"}}" | node hooks/beforeAgentHook.js)
if echo "$RESULT" | grep -q "Subagents are disabled"; then
    echo "  ✓ SUCCESS: Health warning detected for disabled agents."
else
    echo "  ✗ FAILURE: Health guard failed to detect disabled agents."
    exit 1
fi

# --- PHASE 3: SMART REFLEX ---
echo "Phase 3: Testing Smart Reflex (Pattern Recognition)..."
cat > .memory/mock_history.json << 'EOF'
{
  "messages": [
    { "id": "t1", "type": "gemini", "toolCalls": [{ "name": "shell", "result": "<!-- ASSA_METADATA: [FAILED: shell] -->" }] },
    { "id": "t2", "type": "gemini", "toolCalls": [{ "name": "shell", "result": "<!-- ASSA_METADATA: [FAILED: shell] -->" }] },
    { "id": "t3", "type": "gemini", "toolCalls": [{ "name": "shell", "result": "<!-- ASSA_METADATA: [FAILED: shell] -->" }] },
    { "id": "t4", "type": "gemini", "toolCalls": [{ "name": "shell", "result": "<!-- ASSA_METADATA: [SUCCESS: shell] -->" }] },
    { "id": "t5", "type": "user", "content": "很好,做得非常棒" }
  ]
}
EOF
RESULT=$(echo '{"agentName": "main", "transcript_path": ".memory/mock_history.json"}' | node hooks/beforeAgentHook.js)
if echo "$RESULT" | grep -q "ASSA REFLEX: VICTORY DETECTED" && \
   echo "$RESULT" | grep -q "ASSA REFLEX: BARRIER DETECTED" && \
   echo "$RESULT" | grep -q "ASSA REFLEX: PRAISE DETECTED"; then
    echo "  ✓ SUCCESS: Victory, Barrier, and Praise reflexes detected correctly via schema-aware analysis."
else
    echo "  ✗ FAILURE: Reflex detection logic failed."
    exit 1
fi

# --- PHASE 4: EVOLUTION LOOP ---
echo "Phase 4: Testing Evolution Loop (Distiller Subagent)..."
# Seed signals
cat > .memory/evolution_ledger.json << 'EOF'
[
  {"session_id": "master-test", "message_id": "m1", "status": "PENDING", "payload": {"rule": "Test Pattern Alpha"}},
  {"session_id": "master-test", "message_id": "m2", "status": "PENDING", "payload": {"rule": "Test Pattern Beta"}}
]
EOF
git add . && git commit -m "trigger distillation" -q

# Run Distiller agent directly
ASSA_EVOLVING=true gemini -e . @distiller "Process the pending signals in .memory/evolution_ledger.json." \
  --allowed-mcp-server-names assa-mcp \
  --yolo --output-format text > /dev/null

if grep -q "PROCESSED" .memory/evolution_ledger.json; then
    echo "  ✓ SUCCESS: Distiller agent processed signals correctly."
else
    echo "  ✗ FAILURE: Distiller processing failed."
    exit 1
fi

# --- PHASE 5: GLOBAL SYNC ---
echo "Phase 5: Testing Global Sync (Syncer Subagent)..."
cat > .memory/patterns.md << 'EOF'
---
id: P-MASTER-SYNC-TEST
category: Style
confidence: 10
status: Active
hit_count: 5
---
# Sync Test Rule
**Rationale**: Master test for global promotion.
**Rule**: Always prefer Node.js for high-performance middleware.
EOF

# Simulate git push - we invoke syncer directly
ASSA_EVOLVING=true gemini -e . @syncer "Audit and promote mature patterns from .memory/patterns.md to global library." \
  --allowed-mcp-server-names assa-mcp \
  --yolo --output-format text > /dev/null

if grep -r "Node.js" "$GLOBAL_ASSA_DIR/LIBRARY/" | grep -q "middleware"; then
    echo "  ✓ SUCCESS: Pattern successfully promoted to Global Library."
else
    echo "  ✗ FAILURE: Pattern not found in Global Library."
    exit 1
fi

# --- PHASE 6: HOOK ROBUSTNESS ---
echo "Phase 6: Testing Hook Robustness (AfterTool)..."

# Test 1: Empty input should not crash and return allow
RESULT_EMPTY=$(echo "" | node hooks/afterToolHook.js)
if echo "$RESULT_EMPTY" | grep -q '"decision":"allow"'; then
    echo "  ✓ SUCCESS: AfterTool handled empty input safely."
else
    echo "  ✗ FAILURE: AfterTool crashed or failed on empty input."
    exit 1
fi

# Test 2: Malformed JSON should not crash and return allow
RESULT_MALFORMED=$(echo "{invalid: json}" | node hooks/afterToolHook.js)
if echo "$RESULT_MALFORMED" | grep -q '"decision":"allow"'; then
    echo "  ✓ SUCCESS: AfterTool handled malformed JSON safely."
else
    echo "  ✗ FAILURE: AfterTool crashed on malformed JSON."
    exit 1
fi

# Test 3: Precise status detection (Metadata over text)
# Even if content has 'error' in text, status 'success' should prevail
RESULT_PRECISION=$(echo '{"tool_name": "write_file", "tool_response": {"status": "success", "llmContent": "This is a fix for an error."}}' | node hooks/afterToolHook.js)
if echo "$RESULT_PRECISION" | grep -q "ASSA_METADATA: \[SUCCESS: write_file\]"; then
    echo "  ✓ SUCCESS: AfterTool correctly prioritized status over textual 'error' strings."
else
    echo "  ✗ FAILURE: AfterTool falsely identified error in text as tool failure."
    echo "Output: $RESULT_PRECISION"
    exit 1
fi

echo ""
echo "✨ ALL PHASES PASSED! ASSA V3.2 is officially rock-solid."
