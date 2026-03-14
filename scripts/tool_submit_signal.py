import sys, json, datetime, uuid, os

def main():
    try:
        input_data = json.load(sys.stdin)
        payload = input_data.get("tool_input", {})
        
        ledger_path = ".memory/evolution_ledger.json"
        if not os.path.exists(ledger_path):
            with open(ledger_path, "w") as f: json.dump([], f)
            
        with open(ledger_path, "r") as f:
            ledger = json.load(f)
            
        record = {
            "session_id": input_data.get("session_id", "unknown"),
            "message_id": input_data.get("message_id", str(uuid.uuid4())),
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