#!/bin/bash
echo "🐳 Déploiement local en staging..."
docker compose -f docker-compose.staging.yml up -d --build
sleep 3
echo "🔍 Smoke tests locaux..."
python3 scripts/smoke_test.py
if [ $? -eq 0 ]; then
  echo "✅ Tout est ok !"
else
  echo "❌ Échec, arrêt des conteneurs..."
  docker compose -f docker-compose.staging.yml down
fi
