#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo " memoLib — Correction types NextAuth"
echo "========================================"

FILE="src/types/next-auth.d.ts"

if [[ ! -f "$FILE" ]]; then
  echo "❌ Fichier introuvable : $FILE"
  exit 1
fi

BACKUP="${FILE}.bak.$(date +%Y%m%d-%H%M%S)"
cp "$FILE" "$BACKUP"

echo "✓ Backup créé : $BACKUP"

python3 - "$FILE" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8-sig")

original = text

# ------------------------------------------------------------
# clientId : autoriser null
# ------------------------------------------------------------
text = text.replace(
    "clientId?: string;",
    "clientId?: string | null;"
)

text = text.replace(
    "clientId: string;",
    "clientId: string | null;"
)

# ------------------------------------------------------------
# tenantName / tenantPlan
# ------------------------------------------------------------
if "tenantName?: string;" not in text:
    text = text.replace(
        "tenantId?: string;",
        "tenantId?: string;\n    tenantName?: string;",
        1
    )

if "tenantPlan?: string;" not in text:
    # Ajouter tenantPlan après tenantName si possible
    text = text.replace(
        "tenantName?: string;",
        "tenantName?: string;\n    tenantPlan?: string;",
        1
    )

# ------------------------------------------------------------
# Écriture uniquement si changement
# ------------------------------------------------------------
if text == original:
    print("⚠️ Aucun changement automatique effectué.")
else:
    path.write_text(text, encoding="utf-8")
    print("✓ next-auth.d.ts corrigé")

PY

echo
echo "== Diff =="

git diff -- "$FILE" || true

echo
echo "== TypeScript =="

npm run type-check

echo
echo "========================================"
echo " ✓ Terminé"
echo "========================================"
echo "Backup : $BACKUP"
