#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Correction LegalDeadline — Seed E2E"
echo "====================================="

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SEED="prisma/seed-e2e.ts"

if [[ ! -f "$SEED" ]]; then
  echo "❌ $SEED introuvable"
  exit 1
fi

cp "$SEED" "$SEED.bak.$(date +%Y%m%d-%H%M%S)"
echo "📦 Backup du seed créé"

python3 <<'PY'
from pathlib import Path
import re

path = Path("prisma/seed-e2e.ts")
text = path.read_text()

pattern = re.compile(
    r"  // 8\. Deadline légale.*?"
    r"\n  // Update tenant counts",
    re.S
)

replacement = """  // 8. Deadline légale
  // IMPORTANT : LegalDeadline est une fonctionnalité cœur.
  // On ne masque volontairement aucune erreur ici.
  const deadline = await prisma.legalDeadline.upsert({
    where: { id: 'deadline_e2e_1' },
    update: {
      tenantId: tenant.id,
      dossierId: dossier1.id,
      clientId: client1.id,
      type: 'OQTF',
      label: 'Recours TA contre OQTF',
      description: 'Délai de 48h pour le recours contre l’OQTF sans délai',
      referenceDate: new Date(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'CRITICAL',
      legalBasis: 'CESEDA — OQTF',
      legalDays: 2,
      updatedAt: new Date(),
    },
    create: {
      id: 'deadline_e2e_1',
      tenantId: tenant.id,
      dossierId: dossier1.id,
      clientId: client1.id,
      type: 'OQTF',
      label: 'Recours TA contre OQTF',
      description: 'Délai de 48h pour le recours contre l’OQTF sans délai',
      referenceDate: new Date(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'CRITICAL',
      legalBasis: 'CESEDA — OQTF',
      legalDays: 2,
      createdBy: lawyer.id,
      updatedAt: new Date(),
    },
  });

  console.log(`⏰ Deadline créée: ${deadline.id}`);

  // Update tenant counts"""

new_text, count = pattern.subn(replacement, text)

if count != 1:
    raise SystemExit(
        f"❌ Impossible de remplacer le bloc LegalDeadline "
        f"(blocs trouvés: {count})"
    )

path.write_text(new_text)
print("✅ Bloc LegalDeadline corrigé")
PY

echo
echo "🔎 Vérification du bloc corrigé..."
sed -n '/\/\/ 8\. Deadline légale/,/\/\/ Update tenant counts/p' "$SEED"

echo
echo "🧬 Régénération Prisma..."
npx prisma generate

echo
echo "🧪 Exécution du seed E2E..."
npx tsx prisma/seed-e2e.ts

echo
echo "🔍 Vérification SQL de deadline_e2e_1..."
COUNT="$(psql "$DATABASE_URL" -tAc \
  'SELECT COUNT(*) FROM "LegalDeadline" WHERE id = '\''deadline_e2e_1'\'';')"

COUNT="$(echo "$COUNT" | tr -d '[:space:]')"

if [[ "$COUNT" != "1" ]]; then
  echo "❌ deadline_e2e_1 absente"
  echo "Nombre trouvé: $COUNT"
  exit 1
fi

echo "✅ deadline_e2e_1 présente"

echo
echo "📋 Vérification détaillée..."
psql "$DATABASE_URL" -c '
SELECT
  id,
  "dossierId",
  "clientId",
  type,
  label,
  status,
  "dueDate",
  "createdBy"
FROM "LegalDeadline"
WHERE id = '\''deadline_e2e_1'\'';
'

echo
echo "====================================="
echo "🎉 LegalDeadline E2E correctement configurée"
echo "====================================="
