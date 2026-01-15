# Configuration Automatique Cloudflare - Variables d'Environnement
# Usage: .\add-cloudflare-vars.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " CONFIGURATION AUTOMATIQUE CLOUDFLARE PAGES" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Variables critiques
$vars = @{
    "DATABASE_URL" = "d1://iaposte-production-db"
    "NEXTAUTH_SECRET" = "eO9khDt0zJ/g9Daj10/cBMQVhq315hvTUsMfvYRXvtU="
    "NEXTAUTH_URL" = "https://iapostemanager.pages.dev"
    "SENDGRID_API_KEY" = "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"
    "SENDGRID_SENDER_EMAIL" = "contact@iapostemanager.com"
    "GOOGLE_CLIENT_ID" = "123456789-abcdefghijklmnop.apps.googleusercontent.com"
    "GOOGLE_CLIENT_SECRET" = "GOCSPX-abcdefghijklmnopqrstuvwxyz"
    "OLLAMA_BASE_URL" = "http://localhost:11434"
}

Write-Host "Variables a configurer: $($vars.Count)`n" -ForegroundColor Yellow

# Verifier Wrangler
try {
    $wranglerVersion = wrangler --version 2>&1
    Write-Host "[OK] Wrangler installe: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Wrangler non installe" -ForegroundColor Red
    Write-Host "Installer: npm install -g wrangler`n" -ForegroundColor Yellow
    
    $install = Read-Host "Installer maintenant? (O/n)"
    if ($install -ne 'n') {
        npm install -g wrangler
    } else {
        Write-Host "`nUtiliser la methode manuelle:" -ForegroundColor Yellow
        Write-Host "1. Ouvrir: https://dash.cloudflare.com" -ForegroundColor White
        Write-Host "2. Pages > iaposte-manager > Settings > Environment variables`n" -ForegroundColor White
        exit 1
    }
}

# Login Wrangler
Write-Host "`nVerification authentification..." -ForegroundColor Cyan
try {
    $whoami = wrangler whoami 2>&1
    if ($whoami -match "not authenticated") {
        Write-Host "[INFO] Authentification requise" -ForegroundColor Yellow
        Write-Host "Ouverture navigateur pour login...`n" -ForegroundColor Cyan
        wrangler login
    } else {
        Write-Host "[OK] Deja authentifie" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARN] Impossible de verifier auth, on continue..." -ForegroundColor Yellow
}

# Configuration des variables
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host " AJOUT DES VARIABLES" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$success = 0
$failed = 0
$errors = @()

foreach ($key in $vars.Keys) {
    Write-Host "Configuration de: $key..." -ForegroundColor White
    
    # Creer fichier temporaire avec la valeur
    $tempFile = [System.IO.Path]::GetTempFileName()
    $vars[$key] | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
    
    try {
        # Utiliser wrangler pages secret put
        $result = Get-Content $tempFile | wrangler pages secret put $key --project-name=iaposte-manager 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $key configure`n" -ForegroundColor Green
            $success++
        } else {
            Write-Host "  [ERREUR] Echec: $result`n" -ForegroundColor Red
            $failed++
            $errors += "$key : $result"
        }
    } catch {
        Write-Host "  [ERREUR] Exception: $_`n" -ForegroundColor Red
        $failed++
        $errors += "$key : $_"
    } finally {
        Remove-Item $tempFile -ErrorAction SilentlyContinue
    }
}

# Resultats
Write-Host "================================================" -ForegroundColor Yellow
Write-Host " RESULTATS" -ForegroundColor Yellow
Write-Host "================================================`n" -ForegroundColor Yellow

Write-Host "Reussis: $success / $($vars.Count)" -ForegroundColor $(if($success -eq $vars.Count){'Green'}else{'Yellow'})
Write-Host "Echecs: $failed`n" -ForegroundColor $(if($failed -eq 0){'Green'}else{'Red'})

if ($failed -gt 0) {
    Write-Host "Erreurs detaillees:" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor DarkRed
    }
    
    Write-Host "`n[SOLUTION] Utiliser la methode manuelle:" -ForegroundColor Yellow
    Write-Host "1. Ouvrir: https://dash.cloudflare.com" -ForegroundColor White
    Write-Host "2. Pages > iaposte-manager > Settings > Environment variables" -ForegroundColor White
    Write-Host "3. Copier variables depuis: cloudflare-env.txt`n" -ForegroundColor White
} else {
    Write-Host "[OK] Toutes les variables configurees!`n" -ForegroundColor Green
    
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host " PROCHAINES ETAPES" -ForegroundColor Cyan
    Write-Host "================================================`n" -ForegroundColor Cyan
    
    Write-Host "1. Attendre 2-3 minutes (nouveau deploiement automatique)" -ForegroundColor White
    Write-Host "2. Verifier: https://dash.cloudflare.com" -ForegroundColor White
    Write-Host "   Pages > iaposte-manager > Deployments" -ForegroundColor White
    Write-Host "3. Tester: .\test-production-simple.ps1 -Full`n" -ForegroundColor White
    
    Write-Host "[INFO] Les variables sont configurees, mais necessitent un redeploy" -ForegroundColor Yellow
    Write-Host "Option 1: Attendre redeploy automatique (quelques minutes)" -ForegroundColor Cyan
    Write-Host "Option 2: Forcer redeploy: git commit --allow-empty -m 'redeploy' && git push`n" -ForegroundColor Cyan
}

Write-Host "================================================`n" -ForegroundColor Cyan
