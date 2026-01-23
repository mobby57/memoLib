# ============================================
# Configure Vercel with Azure Environment Variables
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Vercel + Azure Environment Configuration" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check if .env.azure exists
if (-not (Test-Path ".env.azure")) {
    Write-Host "`nERREUR: .env.azure non trouve!" -ForegroundColor Red
    Write-Host "Executez d'abord: ./setup-azure-services.ps1" -ForegroundColor Yellow
    exit 1
}

# Check Vercel CLI
$vercelVersion = vercel --version 2>$null
if (-not $vercelVersion) {
    Write-Host "Installation Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Read .env.azure
Write-Host "`nLecture de .env.azure..." -ForegroundColor Yellow
$envContent = Get-Content ".env.azure" | Where-Object { $_ -match "^[A-Z]" -and $_ -match "=" }

$envVars = @{}
foreach ($line in $envContent) {
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        $envVars[$key] = $value
    }
}

Write-Host "Variables trouvees: $($envVars.Count)" -ForegroundColor Green

# Add to Vercel
Write-Host "`nAjout des variables a Vercel..." -ForegroundColor Yellow

$environments = @("production", "preview", "development")

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    
    Write-Host "  $key..." -NoNewline
    
    # Add for all environments
    foreach ($env in $environments) {
        $result = echo $value | vercel env add $key $env --force 2>&1
    }
    
    Write-Host " OK" -ForegroundColor Green
}

# Also add from .env.production if not already covered
Write-Host "`nAjout des variables de .env.production..." -ForegroundColor Yellow

$prodVars = @(
    "NEXTAUTH_SECRET",
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "AZURE_AD_CLIENT_ID",
    "AZURE_AD_TENANT_ID",
    "AZURE_AD_CLIENT_SECRET",
    "NEXT_PUBLIC_AZURE_AD_ENABLED",
    "JIT_PROVISIONING"
)

if (Test-Path ".env.production") {
    $prodContent = Get-Content ".env.production" | Where-Object { $_ -match "^[A-Z]" -and $_ -match "=" }
    
    foreach ($line in $prodContent) {
        if ($line -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            
            if ($prodVars -contains $key -and $value -and $value -notmatch "^your-|^placeholder") {
                Write-Host "  $key..." -NoNewline
                
                foreach ($env in $environments) {
                    $result = echo $value | vercel env add $key $env --force 2>&1
                }
                
                Write-Host " OK" -ForegroundColor Green
            }
        }
    }
}

# Set NEXTAUTH_URL for production
Write-Host "`nConfiguration NEXTAUTH_URL..." -ForegroundColor Yellow
echo "https://iapostemanage.vercel.app" | vercel env add NEXTAUTH_URL production --force 2>&1
echo "https://iapostemanage.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production --force 2>&1
Write-Host "  NEXTAUTH_URL: OK" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " Configuration Vercel terminee!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`nProchaines etapes:" -ForegroundColor Yellow
Write-Host "  1. vercel env pull .env.local  # Sync local" -ForegroundColor White
Write-Host "  2. npx prisma db push          # Push schema to Azure DB" -ForegroundColor White
Write-Host "  3. vercel --prod               # Deploy" -ForegroundColor White

Write-Host "`nVerifier les variables:" -ForegroundColor Yellow
Write-Host "  vercel env ls" -ForegroundColor Gray
