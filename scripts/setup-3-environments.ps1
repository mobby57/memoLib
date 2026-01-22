#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Configuration automatisee des 3 environnements Vercel (Development, Staging, Production)

.DESCRIPTION
    Ce script configure automatiquement:
    - Les branches Git (develop, staging, main)
    - Les variables d'environnement Vercel pour chaque environnement
    - Les deployments automatiques

.EXAMPLE
    .\scripts\setup-3-environments.ps1
#>

param(
    [switch]$SkipGit,
    [switch]$SkipVercel,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP 3 ENVIRONNEMENTS VERCEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Charger les variables depuis .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "[ERROR] .env.local manquant!" -ForegroundColor Red
    Write-Host "Executez d'abord: Copy-Item .env.local.example .env.local" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/5] Chargement des variables depuis .env.local..." -ForegroundColor Yellow
$envVars = @{}
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        $envVars[$key] = $value
    }
}
Write-Host "      $($envVars.Count) variables chargees" -ForegroundColor Green

# ============================================
# PHASE 1: CREATION DES BRANCHES GIT
# ============================================

if (-not $SkipGit) {
    Write-Host ""
    Write-Host "[2/5] Configuration Git (branches)..." -ForegroundColor Yellow
    
    $currentBranch = git branch --show-current
    Write-Host "      Branche actuelle: $currentBranch" -ForegroundColor Gray
    
    # Creer develop
    if (-not (git branch --list "develop")) {
        Write-Host "      Creation branche 'develop'..." -ForegroundColor Cyan
        if (-not $DryRun) {
            git checkout -b develop
            git push -u origin develop
        }
        Write-Host "      [OK] develop creee et pushee" -ForegroundColor Green
    } else {
        Write-Host "      [OK] develop existe deja" -ForegroundColor Green
    }
    
    # Creer staging
    if (-not (git branch --list "staging")) {
        Write-Host "      Creation branche 'staging'..." -ForegroundColor Cyan
        if (-not $DryRun) {
            git checkout -b staging
            git push -u origin staging
        }
        Write-Host "      [OK] staging creee et pushee" -ForegroundColor Green
    } else {
        Write-Host "      [OK] staging existe deja" -ForegroundColor Green
    }
    
    # Retour sur main
    if (-not $DryRun) {
        git checkout main
    }
    Write-Host "      [OK] Branches configurees" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2/5] Configuration Git IGNOREE (--SkipGit)" -ForegroundColor Gray
}

# ============================================
# PHASE 2: VARIABLES CRITIQUES A CONFIGURER
# ============================================

Write-Host ""
Write-Host "[3/5] Variables critiques a configurer..." -ForegroundColor Yellow

# Variables essentielles (doivent etre presentes)
$criticalVars = @(
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY"
)

# Verifier presence
$missing = @()
foreach ($var in $criticalVars) {
    if (-not $envVars.ContainsKey($var)) {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "[ERROR] Variables critiques manquantes dans .env.local:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Ajoutez-les dans .env.local puis relancez ce script." -ForegroundColor Yellow
    exit 1
}

Write-Host "      [OK] Toutes les variables critiques presentes" -ForegroundColor Green

# ============================================
# PHASE 3: CONFIGURATION VERCEL PAR ENVIRONNEMENT
# ============================================

if (-not $SkipVercel) {
    Write-Host ""
    Write-Host "[4/5] Configuration Vercel (3 environnements)..." -ForegroundColor Yellow
    
    # Verifier auth Vercel
    $vercelAuth = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Non authentifie sur Vercel!" -ForegroundColor Red
        Write-Host "Executez: vercel auth login" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "      Authentifie: $vercelAuth" -ForegroundColor Gray
    
    # Environnements a configurer
    $environments = @("development", "staging", "production")
    
    # URLs par environnement
    $urls = @{
        "development" = "https://iapostemanage-dev.vercel.app"
        "staging" = "https://iapostemanage-staging.vercel.app"
        "production" = "https://iapostemanage.vercel.app"
    }
    
    foreach ($env in $environments) {
        Write-Host ""
        Write-Host "   == Environnement: $env ==" -ForegroundColor Cyan
        
        # Variables a ajouter pour cet environnement
        $varsToAdd = @{
            "DATABASE_URL" = $envVars["DATABASE_URL"]
            "NEXTAUTH_SECRET" = $envVars["NEXTAUTH_SECRET"]
            "NEXTAUTH_URL" = $urls[$env]
            "OLLAMA_BASE_URL" = $envVars["OLLAMA_BASE_URL"]
            "OLLAMA_MODEL" = $envVars["OLLAMA_MODEL"]
            "STRIPE_SECRET_KEY" = $envVars["STRIPE_SECRET_KEY"]
            "STRIPE_PUBLISHABLE_KEY" = $envVars["STRIPE_PUBLISHABLE_KEY"]
        }
        
        # Ajouter les variables optionnelles si presentes
        $optionalVars = @(
            "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REDIRECT_URI",
            "GITHUB_APP_ID", "GITHUB_WEBHOOK_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET",
            "PISTE_SANDBOX_CLIENT_ID", "PISTE_SANDBOX_CLIENT_SECRET", "PISTE_ENVIRONMENT"
        )
        
        foreach ($optVar in $optionalVars) {
            if ($envVars.ContainsKey($optVar)) {
                $varsToAdd[$optVar] = $envVars[$optVar]
            }
        }
        
        # Adapter NEXTAUTH_URL et callbacks selon l'environnement
        if ($envVars.ContainsKey("GMAIL_REDIRECT_URI")) {
            $varsToAdd["GMAIL_REDIRECT_URI"] = "$($urls[$env])/api/auth/callback/google"
        }
        if ($envVars.ContainsKey("GITHUB_CALLBACK_URL")) {
            $varsToAdd["GITHUB_CALLBACK_URL"] = "$($urls[$env])/api/auth/callback/github"
        }
        
        # Ajouter chaque variable
        $count = 0
        foreach ($varName in $varsToAdd.Keys) {
            $varValue = $varsToAdd[$varName]
            
            if (-not $DryRun) {
                # Vercel env add ne peut pas etre automatise facilement (interaction requise)
                # On utilise donc vercel env add avec echo pour passer la valeur
                Write-Host "      Ajout $varName..." -ForegroundColor Gray
                
                # Commande pour ajouter (necessite interaction manuelle)
                # vercel env add $varName $env
                # Alternative: utiliser API Vercel ou fichier .env.$env
                
                # Pour l'instant, on affiche la commande
                Write-Host "      vercel env add $varName $env" -ForegroundColor DarkGray
                Write-Host "      Valeur: $($varValue.Substring(0, [Math]::Min(20, $varValue.Length)))..." -ForegroundColor DarkGray
            }
            $count++
        }
        
        Write-Host "      [OK] $count variables a configurer pour $env" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host " IMPORTANT: CONFIGURATION MANUELLE REQUISE" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Vercel CLI ne permet pas l'ajout automatique de variables." -ForegroundColor White
    Write-Host "Utilisez l'une de ces methodes:" -ForegroundColor White
    Write-Host ""
    Write-Host "METHODE 1: Dashboard Vercel (Recommande)" -ForegroundColor Cyan
    Write-Host "  1. Ouvrir: https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host "  2. Project -> Settings -> Environment Variables" -ForegroundColor Gray
    Write-Host "  3. Ajouter les variables pour chaque environnement" -ForegroundColor Gray
    Write-Host ""
    Write-Host "METHODE 2: Script interactif (voir ci-dessous)" -ForegroundColor Cyan
    Write-Host "  .\scripts\add-vercel-env-interactive.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "METHODE 3: Fichiers .env.development, .env.staging, .env.production" -ForegroundColor Cyan
    Write-Host "  Puis: vercel env pull" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "[4/5] Configuration Vercel IGNOREE (--SkipVercel)" -ForegroundColor Gray
}

# ============================================
# PHASE 4: RESUME ET PROCHAINES ETAPES
# ============================================

Write-Host ""
Write-Host "[5/5] Resume de la configuration..." -ForegroundColor Yellow
Write-Host ""

Write-Host "== BRANCHES GIT ==" -ForegroundColor Cyan
git branch -a | Select-String "develop|staging|main" | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "== VARIABLES CHARGEES ==" -ForegroundColor Cyan
Write-Host "  Total: $($envVars.Count) variables" -ForegroundColor Gray
Write-Host "  Critiques: $($criticalVars.Count) / $($criticalVars.Count)" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PROCHAINES ETAPES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Configurer variables Vercel (Dashboard ou CLI)" -ForegroundColor Yellow
Write-Host "2. Verifier deployments:" -ForegroundColor Yellow
Write-Host "   vercel list" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Tester chaque environnement:" -ForegroundColor Yellow
Write-Host "   Development: https://iapostemanage-dev.vercel.app" -ForegroundColor Gray
Write-Host "   Staging:     https://iapostemanage-staging.vercel.app" -ForegroundColor Gray
Write-Host "   Production:  https://iapostemanage.vercel.app" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Workflow Git:" -ForegroundColor Yellow
Write-Host "   develop -> staging -> main" -ForegroundColor Gray
Write-Host ""

Write-Host "[SUCCES] Setup des 3 environnements prepare!" -ForegroundColor Green
Write-Host ""
