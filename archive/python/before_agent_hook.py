import sys, json, os, shutil
from filelock import FileLock
import ledger_utils

def ensure_l3_setup():
    global_dir = os.path.expanduser("~/.gemini/assa")
    library_dir = os.path.join(global_dir, "LIBRARY")
    
    hook_dir = os.path.dirname(os.path.abspath(__file__))
    extension_root = os.path.dirname(hook_dir)
    templates_dir = os.path.join(extension_root, "templates")
    
    if not os.path.exists(global_dir):
        os.makedirs(library_dir, exist_ok=True)
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
    ensure_l3_setup()
    
    input_data = json.load(sys.stdin)
    transcript = input_data.get("transcript", [])
    
    # Update Ledger State
    ledger = ledger_utils.load_ledger()
    ledger = cascade_rewound(ledger, transcript)
    ledger_utils.save_ledger(ledger)
    
    # Gather Context
    global_dir = os.path.expanduser("~/.gemini/assa")
    soul_path = os.path.join(global_dir, "SOUL.md")
    handbook_path = os.path.join(global_dir, "USER_HANDBOOK.md")
    index_path = os.path.join(global_dir, "index.json")
    
    additional_context = "### L3 GLOBAL WISDOM ###\n"
    additional_context += safe_read_file(soul_path)
    additional_context += safe_read_file(handbook_path)
    additional_context += safe_read_file(index_path)
    
    pending_items = [e for e in ledger if e["status"] == "PENDING"]
    if pending_items:
        additional_context += "### L1 PENDING SIGNALS (Immediate realizations) ###\n"
        additional_context += json.dumps(pending_items, indent=2) + "\n\n"
            
    additional_context += "### L2 PROJECT PATTERNS & DECISIONS ###\n"
    additional_context += safe_read_file(".memory/patterns.md")
    additional_context += safe_read_file(".memory/decisions.md")
    additional_context += safe_read_file(".memory/local_habits.md")

    print(json.dumps({
        "decision": "allow",
        "hookSpecificOutput": {
            "additionalContext": additional_context
        }
    }))

if __name__ == "__main__":
    main()