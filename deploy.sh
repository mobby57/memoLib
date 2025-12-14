#!/bin/bash
# Déploiement automatique Railway

echo "🚀 Déploiement IAPosteManager v2.2 sur Railway..."

# Build frontend
cd src/frontend
npm ci
npm run build
cd ../..

# Push vers Railway
git add .
git commit -m "Deploy v2.2 - Production ready"
railway login
railway link
railway up

echo "✅ Déploiement terminé!"
echo "🌐 URL: https://iapostemanager.up.railway.app"