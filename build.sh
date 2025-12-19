#!/bin/bash
# Script de build optimisé pour Render.com

set -e  # Arrêter en cas d'erreur

echo "🏗️  BUILD IAPOSTEMANAGER POUR RENDER"
echo "======================================"

# 1. Installation des dépendances système (TTS support)
echo "📦 Installation des dépendances système..."
apt-get update -qq && apt-get install -y -qq \
    espeak \
    libespeak1 \
    libespeak-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Mise à jour pip
echo "📦 Mise à jour de pip..."
python -m pip install --upgrade pip --no-cache-dir

# 3. Installation dépendances Python
echo "📚 Installation des dépendances Python..."
pip install --no-cache-dir -r requirements.txt

# 3. Vérification de l'installation
echo "✅ Vérification de l'installation..."
python -c "import flask; print(f'Flask {flask.__version__} installé')"

# 4. Création des dossiers nécessaires
echo "📁 Création des dossiers..."
mkdir -p src/backend/data
mkdir -p src/backend/logs
mkdir -p src/backend/uploads

# 5. Permissions
echo "🔐 Configuration des permissions..."
chmod -R 755 src/backend/data
chmod -R 755 src/backend/logs

echo "✅ Build terminé avec succès!"
echo "======================================"
