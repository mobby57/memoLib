#!/bin/bash

echo "🚀 Déploiement MemoLib sur Fly.io"

# Vérifier si flyctl est installé
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl n'est pas installé. Installez-le depuis https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Login si nécessaire
echo "🔐 Vérification de l'authentification..."
flyctl auth whoami || flyctl auth login

# Créer l'app si elle n'existe pas
echo "📦 Configuration de l'application..."
flyctl apps list | grep -q "memolib" || flyctl apps create memolib

# Configurer la base de données PostgreSQL
echo "🗄️ Configuration de la base de données..."
flyctl postgres create --name memolib-db --region cdg --vm-size shared-cpu-1x --volume-size 3

# Attacher la DB à l'app
flyctl postgres attach memolib-db --app memolib

# Configurer les secrets
echo "🔑 Configuration des variables d'environnement..."
flyctl secrets set \
  NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  NEXTAUTH_URL="https://memolib.fly.dev"

# Déployer
echo "🚢 Déploiement en cours..."
flyctl deploy

echo "✅ Déploiement terminé!"
echo "🌐 Application disponible sur: https://memolib.fly.dev"