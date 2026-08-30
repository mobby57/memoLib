#!/usr/bin/env bash
set -euo pipefail

SCHEMA="prisma/schema.prisma"

echo "============================================================"
echo " memoLib Prisma CREATE Audit"
echo "============================================================"
echo

python3 - "$SCHEMA" <<'PY'
from pathlib import Path
import re
import sys

schema = Path(sys.argv[1]).read_text()

models = {}
for m in re.finditer(r'(?ms)^model\s+(\w+)\s*\{(.*?)^\}', schema):
    name, body = m.group(1), m.group(2)

    id_match = re.search(r'^\s*id\s+String\s+@id([^\n]*)', body, re.M)
    upd_match = re.search(r'^\s*updatedAt\s+DateTime([^\n]*)', body, re.M)

    if not id_match and not upd_match:
        continue

    models[name] = {
        "id_default": bool(id_match and "@default(" in id_match.group(1)),
        "id_line": id_match.group(0).strip() if id_match else None,
        "updated_default": bool(upd_match and "@default(" in upd_match.group(1)),
        "updated_at": bool(upd_match and "@updatedAt" in upd_match.group(1)),
        "updated_line": upd_match.group(0).strip() if upd_match else None,
    }

for name, info in models.items():
    risks = []

    if info["id_line"] and not info["id_default"]:
        risks.append("id sans @default")

    if info["updated_line"] and not info["updated_at"] and not info["updated_default"]:
        risks.append("updatedAt sans @updatedAt/@default")

    if risks:
        print(f"⚠ {name}: " + ", ".join(risks))
        if info["id_line"]:
            print(f"  {info['id_line']}")
        if info["updated_line"]:
            print(f"  {info['updated_line']}")
        print()

print("Audit terminé.")
PY
