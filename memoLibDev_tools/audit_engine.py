import json, hashlib
from datetime import datetime
from pathlib import Path

AUDIT_LOG = Path("audit_trail.jsonl")
class AuditEngine:
    @staticmethod
    def log_action(action: str, details: dict, status: str = "PENDING_APPROVAL"):
        timestamp = datetime.now().isoformat()
        block = {"timestamp": timestamp, "action": action, "details": details, "status": status, "human_approved_by": None}
        if AUDIT_LOG.exists():
            with open(AUDIT_LOG, "r") as f: last_line = f.readlines()[-1]
            block["previous_hash"] = hashlib.sha256(last_line.encode()).hexdigest()
        else: block["previous_hash"] = "0" * 64
        block["hash"] = hashlib.sha256(json.dumps(block, sort_keys=True).encode()).hexdigest()
        with open(AUDIT_LOG, "a") as f: f.write(json.dumps(block) + "\n")
        print(f"✅ [AUDIT] Action '{action}' logguée.")
