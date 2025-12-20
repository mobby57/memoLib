#!/usr/bin/env pwsh
# Script de déploiement automatique vers GitHub et Render
# Dernière mise à jour: 21/12/2025

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 DÉPLOIEMENT AUTOMATIQUE - iaPosteManager" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Git
Write-Host "🔍 Vérification de Git..." -ForegroundColor Yellow
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git n'est pas installé!" -ForegroundColor Red
    Write-Host "Téléchargez-le sur: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Git installé" -ForegroundColor Green

# Afficher les dernières modifications
Write-Host ""
Write-Host "📝 Dernières modifications:" -ForegroundColor Yellow
Write-Host "  ✅ Webhooks OpenAI (15+ événements)" -ForegroundColor Green
Write-Host "  ✅ Batch API (économies 50%)" -ForegroundColor Green
Write-Host "  ✅ Vector Stores & File Batches" -ForegroundColor Green
Write-Host "  ✅ Realtime API (WebRTC, Audio, Vidéo)" -ForegroundColor Green
Write-Host ""

# Demander le message de commit
Write-Host "💬 Message de commit:" -ForegroundColor Cyan
Write-Host "1. Production: OpenAI Realtime API + Vector Stores + Batch API" -ForegroundColor White
Write-Host "2. Fix: Corrections critiques" -ForegroundColor White
Write-Host "3. Feature: Nouvelles fonctionnalités" -ForegroundColor White
Write-Host "4. Personnalisé" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Choisissez (1-4)"

switch ($choice) {
    "1" { $commitMsg = "Production: OpenAI Realtime API + Vector Stores + Batch API + Webhooks" }
    "2" { $commitMsg = Read-Host "Décrivez la correction" }
    "3" { $commitMsg = Read-Host "Décrivez la fonctionnalité" }
    "4" { $commitMsg = Read-Host "Message de commit personnalisé" }
    default { $commitMsg = "Update: Dernières modifications v3.6" }
}

Write-Host ""
Write-Host "📦 Préparation du déploiement..." -ForegroundColor Yellow

# Vérifier la branche
$currentBranch = git branch --show-current
Write-Host "🌿 Branche actuelle: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -ne "main") {
    Write-Host "⚠️  Vous n'êtes pas sur la branche main" -ForegroundColor Yellow
    $switch = Read-Host "Basculer vers main? (Y/N)"
    if ($switch -eq "Y" -or $switch -eq "y") {
        git checkout main
        Write-Host "✅ Basculé vers main" -ForegroundColor Green
    } else {
        Write-Host "❌ Déploiement annulé" -ForegroundColor Red
        exit 1
    }
}

# Vérifier les modifications
Write-Host ""
Write-Host "🔍 Vérification des modifications..." -ForegroundColor Yellow
$status = git status --porcelain

if (-not $status) {
    Write-Host "ℹ️  Aucune modification à commiter" -ForegroundColor Yellow
    Write-Host ""
    $pushOnly = Read-Host "Pousser quand même vers GitHub/Render? (Y/N)"
    if ($pushOnly -ne "Y" -and $pushOnly -ne "y") {
        Write-Host "❌ Déploiement annulé" -ForegroundColor Red
        exit 0
    }
} else {
    # Afficher les fichiers modifiés
    Write-Host ""
    Write-Host "📄 Fichiers modifiés:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    
    # Demander confirmation
    $confirm = Read-Host "Continuer avec ces fichiers? (Y/N)"
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "❌ Déploiement annulé" -ForegroundColor Red
        exit 0
    }
    
    # Ajouter tous les fichiers
    Write-Host ""
    Write-Host "➕ Ajout des fichiers..." -ForegroundColor Yellow
    git add .
    
    # Créer le commit
    Write-Host "💾 Création du commit..." -ForegroundColor Yellow
    git commit -m $commitMsg
    Write-Host "✅ Commit créé: $commitMsg" -ForegroundColor Green
}

# Vérifier le remote
Write-Host ""
Write-Host "🔗 Vérification du remote GitHub..." -ForegroundColor Yellow
try {
    $remote = git remote get-url origin
    Write-Host "✅ Remote configuré: $remote" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Aucun remote configuré" -ForegroundColor Yellow
    Write-Host "🔗 Configuration du remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/mooby865/iapostemanager.git
    Write-Host "✅ Remote ajouté" -ForegroundColor Green
}

# Push vers GitHub
Write-Host ""
Write-Host "🚀 Push vers GitHub..." -ForegroundColor Cyan
Write-Host "⚠️  Si demandé, utilisez votre Personal Access Token" -ForegroundColor Yellow
Write-Host ""

try {
    git push -u origin main --force
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✅ PUSH GITHUB RÉUSSI!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    
    # Informations post-push
    Write-Host "📊 Informations de déploiement:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 GitHub Repository:" -ForegroundColor Yellow
    Write-Host "   https://github.com/mooby865/iapostemanager" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Render.com:" -ForegroundColor Yellow
    Write-Host "   Le déploiement va démarrer automatiquement sur Render" -ForegroundColor White
    Write-Host "   Durée estimée: 3-5 minutes" -ForegroundColor White
    Write-Host ""
    Write-Host "📡 URLs de production:" -ForegroundColor Yellow
    Write-Host "   Backend: https://iapostemanager.onrender.com" -ForegroundColor Cyan
    Write-Host "   Frontend: https://iapostemanager.onrender.com" -ForegroundColor Cyan
    Write-Host ""
    
    # Nouveaux endpoints
    Write-Host "🆕 Nouveaux endpoints déployés:" -ForegroundColor Green
    Write-Host "   /api/webhooks/openai - Webhooks OpenAI" -ForegroundColor White
    Write-Host "   /api/batch/* - Batch API (économies 50%)" -ForegroundColor White
    Write-Host "   /api/vector-stores/* - Vector Stores" -ForegroundColor White
    Write-Host "   /api/realtime/* - Realtime API (WebRTC)" -ForegroundColor White
    Write-Host ""
    
    # Interfaces web
    Write-Host "🎨 Interfaces web disponibles:" -ForegroundColor Green
    Write-Host "   /webhooks.html - Dashboard Webhooks" -ForegroundColor White
    Write-Host "   /batch-api.html - Gestion Batch API" -ForegroundColor White
    Write-Host "   /vector-stores.html - Vector Stores Manager" -ForegroundColor White
    Write-Host "   /realtime-api.html - Realtime API Demo" -ForegroundColor White
    Write-Host ""
    
    # Instructions de suivi
    Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "1. ✅ Vérifier le build sur Render.com" -ForegroundColor White
    Write-Host "2. ✅ Tester les nouveaux endpoints" -ForegroundColor White
    Write-Host "3. ✅ Configurer les variables d'environnement si nécessaire:" -ForegroundColor White
    Write-Host "      - OPENAI_API_KEY" -ForegroundColor Cyan
    Write-Host "      - OPENAI_WEBHOOK_SECRET (pour webhooks)" -ForegroundColor Cyan
    Write-Host ""
    
    # Option pour ouvrir Render
    $openRender = Read-Host "Ouvrir Render.com pour suivre le déploiement? (Y/N)"
    if ($openRender -eq "Y" -or $openRender -eq "y") {
        Start-Process "https://dashboard.render.com"
        Write-Host "✅ Dashboard Render ouvert" -ForegroundColor Green
    }
    
    # Option pour ouvrir GitHub
    Write-Host ""
    $openGitHub = Read-Host "Ouvrir GitHub pour voir le commit? (Y/N)"
    if ($openGitHub -eq "Y" -or $openGitHub -eq "y") {
        Start-Process "https://github.com/mooby865/iapostemanager"
        Write-Host "✅ Repository GitHub ouvert" -ForegroundColor Green
    }
    
} catch {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "❌ ERREUR LORS DU PUSH!" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreur: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions possibles:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Vérifier que le repository existe:" -ForegroundColor White
    Write-Host "   https://github.com/mooby865/iapostemanager" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Créer un Personal Access Token:" -ForegroundColor White
    Write-Host "   https://github.com/settings/tokens" -ForegroundColor Cyan
    Write-Host "   Permissions: repo, workflow, write:packages" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Utiliser le token comme mot de passe lors du push" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Configurer Git avec vos credentials:" -ForegroundColor White
    Write-Host "   git config --global user.name 'Votre Nom'" -ForegroundColor Cyan
    Write-Host "   git config --global user.email 'votre@email.com'" -ForegroundColor Cyan
    Write-Host ""
    
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✨ DÉPLOIEMENT TERMINÉ!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Résumé des fonctionnalités déployées
Write-Host "📦 Récapitulatif des fonctionnalités déployées:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Webhooks OpenAI" -ForegroundColor Green
Write-Host "    - 15+ types d'événements supportés" -ForegroundColor White
Write-Host "    - Signature HMAC-SHA256" -ForegroundColor White
Write-Host "    - Dashboard en temps réel" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Batch API" -ForegroundColor Green
Write-Host "    - Économies de 50% sur les coûts" -ForegroundColor White
Write-Host "    - Traitement asynchrone" -ForegroundColor White
Write-Host "    - Upload/Download JSONL" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Vector Stores" -ForegroundColor Green
Write-Host "    - Recherche sémantique" -ForegroundColor White
Write-Host "    - File Batches (500 fichiers)" -ForegroundColor White
Write-Host "    - Chunking auto/static" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Realtime API" -ForegroundColor Green
Write-Host "    - Communication WebRTC" -ForegroundColor White
Write-Host "    - Audio/Vidéo/Texte" -ForegroundColor White
Write-Host "    - 3 voix disponibles" -ForegroundColor White
Write-Host ""

Read-Host "Appuyez sur Entrée pour terminer"
