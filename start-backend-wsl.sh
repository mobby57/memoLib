#!/bin/bash
# =============================================================================
# Script de Démarrage Backend - WSL2
# =============================================================================

echo "🚀 Démarrage Backend iaPosteManager (WSL2)"
echo ""

# Aller dans le répertoire du projet
cd /mnt/c/Users/moros/Desktop/iaPostemanage

# Activer virtualenv
echo "📦 Activation virtualenv..."
source venv-linux/bin/activate

# Vérifier PostgreSQL
echo "🔍 Vérification PostgreSQL..."
if docker exec iaposte_postgres pg_isready -U iaposte > /dev/null 2>&1; then
    echo "✅ PostgreSQL opérationnel"
    export DATABASE_URL=postgresql://iaposte:changeme@localhost:5432/iapostemanager
    echo "🔗 Connexion: PostgreSQL"
else
    echo "⚠️  PostgreSQL non disponible - utilisation SQLite"
    export DATABASE_URL=sqlite:///iapostemanager.db
    echo "🔗 Connexion: SQLite"
fi

# Charger variables d'environnement
if [ -f .env ]; then
    echo "📝 Chargement .env..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Vérifier clé OpenAI
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-proj-VOTRE_CLE_ICI" ]; then
    echo ""
    echo "⚠️  ATTENTION: OPENAI_API_KEY non configurée!"
    echo "   Modifier le fichier .env avec votre clé OpenAI"
    echo ""
fi

# Afficher configuration
echo ""
echo "📋 Configuration:"
echo "   - Python: $(python --version)"
echo "   - Database: $DATABASE_URL"
echo "   - Environment: ${FLASK_ENV:-development}"
echo ""

# Lancer l'application
echo "🎯 Démarrage application..."
echo "   Backend: http://127.0.0.1:5000"
echo "   API Docs: http://127.0.0.1:5000/api/docs"
echo "   Health: http://127.0.0.1:5000/api/health"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd src/backend
python app.py
