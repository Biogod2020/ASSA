import sys, json, datetime, os
from filelock import FileLock

def main():
    try:
        input_data = json.load(sys.stdin)
        payload = input_data.get("tool_input", {})
        message_id = input_data.get("message_id")
        
        if not message_id:
            print(json.dumps({"status": "error", "message": "message_id is required from the framework payload"}))
            return

        ledger_path = ".memory/evolution_ledger.json"
        lock_path = ".memory/evolution_ledger.json.lock"
        
        if not os.path.exists(ledger_path):
            with open(ledger_path, "w") as f: json.dump([], f)
            
        with FileLock(lock_path):
            with open(ledger_path, "r") as f:
                ledger = json.load(f)
                
            record = {
                "session_id": input_data.get("session_id", "unknown"),
                "message_id": message_id,
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "status": "PENDING",
                "type": payload.get("type", "unknown"),
                "payload": {
                    "rule": payload.get("rule", ""),
                    "context": payload.get("context", ""),
                    "tags": payload.get("tags", [])
                },
                "git_anchor": ""
            }
            
            ledger.append(record)
            
            with open(ledger_path, "w") as f:
                json.dump(ledger, f, indent=2)
                
        print(json.dumps({"status": "success", "message": "Signal appended to ledger as PENDING"}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    main()