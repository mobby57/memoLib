#!/bin/bash
# =============================================================================
# Script de mise à jour des réseaux et images Docker
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🐳 Docker Network & Images Update                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon non démarré${NC}"
    echo "Démarrez Docker puis relancez ce script"
    exit 1
fi

echo -e "${GREEN}✅ Docker daemon disponible${NC}\n"

# =============================================================================
# NETWORKS
# =============================================================================
echo -e "${BLUE}📡 Gestion des réseaux...${NC}"

# Create main network if not exists
NETWORK_NAME="iaposte_network"
if ! docker network inspect $NETWORK_NAME &> /dev/null; then
    echo -e "${YELLOW}Creating network: $NETWORK_NAME${NC}"
    docker network create \
        --driver bridge \
        --subnet 172.28.0.0/16 \
        --gateway 172.28.0.1 \
        --opt com.docker.network.bridge.name=iaposte_br \
        --label project=memolib \
        $NETWORK_NAME
    echo -e "${GREEN}✅ Network created${NC}"
else
    echo -e "${GREEN}✅ Network $NETWORK_NAME exists${NC}"
fi

# Create dev network
NETWORK_DEV="iaposte_dev"
if ! docker network inspect $NETWORK_DEV &> /dev/null; then
    echo -e "${YELLOW}Creating network: $NETWORK_DEV${NC}"
    docker network create \
        --driver bridge \
        --label project=memolib \
        --label environment=development \
        $NETWORK_DEV
    echo -e "${GREEN}✅ Network created${NC}"
else
    echo -e "${GREEN}✅ Network $NETWORK_DEV exists${NC}"
fi

echo ""

# =============================================================================
# PULL LATEST IMAGES
# =============================================================================
echo -e "${BLUE}📥 Pull des images de base...${NC}\n"

IMAGES=(
    "node:20-alpine"
    "python:3.11-slim"
    "postgres:16-alpine"
    "redis:7-alpine"
    "nginx:alpine"
    "ollama/ollama:latest"
    "prom/prometheus:latest"
    "grafana/grafana:latest"
    "mailhog/mailhog:latest"
)

for img in "${IMAGES[@]}"; do
    echo -e "${YELLOW}Pulling: $img${NC}"
    docker pull "$img" --quiet && echo -e "${GREEN}✅ $img${NC}" || echo -e "${RED}❌ $img failed${NC}"
done

echo ""

# =============================================================================
# BUILD PROJECT IMAGES
# =============================================================================
echo -e "${BLUE}🔨 Build des images du projet...${NC}\n"

cd "$(dirname "$0")"

# Frontend
if [[ -f "docker/Dockerfile.frontend" ]]; then
    echo -e "${YELLOW}Building: memolib/frontend${NC}"
    docker build -t memolib/frontend:latest -f docker/Dockerfile.frontend . --quiet && \
        echo -e "${GREEN}✅ Frontend built${NC}" || echo -e "${RED}❌ Frontend build failed${NC}"
fi

# Backend
if [[ -f "docker/Dockerfile.backend" ]]; then
    echo -e "${YELLOW}Building: memolib/backend${NC}"
    docker build -t memolib/backend:latest -f docker/Dockerfile.backend . --quiet && \
        echo -e "${GREEN}✅ Backend built${NC}" || echo -e "${RED}❌ Backend build failed${NC}"
fi

# AI Service
if [[ -f "docker/Dockerfile.ai-service" ]]; then
    echo -e "${YELLOW}Building: memolib/ai-service${NC}"
    docker build -t memolib/ai-service:latest -f docker/Dockerfile.ai-service . --quiet && \
        echo -e "${GREEN}✅ AI Service built${NC}" || echo -e "${RED}❌ AI Service build failed${NC}"
fi

# Nginx
if [[ -f "docker/Dockerfile.nginx" ]]; then
    echo -e "${YELLOW}Building: memolib/nginx${NC}"
    docker build -t memolib/nginx:latest -f docker/Dockerfile.nginx . --quiet && \
        echo -e "${GREEN}✅ Nginx built${NC}" || echo -e "${RED}❌ Nginx build failed${NC}"
fi

echo ""

# =============================================================================
# CLEANUP
# =============================================================================
echo -e "${BLUE}🧹 Nettoyage...${NC}"

# Remove dangling images
docker image prune -f --filter "dangling=true" &> /dev/null && \
    echo -e "${GREEN}✅ Dangling images removed${NC}"

# Remove unused networks
docker network prune -f --filter "label!=project=memolib" &> /dev/null && \
    echo -e "${GREEN}✅ Unused networks removed${NC}"

echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "${BLUE}📊 Résumé:${NC}\n"

echo "Networks:"
docker network ls --filter "label=project=memolib" --format "  - {{.Name}} ({{.Driver}})"

echo ""
echo "Project Images:"
docker images --filter "reference=memolib/*" --format "  - {{.Repository}}:{{.Tag}} ({{.Size}})"

echo ""
echo -e "${GREEN}✅ Mise à jour terminée!${NC}"
