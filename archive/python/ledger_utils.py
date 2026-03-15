import json, os
from filelock import FileLock

LEDGER_PATH = ".memory/evolution_ledger.json"
LOCK_PATH = ".memory/evolution_ledger.json.lock"

def load_ledger():
    if not os.path.exists(LEDGER_PATH):
        return []
    with FileLock(LOCK_PATH):
        with open(LEDGER_PATH, "r") as f:
            return json.load(f)

def save_ledger(ledger):
    with FileLock(LOCK_PATH):
        with open(LEDGER_PATH, "w") as f:
            json.dump(ledger, f, indent=2)

def mark_processed(message_ids):
    ledger = load_ledger()
    for entry in ledger:
        if entry["message_id"] in message_ids:
            entry["status"] = "PROCESSED"
    save_ledger(ledger)
