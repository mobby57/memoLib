#!/bin/bash

# IA Poste Manager - Auto Setup Script
# Compatible Linux/macOS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Banner
echo -e "${GREEN}"
cat << "EOF"
 ██╗ █████╗     ██████╗  ██████╗ ███████╗████████╗███████╗
 ██║██╔══██╗    ██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝██╔════╝
 ██║███████║    ██████╔╝██║   ██║███████╗   ██║   █████╗  
 ██║██╔══██║    ██╔═══╝ ██║   ██║╚════██║   ██║   ██╔══╝  
 ██║██║  ██║    ██║     ╚██████╔╝███████║   ██║   ███████╗
 ╚═╝╚═╝  ╚═╝    ╚═╝      ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝

                    MANAGER - Auto Setup
EOF
echo -e "${NC}"

# Check requirements
log "Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    error "Node.js non trouvé. Installez depuis https://nodejs.org"
fi

if ! command -v npm &> /dev/null; then
    error "npm non trouvé. Réinstallez Node.js"
fi

success "Node.js $(node --version) détecté"
success "npm $(npm --version) détecté"

# Make scripts executable
chmod +x auto-setup.js 2>/dev/null || true

# Run auto-setup
log "🚀 Démarrage de l'auto-configuration..."
echo

if node auto-setup.js; then
    echo
    success "Configuration terminée avec succès!"
    echo
    echo -e "${BLUE}📖 Consultez SECURITY_AUDIT_REPORT.md pour les détails de sécurité${NC}"
    echo
else
    error "Erreur lors de la configuration"
fi