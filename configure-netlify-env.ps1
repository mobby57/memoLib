# Configure Netlify Environment Variables
Write-Host "Configuration des variables d'environnement Netlify..." -ForegroundColor Cyan
    Write-Host "Impossible de recuperer l'URL Netlify" -ForegroundColor Red
    Write-Host "Utilisation de l'URL par defaut..." -ForegroundColor Yellow
Write-Host "URL Netlify detectee: $netlifyUrl" -ForegroundColor Green
    Write-Host "  OK Configure" -ForegroundColor Green
Write-Host "Configuration terminee!" -ForegroundColor Green
Write-Host "Etapes suivantes:" -ForegroundColor Cyan
# Configure Netlify Environment Variables
# This script sets all required environment variables for Netlify deployment

Write-Host "🔧 Configuration des variables d'environnement Netlify..." -ForegroundColor Cyan
Write-Host ""

# Read .env.local and extract variables
$envFile = Get-Content .env.local -Raw

function Extract-EnvVar {
    param($content, $varName)
    
    if ($content -match "$varName=`"([^`"]+)`"") {
        return $matches[1]
    } elseif ($content -match "$varName=([^\n\r]+)") {
        return $matches[1].Trim()
    }
    return $null
}

# Extract all variables
$DATABASE_URL = Extract-EnvVar $envFile "DATABASE_URL"
$NEXTAUTH_SECRET = Extract-EnvVar $envFile "NEXTAUTH_SECRET"
$GITHUB_CLIENT_ID = Extract-EnvVar $envFile "GITHUB_CLIENT_ID"
$GITHUB_CLIENT_SECRET = Extract-EnvVar $envFile "GITHUB_CLIENT_SECRET"
$STRIPE_SECRET_KEY = Extract-EnvVar $envFile "STRIPE_SECRET_KEY"
$STRIPE_PUBLISHABLE_KEY = Extract-EnvVar $envFile "STRIPE_PUBLISHABLE_KEY"
$STRIPE_WEBHOOK_SECRET = Extract-EnvVar $envFile "STRIPE_WEBHOOK_SECRET"
$SENTRY_DSN = Extract-EnvVar $envFile "SENTRY_DSN"
$NEXT_PUBLIC_SENTRY_DSN = Extract-EnvVar $envFile "NEXT_PUBLIC_SENTRY_DSN"
$UPSTASH_REDIS_REST_URL = Extract-EnvVar $envFile "UPSTASH_REDIS_REST_URL"
$UPSTASH_REDIS_REST_TOKEN = Extract-EnvVar $envFile "UPSTASH_REDIS_REST_TOKEN"
$NEXT_PUBLIC_DEMO_MODE = Extract-EnvVar $envFile "NEXT_PUBLIC_DEMO_MODE"

# Get Netlify URL
$netlifyUrl = (netlify status | Select-String "Project URL:" | ForEach-Object { $_ -replace ".*Project URL:\s+", "" }).Trim()

if (-not $netlifyUrl) {
    Write-Host "❌ Impossible de récupérer l'URL Netlify" -ForegroundColor Red
    Write-Host "Utilisation de l'URL par défaut..." -ForegroundColor Yellow
    $netlifyUrl = "https://bright-dodol-d4bf9b.netlify.app"
}

Write-Host "🌐 URL Netlify détectée: $netlifyUrl" -ForegroundColor Green
Write-Host ""

# Configure variables
$vars = @{
    "DATABASE_URL" = $DATABASE_URL
    "NEXTAUTH_SECRET" = $NEXTAUTH_SECRET
    "NEXTAUTH_URL" = $netlifyUrl
    "GITHUB_CLIENT_ID" = $GITHUB_CLIENT_ID
    "GITHUB_CLIENT_SECRET" = $GITHUB_CLIENT_SECRET
    "STRIPE_SECRET_KEY" = $STRIPE_SECRET_KEY
    "STRIPE_PUBLISHABLE_KEY" = $STRIPE_PUBLISHABLE_KEY
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" = $STRIPE_PUBLISHABLE_KEY
    "STRIPE_WEBHOOK_SECRET" = $STRIPE_WEBHOOK_SECRET
    "SENTRY_DSN" = $SENTRY_DSN
    "NEXT_PUBLIC_SENTRY_DSN" = $NEXT_PUBLIC_SENTRY_DSN
    "UPSTASH_REDIS_REST_URL" = $UPSTASH_REDIS_REST_URL
    "UPSTASH_REDIS_REST_TOKEN" = $UPSTASH_REDIS_REST_TOKEN
    "NEXT_PUBLIC_DEMO_MODE" = $NEXT_PUBLIC_DEMO_MODE
    "NODE_ENV" = "production"
}

# Set each variable
$count = 0
$total = $vars.Count

foreach ($key in $vars.Keys) {
    $value = $vars[$key]
    
    if ($value) {
        $count++
        $maskedValue = if ($value.Length -gt 20) { "$($value.Substring(0, 10))..." } else { "***" }
        Write-Host "[$count/$total] $key = $maskedValue" -ForegroundColor Gray
        
        # Set the variable in Netlify
        netlify env:set $key $value --silent 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Configuré" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Erreur" -ForegroundColor Red
        }
    } else {
        Write-Host "[$count/$total] $key - VALEUR MANQUANTE" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "Étapes suivantes:" -ForegroundColor Cyan
Write-Host "1. netlify deploy --build    # Test de déploiement (preview)"
Write-Host "2. netlify deploy --prod     # Déploiement production"
Write-Host "3. netlify open              # Ouvrir le dashboard"
Write-Host ""
