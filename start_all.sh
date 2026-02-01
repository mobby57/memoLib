#!/bin/bash
# Script de démarrage multi-stack - IA Poste Manager v3.1
# Lance Python Flask + Next.js + Node.js API en parallèle

echo "🚀 Démarrage IA Poste Manager v3.1 - Multi-Stack"
echo "=================================================="

# Fonction pour tuer tous les processus à la fin
cleanup() {
    echo "🛑 Arrêt des services..."
    pkill -f "python app.py"
    pkill -f "next dev"
    pkill -f "node nodejs_api.js"
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Vérifier la configuration
echo "🔍 Vérification configuration..."
python check_env.py
if [ $? -ne 0 ]; then
    echo "❌ Configuration incomplète - continuons quand même"
fi

# 2. Installer dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation dépendances Node.js..."
    npm install
fi

# 3. Démarrer Flask (Python) - Port 5000
echo "🐍 Démarrage Flask (Python) sur port 5000..."
python app.py &
FLASK_PID=$!

# 4. Démarrer Next.js - Port 3000
echo "⚛️  Démarrage Next.js sur port 3000..."
npm run dev &
NEXTJS_PID=$!

# 5. Démarrer Node.js API - Port 8000
echo "🟢 Démarrage Node.js API sur port 8000..."
PORT=8000 node nodejs_api.js &
NODEJS_PID=$!

# Attendre que les services démarrent
sleep 5

echo ""
echo "✅ Tous les services sont démarrés!"
echo "=================================="
echo "🐍 Flask (Python):    http://localhost:5000"
echo "⚛️  Next.js:          http://localhost:3000"
echo "🟢 Node.js API:       http://localhost:8000"
echo ""
echo "📊 APIs disponibles:"
echo "• Flask:    POST http://localhost:5000/api/ceseda/hybrid-predict"
echo "• Next.js:  POST http://localhost:3000/api/ceseda/predict"
echo "• Node.js:  POST http://localhost:8000/api/predict"
echo ""
echo "🔄 Proxy automatique configuré entre les services"
echo "Press Ctrl+C to stop all services"

# Garder le script actif
wait