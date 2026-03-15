import json
import subprocess
import os
import shutil

def test_before_agent_hook_injects_all_layers(temp_project, mock_global_wisdom):
    # Get absolute paths to source files
    base_dir = "/Users/jay/LocalProjects/self_evolement"
    hook_src = os.path.join(base_dir, "hooks/before_agent_hook.py")
    utils_src = os.path.join(base_dir, "hooks/ledger_utils.py")

    # 1. Setup Global Wisdom (L3)
    with open(os.path.join(mock_global_wisdom, "SOUL.md"), "w") as f: f.write("GLOBAL_SOUL_CONTENT")
    with open(os.path.join(mock_global_wisdom, "USER_HANDBOOK.md"), "w") as f: f.write("GLOBAL_HANDBOOK_CONTENT")
    with open(os.path.join(mock_global_wisdom, "index.json"), "w") as f: f.write('{"global": "index"}')

    # 2. Setup Local Project Patterns (L2)
    with open(".memory/patterns.md", "w") as f: f.write("LOCAL_PATTERNS_CONTENT")
    with open(".memory/decisions.md", "w") as f: f.write("LOCAL_DECISIONS_CONTENT")

    # 3. Setup Ledger with a PENDING item (L1)
    ledger_path = ".memory/evolution_ledger.json"
    with open(ledger_path, "w") as f:
        json.dump([{
            "session_id": "s1", "message_id": "m1", "status": "PENDING", 
            "type": "positive", "payload": {"rule": "LOCAL_L1_RULE"}
        }], f)

    # 4. Copy hook to temp project
    os.makedirs("hooks", exist_ok=True)
    shutil.copy(hook_src, "hooks/before_agent_hook.py")
    shutil.copy(utils_src, "hooks/ledger_utils.py")
    
    # Also need templates directory for ensure_l3_setup to not fail
    os.makedirs("templates", exist_ok=True)
    with open("templates/SOUL.md", "w") as f: f.write("template")
    with open("templates/USER_HANDBOOK.md", "w") as f: f.write("template")
    with open("templates/index.json", "w") as f: f.write("{}")

    # 5. Execute Hook
    mock_input = {"transcript": [{"messageId": "m1"}]}
    process = subprocess.Popen(
        ["python3", "hooks/before_agent_hook.py"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    stdout, stderr = process.communicate(input=json.dumps(mock_input))

    # 6. Verify Context Injection
    assert process.returncode == 0
    output = json.loads(stdout)
    context = output["hookSpecificOutput"]["additionalContext"]
    
    assert "GLOBAL_SOUL_CONTENT" in context
    assert "GLOBAL_HANDBOOK_CONTENT" in context
    assert '{"global": "index"}' in context
    assert "LOCAL_PATTERNS_CONTENT" in context
    assert "LOCAL_DECISIONS_CONTENT" in context
    assert "LOCAL_L1_RULE" in context
