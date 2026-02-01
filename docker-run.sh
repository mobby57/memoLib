#!/bin/bash
# =============================================================================
# Script de démarrage de tous les containers
# =============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🐳 IA Poste Manager - Docker Runner                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker non installé${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon non démarré${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker disponible${NC}"

# Parse arguments
PROFILE="full"
ACTION="up"

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            PROFILE="dev"
            shift
            ;;
        --prod)
            PROFILE="prod"
            shift
            ;;
        --minimal)
            PROFILE="minimal"
            shift
            ;;
        down|stop)
            ACTION="down"
            shift
            ;;
        logs)
            ACTION="logs"
            shift
            ;;
        build)
            ACTION="build"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Compose file selection
case $PROFILE in
    dev)
        COMPOSE_FILE="docker-compose.dev.yml"
        ;;
    prod)
        COMPOSE_FILE="docker-compose.prod.yml"
        ;;
    minimal)
        COMPOSE_FILE="docker-compose.simple.yml"
        ;;
    *)
        COMPOSE_FILE="docker-compose.full.yml"
        ;;
esac

echo -e "${BLUE}📦 Profile: ${PROFILE}${NC}"
echo -e "${BLUE}📄 Fichier: ${COMPOSE_FILE}${NC}"

# Check if compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo -e "${RED}❌ Fichier ${COMPOSE_FILE} non trouvé${NC}"
    exit 1
fi

# Execute action
case $ACTION in
    up)
        echo -e "\n${YELLOW}🚀 Démarrage des containers...${NC}\n"
        docker compose -f "$COMPOSE_FILE" up -d --build
        echo -e "\n${GREEN}✅ Containers démarrés!${NC}"
        echo ""
        echo "Services disponibles:"
        echo "  📱 Frontend:    http://localhost:80"
        echo "  🔧 Backend:     http://localhost:5000"
        echo "  🤖 AI Service:  http://localhost:8000"
        echo "  🐘 PostgreSQL:  localhost:5432"
        echo "  🔴 Redis:       localhost:6379"
        echo "  📊 Prometheus:  http://localhost:9090"
        echo "  📈 Grafana:     http://localhost:3001"
        ;;
    down)
        echo -e "\n${YELLOW}🛑 Arrêt des containers...${NC}\n"
        docker compose -f "$COMPOSE_FILE" down
        echo -e "\n${GREEN}✅ Containers arrêtés${NC}"
        ;;
    logs)
        docker compose -f "$COMPOSE_FILE" logs -f
        ;;
    build)
        echo -e "\n${YELLOW}🔨 Build des images...${NC}\n"
        docker compose -f "$COMPOSE_FILE" build --no-cache
        echo -e "\n${GREEN}✅ Build terminé${NC}"
        ;;
esac
