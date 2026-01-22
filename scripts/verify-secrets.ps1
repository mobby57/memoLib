#!/usr/bin/env powershell
# Vérification Complète de la Configuration des Secrets
# À lancer avant chaque déploiement

param(
    [switch]$Verbose,
    [switch]$Fix
)

$ErrorActionPreference = "Continue"

# ============================================
# 🎨 STYLES ET COULEURS
# ============================================

function Print-Header {
    param([string]$text)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($text.PadRight(38)) ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Print-Section {
    param([string]$text)
    Write-Host "`n$($text -replace '^', '  → ')" -ForegroundColor Blue -BackgroundColor Black
}

function Print-Success {
    param([string]$text)
    Write-Host "  ✅ $text" -ForegroundColor Green
}

function Print-Warning {
    param([string]$text)
    Write-Host "  ⚠️  $text" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$text)
    Write-Host "  ❌ $text" -ForegroundColor Red
}

function Print-Info {
    param([string]$text)
    Write-Host "  ℹ️  $text" -ForegroundColor Cyan
}

# ============================================
# 🔍 VÉRIFICATIONS
# ============================================

function Check-FileExists {
    param([string]$path, [string]$name)
    
    if (Test-Path $path) {
        Print-Success "$name existe"
        return $true
    } else {
        Print-Error "$name manquant"
        return $false
    }
}

function Check-GitignoreSecrets {
    if (Test-Path ".gitignore") {
        $content = Get-Content ".gitignore" -Raw
        $patterns = @(".env.local", ".env.keys", ".env.*.local", "credentials.json", "*.pem")
        
        $missing = @()
        foreach ($pattern in $patterns) {
            if ($content -notmatch [regex]::Escape($pattern)) {
                $missing += $pattern
            }
        }
        
        if ($missing.Count -eq 0) {
            Print-Success ".gitignore contient tous les patterns secrets"
            return $true
        } else {
            Print-Error ".gitignore manque: $($missing -join ', ')"
            return $false
        }
    } else {
        Print-Error ".gitignore n'existe pas"
        return $false
    }
}

function Check-NoSecretsInGit {
    $gitCheck = git status --porcelain | Select-String -Pattern "\.env\.|\.pem|credentials.json|\.keys"
    
    if ($gitCheck) {
        Print-Error "Fichiers secrets détectés dans Git!"
        Write-Host "  Fichiers: $($gitCheck -join ', ')" -ForegroundColor Red
        return $false
    } else {
        Print-Success "Aucun fichier secret dans Git"
        return $true
    }
}

function Check-EnvLocal {
    if (-not (Test-Path ".env.local")) {
        Print-Error ".env.local manquant"
        return $false
    }
    
    $content = Get-Content ".env.local"
    $required = @(
        "DATABASE_URL",
        "NEXTAUTH_SECRET",
        "NEXTAUTH_URL",
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY"
    )
    
    $missing = @()
    foreach ($var in $required) {
        if ($content -notmatch "^$var=") {
            $missing += $var
        }
    }
    
    if ($missing.Count -eq 0) {
        Print-Success ".env.local contient toutes les variables essentielles"
        return $true
    } else {
        Print-Warning ".env.local manque certaines variables: $($missing -join ', ')"
        return $false
    }
}

function Check-EnvVault {
    if (Test-Path ".env.vault") {
        Print-Success ".env.vault existe (chiffré)"
        
        # Vérifier que .env.keys existe aussi
        if (Test-Path ".env.keys") {
            Print-Success ".env.keys existe (à sauvegarder!)"
            return $true
        } else {
            Print-Warning ".env.keys manquant (impossible de déchiffrer le vault)"
            return $false
        }
    } else {
        Print-Warning ".env.vault n'existe pas (secrets non chiffrés)"
        return $false
    }
}

function Check-DotenvVault {
    try {
        $version = npm list -g dotenv-vault 2>$null | Select-String "dotenv-vault"
        if ($version) {
            Print-Success "dotenv-vault installé"
            return $true
        } else {
            Print-Warning "dotenv-vault non détecté"
            if ($Fix) {
                Print-Info "Installation de dotenv-vault..."
                npm install -g dotenv-vault
                return $true
            }
            return $false
        }
    } catch {
        Print-Warning "Impossible de vérifier dotenv-vault"
        return $false
    }
}

function Check-VerelCli {
    try {
        $version = vercel --version 2>$null
        if ($version) {
            Print-Success "Vercel CLI installé"
            
            # Vérifier l'authentification
            $auth = vercel auth whoami 2>$null
            if ($auth) {
                Print-Success "Vercel authentifié: $auth"
                return $true
            } else {
                Print-Warning "Vercel non authentifié (exécuter: vercel auth login)"
                return $false
            }
        } else {
            Print-Warning "Vercel CLI non détecté"
            return $false
        }
    } catch {
        Print-Warning "Impossible de vérifier Vercel"
        return $false
    }
}

function Check-GitHub {
    try {
        $user = gh auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Print-Success "GitHub CLI authentifié"
            return $true
        } else {
            Print-Warning "GitHub CLI non authentifié (exécuter: gh auth login)"
            return $false
        }
    } catch {
        Print-Warning "GitHub CLI non disponible"
        return $false
    }
}

function Check-Ollama {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Print-Success "Ollama est accessible"
            return $true
        } else {
            Print-Warning "Ollama n'est pas accessible"
            return $false
        }
    } catch {
        Print-Warning "Ollama n'est pas en cours d'exécution"
        return $false
    }
}

function Check-Database {
    # Vérifier la chaîne de connexion
    if (Test-Path ".env.local") {
        $dbUrl = (Get-Content ".env.local" | Select-String "^DATABASE_URL=").Line
        if ($dbUrl) {
            Print-Success "DATABASE_URL configurée"
            
            # Essayer de le tester (optionnel)
            if ($dbUrl -like "*localhost*") {
                Print-Info "Base de données locale détectée"
            } elseif ($dbUrl -like "*neon.tech*") {
                Print-Info "Neon PostgreSQL détecté"
            }
            return $true
        } else {
            Print-Error "DATABASE_URL non trouvée"
            return $false
        }
    }
    return $false
}

# ============================================
# 📊 VÉRIFICATION GLOBALE
# ============================================

function Check-All {
    Print-Header "VÉRIFICATION COMPLÈTE DES SECRETS"
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    
    $results = @()
    
    # Fichiers essentiels
    Print-Section "📁 Fichiers Essentiels"
    $results += , (Check-FileExists ".env.local" ".env.local")
    $results += , (Check-FileExists ".gitignore" ".gitignore")
    $results += , (Check-FileExists "package.json" "package.json")
    
    # Sécurité Git
    Print-Section "🔐 Sécurité Git"
    $results += , (Check-GitignoreSecrets)
    $results += , (Check-NoSecretsInGit)
    
    # Configuration .env
    Print-Section "⚙️  Configuration .env"
    $results += , (Check-EnvLocal)
    $results += , (Check-EnvVault)
    
    # Outils CLI
    Print-Section "🛠️  Outils CLI"
    $results += , (Check-DotenvVault)
    $results += , (Check-VerelCli)
    $results += , (Check-GitHub)
    
    # Services
    Print-Section "🚀 Services"
    $results += , (Check-Database)
    $results += , (Check-Ollama)
    
    # Résumé
    Print-Section "📊 Résumé"
    $passed = ($results | Where-Object { $_ -eq $true }).Count
    $failed = ($results | Where-Object { $_ -eq $false }).Count
    $total = $results.Count
    
    Write-Host ""
    Write-Host "  Vérifications réussies: $passed / $total" -ForegroundColor Green
    if ($failed -gt 0) {
        Write-Host "  Vérifications échouées: $failed / $total" -ForegroundColor Red
    }
    
    $percentage = [int]($passed / $total * 100)
    Write-Host "  Taux de réussite: $percentage%" -ForegroundColor $(if ($percentage -ge 80) { "Green" } else { "Yellow" })
    
    Write-Host ""
    if ($percentage -eq 100) {
        Write-Host "  🎉 Tout est configuré! Vous pouvez déployer." -ForegroundColor Green
    } elseif ($percentage -ge 80) {
        Write-Host "  ⚠️  Configuration presque complète. Quelques éléments à corriger." -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ Configuration incomplète. Veuillez suivre le GUIDE_RAPIDE_SECRETS.md" -ForegroundColor Red
    }
    
    Write-Host ""
}

# ============================================
# 🔧 ACTIONS DE CORRECTION
# ============================================

function Fix-Gitignore {
    Print-Header "Correction .gitignore"
    
    $patterns = @(
        ".env.local",
        ".env.keys",
        ".env.*.local",
        ".env.production",
        ".env.development",
        "credentials.json",
        "github-app-key.pem",
        "*.pem"
    )
    
    if (Test-Path ".gitignore") {
        $content = Get-Content ".gitignore" -Raw
        foreach ($pattern in $patterns) {
            if ($content -notmatch [regex]::Escape($pattern)) {
                Add-Content ".gitignore" "`n# Secrets`n$pattern"
                Print-Info "Ajout de: $pattern"
            }
        }
    } else {
        $patterns | ForEach-Object { Add-Content ".gitignore" $_ }
        Print-Success ".gitignore créé avec les patterns secrets"
    }
}

function Generate-NextAuthSecret {
    Print-Header "Génération NEXTAUTH_SECRET"
    
    try {
        # Générer un secret aléatoire de 32 bytes
        $bytes = [byte[]]::new(32)
        $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
        $rng.GetBytes($bytes)
        $secret = [Convert]::ToBase64String($bytes)
        
        Print-Success "Secret généré (copier dans .env.local):"
        Write-Host ""
        Write-Host "  NEXTAUTH_SECRET=$secret" -ForegroundColor Yellow
        Write-Host ""
    } catch {
        Print-Error "Impossible de générer le secret"
    }
}

# ============================================
# 🎯 MENU PRINCIPAL
# ============================================

if ($Fix) {
    Print-Header "MODE CORRECTION"
    Fix-Gitignore
    Generate-NextAuthSecret
} else {
    Check-All
}

Write-Host ""
Write-Host "📚 Pour plus de détails: Lancer INDEX_SECRETS.md" -ForegroundColor Cyan
Write-Host "💡 Pour un setup rapide: Lancer GUIDE_RAPIDE_SECRETS.md" -ForegroundColor Cyan
Write-Host ""
