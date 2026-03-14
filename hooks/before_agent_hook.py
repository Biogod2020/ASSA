import sys, json, os, shutil
from filelock import FileLock

def ensure_l3_setup():
    global_dir = os.path.expanduser("~/.gemini/assa")
    library_dir = os.path.join(global_dir, "LIBRARY")
    
    # Get the directory of the current hook script to find templates
    hook_dir = os.path.dirname(os.path.abspath(__file__))
    extension_root = os.path.dirname(hook_dir)
    templates_dir = os.path.join(extension_root, "templates")
    
    if not os.path.exists(global_dir):
        os.makedirs(library_dir, exist_ok=True)
        
        # Copy initial templates to global directory
        templates_to_copy = ["SOUL.md", "USER_HANDBOOK.md", "index.json"]
        for filename in templates_to_copy:
            src = os.path.join(templates_dir, filename)
            dst = os.path.join(global_dir, filename)
            if os.path.exists(src):
                shutil.copy2(src, dst)

def cascade_rewound(ledger, transcript):
    active_message_ids = {turn.get("messageId") for turn in transcript if "messageId" in turn}
    for entry in ledger:
        if entry["status"] in ["PENDING", "PROCESSED"] and entry["message_id"] not in active_message_ids:
            entry["status"] = "REWOUND"
    return ledger

def safe_read_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r") as f: return f.read() + "\n"
    return ""

def main():
    # Ensure L3 environment is ready
    ensure_l3_setup()
    
    input_data = json.load(sys.stdin)
    transcript = input_data.get("transcript", [])
    
    ledger_path = ".memory/evolution_ledger.json"
    lock_path = ".memory/evolution_ledger.json.lock"
    patterns_path = ".memory/patterns.md"
    
    global_dir = os.path.expanduser("~/.gemini/assa")
    soul_path = os.path.join(global_dir, "SOUL.md")
    handbook_path = os.path.join(global_dir, "USER_HANDBOOK.md")
    index_path = os.path.join(global_dir, "index.json")
    
    additional_context = "### L3 GLOBAL WISDOM ###\n"
    additional_context += safe_read_file(soul_path)
    additional_context += safe_read_file(handbook_path)
    additional_context += safe_read_file(index_path)
    
    if os.path.exists(ledger_path):
        with FileLock(lock_path):
            with open(ledger_path, "r") as f: ledger = json.load(f)
            ledger = cascade_rewound(ledger, transcript)
            with open(ledger_path, "w") as f: json.dump(ledger, f, indent=2)
            
            pending_items = [e for e in ledger if e["status"] == "PENDING"]
            if pending_items:
                additional_context += "### L1 PENDING SIGNALS ###\n"
                additional_context += json.dumps(pending_items, indent=2) + "\n\n"
            
    additional_context += "### L2 PROJECT PATTERNS ###\n"
    additional_context += safe_read_file(patterns_path)

    print(json.dumps({
        "decision": "allow",
        "hookSpecificOutput": {
            "additionalContext": additional_context
        }
    }))

if __name__ == "__main__":
    main()