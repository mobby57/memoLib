#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Ajout interactif des variables Vercel pour les 3 environnements

.DESCRIPTION
    Script interactif qui guide l'ajout des variables sur Vercel
    pour development, staging et production

.EXAMPLE
    .\scripts\add-vercel-env-interactive.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AJOUT VARIABLES VERCEL - INTERACTIF" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Charger .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "[ERROR] .env.local introuvable!" -ForegroundColor Red
    exit 1
}

Write-Host "Chargement des variables depuis .env.local..." -ForegroundColor Yellow
$envVars = @{}
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        $envVars[$key] = $value
    }
}
Write-Host "[OK] $($envVars.Count) variables chargees`n" -ForegroundColor Green

# Variables critiques a configurer
$criticalVars = @(
    @{Name="DATABASE_URL"; Description="URL base de donnees PostgreSQL/SQLite"},
    @{Name="NEXTAUTH_SECRET"; Description="Secret NextAuth (32+ caracteres)"},
    @{Name="NEXTAUTH_URL"; Description="URL application (sera adaptee par env)"},
    @{Name="STRIPE_SECRET_KEY"; Description="Cle secrete Stripe"},
    @{Name="STRIPE_PUBLISHABLE_KEY"; Description="Cle publique Stripe"}
)

# Variables optionnelles
$optionalVars = @(
    @{Name="OLLAMA_BASE_URL"; Description="URL serveur Ollama (IA locale)"},
    @{Name="OLLAMA_MODEL"; Description="Modele Ollama (ex: llama3.2:3b)"},
    @{Name="GMAIL_CLIENT_ID"; Description="Client ID Gmail API"},
    @{Name="GMAIL_CLIENT_SECRET"; Description="Client Secret Gmail API"},
    @{Name="GITHUB_APP_ID"; Description="GitHub App ID"},
    @{Name="GITHUB_WEBHOOK_SECRET"; Description="Webhook Secret GitHub"},
    @{Name="PISTE_SANDBOX_CLIENT_ID"; Description="Legifrance PISTE Client ID"},
    @{Name="PISTE_ENVIRONMENT"; Description="Environnement PISTE (sandbox/production)"}
)

# Environnements
$environments = @(
    @{Name="development"; Color="Yellow"; URL="https://iapostemanage-dev.vercel.app"},
    @{Name="staging"; Color="Magenta"; URL="https://iapostemanage-staging.vercel.app"},
    @{Name="production"; Color="Red"; URL="https://iapostemanage.vercel.app"}
)

# ============================================
# SELECTION DE L'ENVIRONNEMENT
# ============================================

Write-Host "Selectionnez l'environnement a configurer:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1) Development  (tests, features)" -ForegroundColor Yellow
Write-Host "  2) Staging      (pre-production)" -ForegroundColor Magenta
Write-Host "  3) Production   (live)" -ForegroundColor Red
Write-Host "  4) TOUS les environnements" -ForegroundColor Green
Write-Host ""

$choice = Read-Host "Votre choix (1-4)"

$selectedEnvs = @()
switch ($choice) {
    "1" { $selectedEnvs = @($environments[0]) }
    "2" { $selectedEnvs = @($environments[1]) }
    "3" { $selectedEnvs = @($environments[2]) }
    "4" { $selectedEnvs = $environments }
    default {
        Write-Host "[ERROR] Choix invalide" -ForegroundColor Red
        exit 1
    }
}

# ============================================
# CONFIGURATION PAR ENVIRONNEMENT
# ============================================

foreach ($env in $selectedEnvs) {
    $envName = $env.Name
    $envURL = $env.URL
    $envColor = $env.Color
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor $envColor
    Write-Host "  ENVIRONNEMENT: $($envName.ToUpper())" -ForegroundColor $envColor
    Write-Host "  URL: $envURL" -ForegroundColor $envColor
    Write-Host "========================================" -ForegroundColor $envColor
    Write-Host ""
    
    # Demander confirmation
    $confirm = Read-Host "Configurer $envName ? (O/n)"
    if ($confirm -eq "n" -or $confirm -eq "N") {
        Write-Host "[SKIP] $envName ignore" -ForegroundColor Gray
        continue
    }
    
    # Variables critiques
    Write-Host ""
    Write-Host "-- VARIABLES CRITIQUES --" -ForegroundColor Red
    Write-Host ""
    
    foreach ($var in $criticalVars) {
        $varName = $var.Name
        $varDesc = $var.Description
        
        # Adapter la valeur selon l'environnement
        $varValue = $envVars[$varName]
        
        if ($varName -eq "NEXTAUTH_URL") {
            $varValue = $envURL
        }
        
        if (-not $varValue) {
            Write-Host "[!] $varName manquant dans .env.local" -ForegroundColor Yellow
            $varValue = Read-Host "Entrez la valeur pour $varName"
        }
        
        Write-Host "Ajout: $varName" -ForegroundColor Cyan
        Write-Host "  Description: $varDesc" -ForegroundColor Gray
        Write-Host "  Valeur: $($varValue.Substring(0, [Math]::Min(30, $varValue.Length)))..." -ForegroundColor Gray
        Write-Host "  Environnement: $envName" -ForegroundColor Gray
        Write-Host ""
        
        # Ajouter sur Vercel (necessite interaction CLI)
        Write-Host "Commande Vercel CLI:" -ForegroundColor DarkGray
        Write-Host "  echo `"$varValue`" | vercel env add $varName $envName" -ForegroundColor DarkGray
        Write-Host ""
        
        $addNow = Read-Host "Ajouter maintenant ? (O/n)"
        if ($addNow -ne "n" -and $addNow -ne "N") {
            # Executer la commande
            $tempValue = $varValue
            Write-Host "  Ajout en cours..." -ForegroundColor Yellow
            
            # Vercel env add necessite stdin pour la valeur
            $tempValue | vercel env add $varName $envName
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] $varName ajoutee" -ForegroundColor Green
            } else {
                Write-Host "  [ERROR] Echec ajout de $varName" -ForegroundColor Red
            }
        } else {
            Write-Host "  [SKIP] A ajouter manuellement" -ForegroundColor Gray
        }
        
        Write-Host ""
    }
    
    # Variables optionnelles
    Write-Host ""
    Write-Host "-- VARIABLES OPTIONNELLES --" -ForegroundColor Yellow
    Write-Host ""
    
    $addOptional = Read-Host "Ajouter les variables optionnelles ? (O/n)"
    
    if ($addOptional -ne "n" -and $addOptional -ne "N") {
        foreach ($var in $optionalVars) {
            $varName = $var.Name
            $varDesc = $var.Description
            
            if ($envVars.ContainsKey($varName)) {
                $varValue = $envVars[$varName]
                
                Write-Host "Ajout: $varName" -ForegroundColor Cyan
                Write-Host "  Description: $varDesc" -ForegroundColor Gray
                Write-Host "  Valeur: $($varValue.Substring(0, [Math]::Min(30, $varValue.Length)))..." -ForegroundColor Gray
                Write-Host ""
                
                $addThis = Read-Host "Ajouter ? (O/n)"
                if ($addThis -ne "n" -and $addThis -ne "N") {
                    $varValue | vercel env add $varName $envName
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  [OK] $varName ajoutee" -ForegroundColor Green
                    } else {
                        Write-Host "  [ERROR] Echec" -ForegroundColor Red
                    }
                }
                Write-Host ""
            }
        }
    }
    
    Write-Host ""
    Write-Host "[OK] Configuration de $envName terminee!" -ForegroundColor Green
}

# ============================================
# RESUME FINAL
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURATION TERMINEE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Verifier les variables ajoutees:" -ForegroundColor Yellow
foreach ($env in $selectedEnvs) {
    Write-Host "  vercel env ls $($env.Name)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Tester les deployments:" -ForegroundColor Yellow
Write-Host "  vercel list" -ForegroundColor Gray
Write-Host ""

Write-Host "URLs des environnements:" -ForegroundColor Yellow
foreach ($env in $selectedEnvs) {
    Write-Host "  $($env.Name): $($env.URL)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[SUCCES] Variables Vercel configurees!" -ForegroundColor Green
Write-Host ""
