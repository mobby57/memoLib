#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIX_ALL="$ROOT/scripts/fix-all.sh"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$ROOT/.fix-script-backup/$STAMP"

echo "============================================================"
echo " memoLib — FIX SCRIPT"
echo "============================================================"
echo " Projet : $ROOT"
echo " Cible  : $FIX_ALL"
echo " Prisma : PROTÉGÉ — aucune modification du schema.prisma"
echo " Date   : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================================"

if [[ ! -f "$FIX_ALL" ]]; then
  echo "❌ $FIX_ALL introuvable"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cp "$FIX_ALL" "$BACKUP_DIR/fix-all.sh"

echo
echo "=== 1/6 — Protection Prisma ==="

SCHEMA="$ROOT/prisma/schema.prisma"

if [[ ! -f "$SCHEMA" ]]; then
  echo "⚠️ schema.prisma introuvable"
else
  SCHEMA_HASH_BEFORE="$(sha256sum "$SCHEMA" | awk '{print $1}')"
  echo "✅ Hash Prisma avant : $SCHEMA_HASH_BEFORE"
fi

echo
echo "=== 2/6 — Analyse syntaxique de fix-all.sh ==="

if bash -n "$FIX_ALL"; then
  echo "✅ Syntaxe Bash initiale OK"
else
  echo "⚠️ Syntaxe Bash incorrecte — tentative de réparation sûre"
fi

echo
echo "=== 3/6 — Détection des lignes parasites ==="

python3 - "$FIX_ALL" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()

lines = text.splitlines()
bad = []

for i, line in enumerate(lines, 1):
    s = line.strip()

    # Une ligne de séparateurs seule ne doit jamais être exécutée
    if s.startswith("===") and s.endswith("==="):
        bad.append((i, line, "séparateur brut"))

    # Artefacts fréquents d'un copier/coller de sortie terminal
    if s in {
        "Accept:",
        "GET",
        "User-Agent:",
        "svg",
        "##",
    }:
        bad.append((i, line, "artefact"))

print(f"Lignes suspectes : {len(bad)}")

for n, line, reason in bad[:50]:
    print(f"  ligne {n}: [{reason}] {line!r}")
PY

echo
echo "=== 4/6 — Correction mécanique de fix-all.sh ==="

python3 - "$FIX_ALL" <<'PY'
import sys
import re
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()

original = text
lines = text.splitlines()

clean = []

for line in lines:
    s = line.strip()

    # Supprimer uniquement les séparateurs décoratifs qui ont été
    # accidentellement transformés en commandes shell.
    if s.startswith("===") and s.endswith("==="):
        continue

    # Artefacts manifestement issus d'une sortie terminal / copier-coller.
    if s in {
        "Accept:",
        "GET",
        "User-Agent:",
        "svg",
        "##",
    }:
        continue

    clean.append(line)

text = "\n".join(clean) + "\n"

# Corriger un problème classique :
# une ligne de séparation suivie d'un commentaire qui a perdu son '#'.
text = re.sub(
    r'(?m)^[ \t]*={10,}[ \t]*$',
    '',
    text
)

if text != original:
    path.write_text(text)
    print("✅ Corrections mécaniques appliquées")
else:
    print("✅ Aucune correction mécanique nécessaire")
PY

echo
echo "=== 5/6 — Validation du script réparé ==="

if bash -n "$FIX_ALL"; then
  echo "✅ fix-all.sh est syntaxiquement valide"
else
  echo "❌ fix-all.sh reste syntaxiquement invalide"
  echo
  echo "Dernières lignes du script :"
  tail -n 80 "$FIX_ALL"
  exit 1
fi

chmod +x "$FIX_ALL"

echo
echo "=== 6/6 — Vérification Prisma ==="

if [[ -f "$SCHEMA" ]]; then
  SCHEMA_HASH_AFTER="$(sha256sum "$SCHEMA" | awk '{print $1}')"

  echo "Hash Prisma après : $SCHEMA_HASH_AFTER"

  if [[ "$SCHEMA_HASH_BEFORE" == "$SCHEMA_HASH_AFTER" ]]; then
    echo "✅ schema.prisma INCHANGÉ"
  else
    echo "❌ ALERTE : schema.prisma a changé"
    echo "   Restauration automatique depuis Git..."

    git checkout -- prisma/schema.prisma

    SCHEMA_HASH_RESTORED="$(sha256sum "$SCHEMA" | awk '{print $1}')"

    echo "Hash restauré : $SCHEMA_HASH_RESTORED"

    if [[ "$SCHEMA_HASH_BEFORE" != "$SCHEMA_HASH_RESTORED" ]]; then
      echo "❌ Impossible de garantir la restauration Prisma"
      exit 1
    fi

    echo "✅ schema.prisma restauré"
  fi
fi

echo
echo "============================================================"
echo " FIX SCRIPT TERMINÉ"
echo "============================================================"
echo "Backup : $BACKUP_DIR"
echo
echo "Prochaine étape :"
echo "  bash -n scripts/fix-all.sh"
echo "  ./scripts/fix-all.sh"
echo
echo "⚠️ Ce script ne lance PAS de migration Prisma."
echo "⚠️ Ce script ne modifie PAS volontairement prisma/schema.prisma."
echo "============================================================"
