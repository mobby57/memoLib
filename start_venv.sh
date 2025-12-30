#!/bin/bash

echo "🚀 DÉMARRAGE IA POSTE MANAGER - ENVIRONNEMENT VIRTUEL"
echo "===================================================="

# 1. Créer environnement virtuel si nécessaire
if [ ! -d "venv" ]; then
    echo "[1/5] Création environnement virtuel..."
    python3 -m venv venv
else
    echo "[1/5] Environnement virtuel existant trouvé"
fi

# 2. Activer environnement virtuel
echo "[2/5] Activation environnement virtuel..."
source venv/bin/activate

# 3. Installer dépendances
echo "[3/5] Installation dépendances..."
pip install flask flask-cors python-dateutil

# 4. Configurer variables d'environnement
echo "[4/5] Configuration environnement..."
export CLIENT_ID="demo-cabinet"
export CLIENT_NAME="Cabinet Demo"
export SUBSCRIPTION_PLAN="professional"
export CLIENT_COLOR="#3498db"
export MAX_ANALYSIS_MONTHLY="500"
export SECRET_KEY="demo-secret-key-$(date +%s)"
export DATA_DIR="./data"

# 5. Créer dossier data
mkdir -p data

# 6. Lancer application
echo "[5/5] Démarrage application..."
echo ""
echo "🌐 Application disponible sur: http://localhost:5000"
echo "👤 Login: admin / admin123"
echo "🏢 Client: $CLIENT_NAME"
echo "📊 Plan: $SUBSCRIPTION_PLAN"
echo ""
echo "Pour arrêter: Ctrl+C"
echo ""

python flask_app_multitenant.py