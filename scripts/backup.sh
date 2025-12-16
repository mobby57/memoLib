#!/bin/bash
# Script de backup automatique - iaPosteManager
# À exécuter quotidiennement via cron: 0 2 * * * /path/to/backup.sh

set -e

# Configuration
BACKUP_DIR="/backups/iapostemanager"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="iaposte_backup_${TIMESTAMP}"

echo "🔄 Début du backup: $(date)"

# 1. Créer dossier backup
mkdir -p ${BACKUP_DIR}/${BACKUP_NAME}

# 2. Backup base de données
echo "📦 Backup base de données..."
docker exec iapostemanager-prod sh -c \
  "sqlite3 /app/data/production.db .dump" > \
  ${BACKUP_DIR}/${BACKUP_NAME}/database.sql

# 3. Backup fichiers data
echo "📁 Backup fichiers data..."
docker cp iapostemanager-prod:/app/data \
  ${BACKUP_DIR}/${BACKUP_NAME}/data

# 4. Backup configuration
echo "⚙️  Backup configuration..."
cp .env.production ${BACKUP_DIR}/${BACKUP_NAME}/
cp docker-compose.prod.yml ${BACKUP_DIR}/${BACKUP_NAME}/

# 5. Backup logs (derniers 1000 lignes)
echo "📋 Backup logs..."
docker logs iapostemanager-prod --tail 1000 > \
  ${BACKUP_DIR}/${BACKUP_NAME}/logs.txt

# 6. Créer archive compressée
echo "🗜️  Compression..."
cd ${BACKUP_DIR}
tar -czf ${BACKUP_NAME}.tar.gz ${BACKUP_NAME}/
rm -rf ${BACKUP_NAME}

# 7. Calcul checksum
echo "🔐 Checksum..."
sha256sum ${BACKUP_NAME}.tar.gz > ${BACKUP_NAME}.tar.gz.sha256

# 8. Upload vers cloud (optionnel)
if [ ! -z "$AWS_S3_BUCKET" ]; then
    echo "☁️  Upload vers S3..."
    aws s3 cp ${BACKUP_NAME}.tar.gz s3://${AWS_S3_BUCKET}/backups/
    aws s3 cp ${BACKUP_NAME}.tar.gz.sha256 s3://${AWS_S3_BUCKET}/backups/
fi

# 9. Nettoyage anciens backups
echo "🧹 Nettoyage anciens backups (>${RETENTION_DAYS} jours)..."
find ${BACKUP_DIR} -name "iaposte_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR} -name "iaposte_backup_*.sha256" -mtime +${RETENTION_DAYS} -delete

# 10. Statistiques
BACKUP_SIZE=$(du -sh ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz | cut -f1)
echo ""
echo "✅ Backup terminé: $(date)"
echo "📦 Fichier: ${BACKUP_NAME}.tar.gz"
echo "💾 Taille: ${BACKUP_SIZE}"
echo "📍 Emplacement: ${BACKUP_DIR}"
echo ""

# Notification (optionnel)
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST ${SLACK_WEBHOOK} \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"✅ Backup réussi: ${BACKUP_SIZE}\"}"
fi
