#!/usr/bin/env pwsh
# Script de démarrage de la démo Next.js

Write-Host "🚀 Démarrage de la démo Next.js MemoLib..." -ForegroundColor Cyan

# Vérifier si Node.js est installé
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js n'est pas installé. Téléchargez-le depuis https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js version: $(node --version)" -ForegroundColor Green

# Vérifier si les dépendances sont installées
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    
    # Installer Next.js et React si manquants
    Write-Host "📦 Installation de Next.js et React..." -ForegroundColor Yellow
    npm install next@latest react@latest react-dom@latest lucide-react
    npm install -D typescript @types/react @types/node
}

# Lancer le serveur de développement
Write-Host ""
Write-Host "🌐 Lancement du serveur Next.js..." -ForegroundColor Cyan
Write-Host "📍 URL: http://localhost:3000" -ForegroundColor Green
Write-Host "📍 Démo: http://localhost:3000/fr/demo/email-simulator" -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor Yellow
Write-Host ""

npm run dev
