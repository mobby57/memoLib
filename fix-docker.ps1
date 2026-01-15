#!/usr/bin/env pwsh
# Script de résolution des problèmes Docker

Write-Host "Diagnostic Docker..." -ForegroundColor Cyan

# 1. Vérifier Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker n'est pas installe" -ForegroundColor Red
    exit 1
}

Write-Host "Docker installe" -ForegroundColor Green

# 2. Nettoyer les images/conteneurs
Write-Host "`nNettoyage Docker..." -ForegroundColor Yellow
docker system prune -af --volumes

# 3. Arrêter tous les conteneurs
Write-Host "`nArret des conteneurs..." -ForegroundColor Yellow
docker-compose down -v

# 4. Reconstruire
Write-Host "`nReconstruction..." -ForegroundColor Yellow
docker-compose build --no-cache

# 5. Démarrer
Write-Host "`nDemarrage..." -ForegroundColor Yellow
docker-compose up -d postgres

Write-Host "`nDocker pret!" -ForegroundColor Green
