#!/bin/bash
echo "🔍 Diagnostic du service WebSocket"

cd ~/projects/memoLib/websocket-server
echo "📂 Contenu du dossier :"
ls -la

echo ""
echo "📄 Contenu du Dockerfile :"
[ -f Dockerfile ] && cat Dockerfile || echo "   ❌ Dockerfile manquant"

echo ""
echo "📄 Contenu de package.json :"
cat package.json

echo ""
echo "🚀 Logs du dernier déploiement :"
railway logs --tail 50
