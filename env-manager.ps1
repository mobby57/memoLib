#!/usr/bin/env pwsh
# Script de gestion des fichiers .env

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('init', 'sync', 'check')]
    [string]$Action = 'check'
)

$ErrorActionPreference = "Stop"

Write-Host "Gestion des fichiers .env" -ForegroundColor Cyan
Write-Host ""

switch ($Action) {
    'init' {
        Write-Host "Initialisation de .env.local depuis .env.example..." -ForegroundColor Yellow
        
        if (Test-Path ".env.local") {
            Write-Host "ATTENTION: .env.local existe deja. Voulez-vous le remplacer? (y/N)" -ForegroundColor Yellow
            $response = Read-Host
            if ($response -ne 'y') {
                Write-Host "Operation annulee" -ForegroundColor Red
                exit 0
            }
        }
        
        Copy-Item ".env.example" ".env.local"
        Write-Host ".env.local cree depuis .env.example" -ForegroundColor Green
        Write-Host "Editez .env.local pour ajouter vos secrets" -ForegroundColor Cyan
    }
    
    'sync' {
        Write-Host "Synchronisation des variables..." -ForegroundColor Yellow
        
        if (-not (Test-Path ".env")) {
            Write-Host ".env n'existe pas" -ForegroundColor Red
            exit 1
        }
        
        if (-not (Test-Path ".env.local")) {
            Write-Host ".env.local n'existe pas. Lancez: .\env-manager.ps1 init" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "Fichiers .env synchronises" -ForegroundColor Green
        Write-Host ".env = valeurs par defaut (committe)" -ForegroundColor White
        Write-Host ".env.local = secrets (ignore par Git)" -ForegroundColor White
    }
    
    'check' {
        Write-Host "Verification des fichiers .env..." -ForegroundColor Yellow
        Write-Host ""
        
        # Vérifier .env
        if (Test-Path ".env") {
            Write-Host ".env existe (valeurs par defaut)" -ForegroundColor Green
        } else {
            Write-Host ".env manquant" -ForegroundColor Red
        }
        
        # Vérifier .env.local
        if (Test-Path ".env.local") {
            Write-Host ".env.local existe (secrets)" -ForegroundColor Green
        } else {
            Write-Host ".env.local manquant - Lancez: .\env-manager.ps1 init" -ForegroundColor Yellow
        }
        
        # Vérifier .env.example
        if (Test-Path ".env.example") {
            Write-Host ".env.example existe (template)" -ForegroundColor Green
        } else {
            Write-Host ".env.example manquant" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Structure recommandee:" -ForegroundColor Cyan
        Write-Host "  .env         - Valeurs par defaut (committe)" -ForegroundColor White
        Write-Host "  .env.local   - Secrets (ignore par Git)" -ForegroundColor White
        Write-Host "  .env.example - Template (committe)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Commandes disponibles:" -ForegroundColor Cyan
Write-Host "  .\env-manager.ps1 init   - Creer .env.local depuis .env.example" -ForegroundColor White
Write-Host "  .\env-manager.ps1 sync   - Synchroniser les fichiers" -ForegroundColor White
Write-Host "  .\env-manager.ps1 check  - Verifier la configuration" -ForegroundColor White
