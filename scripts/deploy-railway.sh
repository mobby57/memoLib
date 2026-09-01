#!/bin/bash
# deploy-railway.sh – Déploiement automatisé sur Railway
set -e

echo "🚀 Déploiement automatique sur Railway"

# 1. Vérifier les prérequis
if ! command -v npx &> /dev/null; then
    echo "❌ npx introuvable. Installez Node.js."
    exit 1
fi

# 2. Vérifier si les variables d'environnement sont définies
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL non définie."
    read -p "Souhaitez-vous ajouter une base de données PostgreSQL sur Railway ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        echo "👉 Créez une base PostgreSQL depuis l'interface Railway après le déploiement."
        echo "   Puis ajoutez DATABASE_URL dans les variables d'environnement."
    else
        echo "Vous devrez fournir DATABASE_URL plus tard."
    fi
fi

# 3. Générer NEXTAUTH_SECRET si absent
if [ -z "$NEXTAUTH_SECRET" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "🔑 NEXTAUTH_SECRET généré : $NEXTAUTH_SECRET"
fi

# 4. Définir NEXTAUTH_URL par défaut
if [ -z "$NEXTAUTH_URL" ]; then
    echo "⚠️  NEXTAUTH_URL non définie. Elle sera définie après le déploiement."
fi

# 5. Connexion à Railway
echo "🔐 Connexion à Railway..."
npx @railway/cli login

# 6. Initialiser le projet (ou utiliser existant)
echo "📁 Initialisation du projet..."
npx @railway/cli init

# 7. Créer un environnement .env.railway avec les variables
echo "📝 Configuration des variables d'environnement..."
cat > .env.railway << ENVEOF
DATABASE_URL=${DATABASE_URL:-postgresql://postgres:password@localhost:5432/memolib}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL:-https://memolib.up.railway.app}
ENVEOF

# 8. Déployer
echo "🚀 Déploiement en cours..."
npx @railway/cli up --env-file .env.railway

# 9. Récupérer l'URL de déploiement
echo "🔗 Récupération de l'URL..."
DEPLOY_URL=$(npx @railway/cli domain 2>/dev/null || echo "Voir l'interface Railway")

echo ""
echo "✅ Déploiement terminé !"
echo "🌐 URL de l'application : $DEPLOY_URL"
echo ""
echo "📌 Prochaines étapes :"
echo "   1. Ajoutez une base de données PostgreSQL depuis l'interface Railway"
echo "   2. Mettez à jour DATABASE_URL dans les variables d'environnement"
echo "   3. Redémarrez le service (Redeploy)"
echo "   4. Partagez l'URL avec vos avocats testeurs"
