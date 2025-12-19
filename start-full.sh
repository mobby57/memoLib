#!/bin/bash
# Script de démarrage complet - Frontend + Backend

echo "🚀 DÉMARRAGE COMPLET IAPOSTEMANAGER"
echo "===================================="

# Fonction pour tuer les processus en arrière-plan
cleanup() {
    echo "🛑 Arrêt des services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Démarrer le backend
echo "🔧 Démarrage du backend..."
cd src/backend
python app.py &
BACKEND_PID=$!
echo "✅ Backend démarré (PID: $BACKEND_PID)"

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
sleep 3

# Vérifier que le backend fonctionne
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend opérationnel"
else
    echo "❌ Backend non accessible"
    kill $BACKEND_PID
    exit 1
fi

# 2. Démarrer le frontend
echo "🎨 Démarrage du frontend..."
cd ../frontend

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Démarrer Vite
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend démarré (PID: $FRONTEND_PID)"

echo ""
echo "🌐 URLS D'ACCÈS:"
echo "================================"
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:5000"
echo "API:      http://localhost:5000/api/health"
echo "================================"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les services"

# Attendre indéfiniment
wait