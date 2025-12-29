#!/bin/bash
# Script de déploiement automatisé IA Poste Manager

set -e  # Exit on any error

echo "🚀 Déploiement IA Poste Manager - Production"
echo "=============================================="

# Configuration
APP_NAME="iapostemanager"
DOMAIN="iapostemanager.com"
DB_NAME="iaposte_prod"
BACKUP_DIR="/backups"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifications préalables
check_requirements() {
    log_info "Vérification des prérequis..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Variables d'environnement
    if [ ! -f ".env.production" ]; then
        log_error "Fichier .env.production manquant"
        exit 1
    fi
    
    log_info "✅ Prérequis validés"
}

# Backup de la base de données
backup_database() {
    log_info "Sauvegarde de la base de données..."
    
    if docker ps | grep -q postgres; then
        mkdir -p $BACKUP_DIR
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
        
        docker exec postgres pg_dump -U postgres $DB_NAME > $BACKUP_FILE
        gzip $BACKUP_FILE
        
        log_info "✅ Backup créé: $BACKUP_FILE.gz"
    else
        log_warn "Base de données non trouvée, pas de backup"
    fi
}

# Arrêt des services
stop_services() {
    log_info "Arrêt des services existants..."
    
    docker-compose -f docker-compose.prod.yml down || true
    
    log_info "✅ Services arrêtés"
}

# Construction des images
build_images() {
    log_info "Construction des images Docker..."
    
    # Build de l'application
    docker build -f Dockerfile.prod -t $APP_NAME:latest .
    
    # Tag avec la version
    VERSION=$(date +%Y%m%d_%H%M%S)
    docker tag $APP_NAME:latest $APP_NAME:$VERSION
    
    log_info "✅ Images construites: $APP_NAME:latest, $APP_NAME:$VERSION"
}

# Migration de la base de données
migrate_database() {
    log_info "Migration de la base de données..."
    
    # Démarrer uniquement la DB pour la migration
    docker-compose -f docker-compose.prod.yml up -d db redis
    
    # Attendre que la DB soit prête
    sleep 10
    
    # Exécuter les migrations
    docker run --rm --network iapostemanager_default \
        -e DATABASE_URL="postgresql://postgres:password@db:5432/$DB_NAME" \
        $APP_NAME:latest flask db upgrade
    
    log_info "✅ Migrations appliquées"
}

# Démarrage des services
start_services() {
    log_info "Démarrage des services..."
    
    # Copier la configuration de production
    cp .env.production .env
    
    # Démarrer tous les services
    docker-compose -f docker-compose.prod.yml up -d
    
    log_info "✅ Services démarrés"
}

# Tests de santé
health_check() {
    log_info "Vérification de la santé des services..."
    
    # Attendre le démarrage
    sleep 30
    
    # Test de l'application
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_info "✅ Application accessible"
    else
        log_error "❌ Application non accessible"
        return 1
    fi
    
    # Test de la base de données
    if docker exec postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_info "✅ Base de données accessible"
    else
        log_error "❌ Base de données non accessible"
        return 1
    fi
    
    # Test Redis
    if docker exec redis redis-cli ping | grep -q PONG; then
        log_info "✅ Redis accessible"
    else
        log_error "❌ Redis non accessible"
        return 1
    fi
    
    log_info "✅ Tous les services sont opérationnels"
}

# Configuration SSL (Let's Encrypt)
setup_ssl() {
    log_info "Configuration SSL avec Let's Encrypt..."
    
    if [ ! -z "$DOMAIN" ]; then
        # Installer certbot si nécessaire
        if ! command -v certbot &> /dev/null; then
            log_warn "Certbot non installé, installation..."
            apt-get update && apt-get install -y certbot python3-certbot-nginx
        fi
        
        # Obtenir le certificat
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Renouvellement automatique
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        log_info "✅ SSL configuré pour $DOMAIN"
    else
        log_warn "Domaine non configuré, SSL ignoré"
    fi
}

# Monitoring
setup_monitoring() {
    log_info "Configuration du monitoring..."
    
    # Démarrer Prometheus et Grafana
    docker-compose -f docker-compose.monitoring.yml up -d
    
    # Configurer les alertes
    if [ -f "monitoring/alerts.yml" ]; then
        docker cp monitoring/alerts.yml prometheus:/etc/prometheus/alerts.yml
        docker exec prometheus promtool check rules /etc/prometheus/alerts.yml
    fi
    
    log_info "✅ Monitoring configuré"
    log_info "📊 Grafana: http://localhost:3000 (admin/admin)"
    log_info "📈 Prometheus: http://localhost:9090"
}

# Nettoyage
cleanup() {
    log_info "Nettoyage des ressources inutilisées..."
    
    # Supprimer les images non utilisées
    docker image prune -f
    
    # Supprimer les volumes orphelins
    docker volume prune -f
    
    # Garder seulement les 5 derniers backups
    find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +5 -delete
    
    log_info "✅ Nettoyage terminé"
}

# Rollback en cas d'erreur
rollback() {
    log_error "Erreur détectée, rollback en cours..."
    
    # Arrêter les nouveaux services
    docker-compose -f docker-compose.prod.yml down
    
    # Restaurer la dernière version
    LAST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.sql.gz | head -1)
    if [ ! -z "$LAST_BACKUP" ]; then
        log_info "Restauration du backup: $LAST_BACKUP"
        gunzip -c $LAST_BACKUP | docker exec -i postgres psql -U postgres $DB_NAME
    fi
    
    log_error "❌ Déploiement échoué, système restauré"
    exit 1
}

# Menu principal
main() {
    case "${1:-full}" in
        "check")
            check_requirements
            ;;
        "backup")
            backup_database
            ;;
        "build")
            build_images
            ;;
        "deploy")
            stop_services
            migrate_database
            start_services
            health_check
            ;;
        "ssl")
            setup_ssl
            ;;
        "monitoring")
            setup_monitoring
            ;;
        "full")
            # Déploiement complet
            trap rollback ERR
            
            check_requirements
            backup_database
            stop_services
            build_images
            migrate_database
            start_services
            health_check
            setup_ssl
            setup_monitoring
            cleanup
            
            log_info "🎉 Déploiement terminé avec succès!"
            log_info "🌐 Application: https://$DOMAIN"
            log_info "📊 Monitoring: https://$DOMAIN:3000"
            ;;
        "rollback")
            rollback
            ;;
        *)
            echo "Usage: $0 {check|backup|build|deploy|ssl|monitoring|full|rollback}"
            echo ""
            echo "Commands:"
            echo "  check      - Vérifier les prérequis"
            echo "  backup     - Sauvegarder la base de données"
            echo "  build      - Construire les images Docker"
            echo "  deploy     - Déployer l'application"
            echo "  ssl        - Configurer SSL"
            echo "  monitoring - Configurer le monitoring"
            echo "  full       - Déploiement complet (défaut)"
            echo "  rollback   - Annuler le déploiement"
            exit 1
            ;;
    esac
}

main "$@"