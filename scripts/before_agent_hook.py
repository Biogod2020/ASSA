import sys, json, os

def cascade_rewound(ledger, transcript):
    # Time-travel defense: mark ledger items as REWOUND if message_id is no longer in transcript
    active_message_ids = {turn.get("messageId") for turn in transcript if "messageId" in turn}
    
    for entry in ledger:
        if entry["status"] == "PENDING" and entry["message_id"] not in active_message_ids:
            entry["status"] = "REWOUND"
    return ledger

def main():
    input_data = json.load(sys.stdin)
    transcript = input_data.get("transcript", [])
    
    ledger_path = ".memory/evolution_ledger.json"
    patterns_path = ".memory/patterns.md"
    
    additional_context = ""
    
    if os.path.exists(ledger_path):
        with open(ledger_path, "r") as f: ledger = json.load(f)
        ledger = cascade_rewound(ledger, transcript)
        with open(ledger_path, "w") as f: json.dump(ledger, f, indent=2)
        
        pending_items = [e for e in ledger if e["status"] == "PENDING"]
        if pending_items:
            additional_context += "### IMMEDIATE PENDING MEMORY SIGNALS:\n"
            additional_context += json.dumps(pending_items, indent=2) + "\n\n"
            
    if os.path.exists(patterns_path):
        with open(patterns_path, "r") as f:
            additional_context += "### PROJECT ARCHITECTURE PATTERNS (L2):\n"
            additional_context += f.read() + "\n"

    print(json.dumps({
        "decision": "allow",
        "hookSpecificOutput": {
            "additionalContext": additional_context
        }
    }))

if __name__ == "__main__":
    main()