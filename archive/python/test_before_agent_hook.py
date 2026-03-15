import json
import subprocess
import os
import shutil

def test_before_agent_hook_cascades_rewound(temp_project, mock_global_wisdom):
    # Get absolute paths to source files before changing directory in fixture
    base_dir = "/Users/jay/LocalProjects/self_evolement"
    hook_src = os.path.join(base_dir, "hooks/before_agent_hook.py")
    utils_src = os.path.join(base_dir, "hooks/ledger_utils.py")

    # 1. Setup Ledger with a PENDING item
    ledger_path = ".memory/evolution_ledger.json"
    initial_ledger = [
        {
            "session_id": "session-1",
            "message_id": "msg-to-be-rewound",
            "status": "PENDING",
            "type": "negative",
            "payload": {"rule": "Test Rule"}
        }
    ]
    with open(ledger_path, "w") as f:
        json.dump(initial_ledger, f)

    # 2. Setup Templates (needed for the hook to run without error)
    os.makedirs("templates", exist_ok=True)
    with open("templates/SOUL.md", "w") as f: f.write("Soul")
    with open("templates/USER_HANDBOOK.md", "w") as f: f.write("Handbook")
    with open("templates/index.json", "w") as f: f.write("{}")
    
    # 3. Copy hook to temp project
    os.makedirs("hooks", exist_ok=True)
    shutil.copy(hook_src, "hooks/before_agent_hook.py")
    shutil.copy(utils_src, "hooks/ledger_utils.py")

    # 4. Mock Input: Transcript DOES NOT contain the message_id
    mock_input = {
        "transcript": [{"messageId": "some-other-msg"}]
    }

    # 5. Execute Hook
    process = subprocess.Popen(
        ["python3", "hooks/before_agent_hook.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate(input=json.dumps(mock_input))

    # 6. Verify Result
    assert process.returncode == 0
    with open(ledger_path, "r") as f:
        updated_ledger = json.load(f)
    
    assert updated_ledger[0]["status"] == "REWOUND"
