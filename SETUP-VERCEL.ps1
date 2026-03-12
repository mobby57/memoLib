# MEMOLIB - Configuration automatique Vercel
# Ce script configure toutes les variables d'environnement Vercel

param(
    [string]$Environment = "production",
    [switch]$GenerateSecrets
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERCEL - CONFIGURATION ENVIRONNEMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verification Vercel CLI
Write-Host "Verification Vercel CLI..." -NoNewline
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installez Vercel CLI:" -ForegroundColor Yellow
    Write-Host "  npm install -g vercel" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "ENVIRONNEMENT: $Environment" -ForegroundColor Cyan
Write-Host ""

# Generation des secrets si demande
if ($GenerateSecrets) {
    Write-Host "GENERATION DES SECRETS..." -ForegroundColor Yellow
    Write-Host ""
    
    # JWT Secret
    $jwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
    Write-Host "JWT_SECRET genere: $jwtSecret" -ForegroundColor Green
    
    # NextAuth Secret
    $nextAuthSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
    Write-Host "NEXTAUTH_SECRET genere: $nextAuthSecret" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Sauvegardez ces secrets!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "VARIABLES A CONFIGURER:" -ForegroundColor Yellow
Write-Host ""

# Liste des variables requises
$variables = @(
    @{
        Name = "JWT_SECRET"
        Description = "Secret JWT (32+ caracteres)"
        Required = $true
        Example = "changez-moi-secret-minimum-32-caracteres"
    },
    @{
        Name = "DATABASE_URL"
        Description = "URL PostgreSQL"
        Required = $true
        Example = "postgresql://user:pass@host:5432/db"
    },
    @{
        Name = "EmailMonitor__Username"
        Description = "Email Gmail"
        Required = $true
        Example = "votre-email@gmail.com"
    },
    @{
        Name = "EmailMonitor__Password"
        Description = "Mot de passe application Gmail"
        Required = $true
        Example = "xxxx xxxx xxxx xxxx"
    },
    @{
        Name = "NEXTAUTH_SECRET"
        Description = "Secret NextAuth (32+ caracteres)"
        Required = $false
        Example = "changez-moi-secret-nextauth-32-chars"
    },
    @{
        Name = "NEXTAUTH_URL"
        Description = "URL de l'application"
        Required = $false
        Example = "https://votre-app.vercel.app"
    }
)

# Afficher les variables
$index = 1
foreach ($var in $variables) {
    $required = if ($var.Required) { "[REQUIS]" } else { "[OPTIONNEL]" }
    Write-Host "$index. $($var.Name) $required" -ForegroundColor $(if ($var.Required) { "Red" } else { "Yellow" })
    Write-Host "   $($var.Description)" -ForegroundColor Gray
    Write-Host "   Exemple: $($var.Example)" -ForegroundColor Gray
    Write-Host ""
    $index++
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMMANDES POUR CONFIGURER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "# 1. Se connecter a Vercel" -ForegroundColor Yellow
Write-Host "vercel login" -ForegroundColor White
Write-Host ""

Write-Host "# 2. Ajouter les variables (une par une)" -ForegroundColor Yellow
foreach ($var in $variables) {
    if ($var.Required) {
        Write-Host "vercel env add $($var.Name) $Environment" -ForegroundColor White
    }
}
Write-Host ""

Write-Host "# 3. Verifier les variables" -ForegroundColor Yellow
Write-Host "vercel env ls" -ForegroundColor White
Write-Host ""

Write-Host "# 4. Deployer" -ForegroundColor Yellow
Write-Host "vercel --prod" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "CONFIGURATION INTERACTIVE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$configure = Read-Host "Voulez-vous configurer maintenant? (o/n)"

if ($configure -eq "o" -or $configure -eq "O") {
    Write-Host ""
    Write-Host "Configuration interactive..." -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($var in $variables) {
        if ($var.Required) {
            Write-Host "Configuration de $($var.Name)..." -ForegroundColor Cyan
            Write-Host "Description: $($var.Description)" -ForegroundColor Gray
            $value = Read-Host "Valeur"
            
            if ($value -ne "") {
                Write-Host "Ajout dans Vercel..." -NoNewline
                try {
                    $output = vercel env add $var.Name $Environment 2>&1
                    # Envoyer la valeur
                    $value | vercel env add $var.Name $Environment 2>&1 | Out-Null
                    Write-Host " OK" -ForegroundColor Green
                } catch {
                    Write-Host " ERREUR" -ForegroundColor Red
                }
            }
            Write-Host ""
        }
    }
    
    Write-Host ""
    Write-Host "Configuration terminee!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifiez avec: vercel env ls" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Configuration manuelle requise." -ForegroundColor Yellow
    Write-Host "Suivez les commandes ci-dessus." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Consultez VERCEL-ENV-CONFIG.md pour plus de details" -ForegroundColor Gray
Write-Host ""
