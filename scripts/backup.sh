#!/bin/bash
#
# Script de sauvegarde automatique PostgreSQL
# IAPosteManager - Production Backup
#

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/iapostemanager_$TIMESTAMP.sql.gz"

echo "🔄 Démarrage de la sauvegarde..."
echo "📅 Date: $(date)"

# Créer le dossier si nécessaire
mkdir -p "$BACKUP_DIR"

# Sauvegarde PostgreSQL
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h postgres \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip > "$BACKUP_FILE"

echo "✅ Sauvegarde créée: $BACKUP_FILE"

# Garder seulement les 7 dernières sauvegardes
find "$BACKUP_DIR" -name "iapostemanager_*.sql.gz" -type f -mtime +7 -delete

echo "🗑️  Anciennes sauvegardes supprimées (>7 jours)"

# Afficher la taille
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "💾 Taille: $SIZE"

echo "✅ Sauvegarde terminée!"
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
