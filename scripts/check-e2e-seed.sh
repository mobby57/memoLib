#!/usr/bin/env bash

set -euo pipefail

echo "🧪 Vérification E2E MemoLib"
echo "=========================="

echo ""
echo "1️⃣ Vérification Prisma..."
npx prisma migrate status

echo ""
echo "2️⃣ Vérification des tables..."

LEGAL_DEADLINE="$(psql "$DATABASE_URL" -tAc \
  "SELECT to_regclass('public.\"LegalDeadline\"');")"

DEADLINE_ALERT="$(psql "$DATABASE_URL" -tAc \
  "SELECT to_regclass('public.\"DeadlineAlert\"');")"

case "$LEGAL_DEADLINE" in
  '"LegalDeadline"')
    echo "✅ LegalDeadline présente"
    ;;
  *)
    echo "❌ Table LegalDeadline absente"
    echo "Valeur retournée: [$LEGAL_DEADLINE]"
    exit 1
    ;;
esac

case "$DEADLINE_ALERT" in
  '"DeadlineAlert"')
    echo "✅ DeadlineAlert présente"
    ;;
  *)
    echo "❌ Table DeadlineAlert absente"
    echo "Valeur retournée: [$DEADLINE_ALERT]"
    exit 1
    ;;
esac

echo ""
echo "3️⃣ Recherche des anciens noms..."

if grep -R -n \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude='*.bak.*' \
  'legalDeadlin\.' src prisma 2>/dev/null; then

  echo ""
  echo "❌ Ancien nom legalDeadlin détecté"
  exit 1
fi

echo "✅ Aucun ancien legalDeadlin détecté"

echo ""
echo "4️⃣ Génération Prisma..."

npx prisma generate

echo ""
echo "5️⃣ Exécution du seed E2E..."

npx tsx prisma/seed-e2e.ts

echo ""
echo "6️⃣ Vérification de la deadline E2E..."

COUNT="$(psql "$DATABASE_URL" -tAc \
  "SELECT COUNT(*) FROM \"LegalDeadline\" WHERE id = 'deadline_e2e_1';")"

if [ "$COUNT" != "1" ]; then
  echo "❌ deadline_e2e_1 absente"
  echo "Nombre trouvé: $COUNT"
  exit 1
fi

echo "✅ deadline_e2e_1 présente"

echo ""
echo "7️⃣ Contrôle des données..."

psql "$DATABASE_URL" -c '
SELECT
  id,
  "dossierId",
  "clientId",
  type,
  label,
  status,
  "dueDate",
  "legalBasis",
  "legalDays",
  "createdBy"
FROM "LegalDeadline"
WHERE id = '\''deadline_e2e_1'\'';
'

echo ""
echo "================================"
echo "✅ E2E SEED VALIDÉ"
echo "================================"
