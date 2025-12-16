#!/bin/bash
# Script de restauration - iaPosteManager
# Usage: ./restore.sh <backup-file.tar.gz>

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Usage: ./restore.sh <backup-file.tar.gz>"
    echo ""
    echo "Backups disponibles:"
    ls -lh /backups/iapostemanager/*.tar.gz 2>/dev/null || echo "Aucun backup trouvé"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier introuvable: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATTENTION: Cette opération va écraser les données actuelles!"
read -p "Continuer? (yes/no): " -r
if [ "$REPLY" != "yes" ]; then
    echo "Restauration annulée"
    exit 0
fi

echo "🔄 Début de la restauration: $(date)"

# 1. Vérifier checksum
if [ -f "${BACKUP_FILE}.sha256" ]; then
    echo "🔐 Vérification checksum..."
    sha256sum -c ${BACKUP_FILE}.sha256 || {
        echo "❌ Checksum invalide!"
        exit 1
    }
fi

# 2. Extraction
echo "📦 Extraction backup..."
TEMP_DIR=$(mktemp -d)
tar -xzf ${BACKUP_FILE} -C ${TEMP_DIR}
BACKUP_NAME=$(basename ${BACKUP_FILE} .tar.gz)

# 3. Arrêt application
echo "⏸️  Arrêt application..."
docker-compose -f docker-compose.prod.yml down

# 4. Backup données actuelles (sécurité)
echo "💾 Sauvegarde données actuelles..."
SAFETY_BACKUP="safety_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p /backups/safety/${SAFETY_BACKUP}
cp -r data /backups/safety/${SAFETY_BACKUP}/ 2>/dev/null || true

# 5. Restauration base de données
echo "🗄️  Restauration base de données..."
cat ${TEMP_DIR}/${BACKUP_NAME}/database.sql | sqlite3 data/production.db

# 6. Restauration fichiers data
echo "📁 Restauration fichiers..."
rm -rf data/*
cp -r ${TEMP_DIR}/${BACKUP_NAME}/data/* data/

# 7. Restauration configuration
echo "⚙️  Restauration configuration..."
cp ${TEMP_DIR}/${BACKUP_NAME}/.env.production ./ 2>/dev/null || true

# 8. Permissions
echo "🔒 Ajustement permissions..."
chmod -R 755 data/

# 9. Redémarrage
echo "🚀 Redémarrage application..."
docker-compose -f docker-compose.prod.yml up -d

# 10. Vérification
echo "✅ Attente démarrage..."
sleep 10

if curl -f http://localhost:5000/api/health &>/dev/null; then
    echo "✅ Restauration réussie!"
else
    echo "⚠️  Application redémarrée mais health check échoué"
fi

# Nettoyage
rm -rf ${TEMP_DIR}

echo ""
echo "✅ Restauration terminée: $(date)"
echo "💾 Backup sécurité dans: /backups/safety/${SAFETY_BACKUP}"
echo ""
