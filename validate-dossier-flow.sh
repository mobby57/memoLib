#!/bin/bash
# validate-dossier-flow.sh
# Vérifie que la création de dossier via l'API crée bien les délais

set -e

echo "🔍 Validation du flux de création de dossier..."

# 1. Vérifier que le serveur tourne
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|307"; then
    echo "❌ Le serveur Next.js n'est pas démarré sur http://localhost:3000"
    exit 1
fi

# 2. Appeler l'API (ajuster l'URL si besoin)
RESPONSE=$(curl -s -X POST http://localhost:3000/api/emails/create-dossier \
  -H "Content-Type: application/json" \
  -d '{"emailId": "test-email-1", "tenantId": "demo"}')

echo "Réponse de l'API : $RESPONSE"

# 3. Vérifier que le dossier a été créé
DOSSIER=$(psql "$DATABASE_URL" -t -c "SELECT id FROM \"Dossier\" ORDER BY \"createdAt\" DESC LIMIT 1;")
if [ -z "$DOSSIER" ]; then
    echo "❌ Aucun dossier créé"
    exit 1
fi
echo "✅ Dossier trouvé : $DOSSIER"

# 4. Vérifier que des délais ont été créés
DELAIS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"LegalDeadline\" WHERE \"dossierId\" = '$DOSSIER';")
if [ "$DELAIS" -eq 0 ]; then
    echo "❌ Aucun délai créé pour le dossier $DOSSIER"
    exit 1
fi

echo "✅ Dossier $DOSSIER créé avec $DELAIS délai(s)"
