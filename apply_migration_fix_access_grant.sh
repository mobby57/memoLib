#!/bin/bash

# ============================================
# SCRIPT: Appliquer la migration de correction
# File: apply_migration_fix_access_grant.sh
# Purpose: Créer le dossier de migration et appliquer les changements
# ============================================

set -e  # Exit on error

MIGRATION_NAME="20261117_fix_access_grant_schema"
MIGRATION_DIR="prisma/migrations/${MIGRATION_NAME}"
MIGRATION_FILE="MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql"

echo "🔧 Application de la migration de correction AccessGrant..."
echo ""

# 1. Vérifier que le fichier de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Erreur: Fichier $MIGRATION_FILE introuvable"
    echo "   Ce fichier doit être dans le répertoire racine du projet"
    exit 1
fi

echo "✅ Fichier migration trouvé: $MIGRATION_FILE"
echo ""

# 2. Créer le dossier de migration
echo "📁 Création du dossier: $MIGRATION_DIR"
mkdir -p "$MIGRATION_DIR"
echo "✅ Dossier créé"
echo ""

# 3. Copier le fichier migration.sql
echo "📋 Copie du fichier migration.sql..."
cp "$MIGRATION_FILE" "$MIGRATION_DIR/migration.sql"
echo "✅ Fichier copié"
echo ""

# 4. Vérifier que Prisma est installé
echo "🔍 Vérification de Prisma..."
if ! command -v prisma &> /dev/null; then
    echo "❌ Prisma n'est pas installé globalement"
    echo "   Essayez: npx prisma migrate deploy"
    exit 1
fi
echo "✅ Prisma trouvé"
echo ""

# 5. Appliquer la migration
echo "⚙️  Application de la migration avec Prisma..."
prisma migrate deploy
echo "✅ Migration appliquée"
echo ""

# 6. Générer le client Prisma
echo "📦 Regénération du client Prisma..."
prisma generate
echo "✅ Client généré"
echo ""

# 7. Vérification (optionnel)
echo "🔎 Vérification de la migration..."
echo "   Exécutez: prisma studio"
echo "   Vérifiez que AccessGrant a les colonnes: dossierId, status, updatedAt"
echo ""

echo "🎉 Migration appliquée avec succès!"
echo ""
echo "📚 Prochaines étapes:"
echo "   1. Exécuter: npm run build"
echo "   2. Exécuter: npm test (si disponible)"
echo "   3. Vérifier les types TypeScript"
echo ""
