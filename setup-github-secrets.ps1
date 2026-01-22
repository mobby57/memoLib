# Script d'ajout automatique des secrets GitHub pour Azure SWA
Write-Host ""
Write-Host "Configuration des GitHub Secrets pour Azure SWA" -ForegroundColor Cyan
Write-Host ""

# Vérifier que gh est installé
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "Erreur: GitHub CLI (gh) n'est pas installe" -ForegroundColor Red
    Write-Host "Installez-le depuis: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Vérifier l'authentification GitHub
Write-Host "Verification de l'authentification GitHub..." -ForegroundColor Gray
gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Non authentifie avec GitHub CLI" -ForegroundColor Red
    Write-Host "Executez: gh auth login" -ForegroundColor Yellow
    exit 1
}

$repo = "mobby57/iapostemanager"
Write-Host "Authentifie - Repository: $repo" -ForegroundColor Green
Write-Host ""

# 1. AZURE_STATIC_WEB_APPS_API_TOKEN
Write-Host "1/4 - AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor Cyan
Write-Host "Recuperation depuis Azure..." -ForegroundColor Gray

$azureToken = az staticwebapp secrets list --name iapostemanager-swa --resource-group iapostemanager-rg --query "properties.apiKey" -o tsv 2>$null

if ($azureToken) {
    $preview = $azureToken.Substring(0, [Math]::Min(30, $azureToken.Length))
    Write-Host "Token recupere: $preview..." -ForegroundColor Gray
    echo $azureToken | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo $repo
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Secret ajoute avec succes" -ForegroundColor Green
    } else {
        Write-Host "Erreur lors de l'ajout du secret" -ForegroundColor Red
    }
} else {
    Write-Host "Impossible de recuperer le token Azure" -ForegroundColor Red
}
Write-Host ""

# 2. NEXTAUTH_SECRET
Write-Host "2/4 - NEXTAUTH_SECRET" -ForegroundColor Cyan

$envFile = ".env.local"
$existingSecret = $null

if (Test-Path $envFile) {
    $lines = Get-Content $envFile
    foreach ($line in $lines) {
        if ($line.StartsWith("NEXTAUTH_SECRET=")) {
            $existingSecret = $line.Substring(16).Trim().Trim('"')
            Write-Host "Trouve dans .env.local" -ForegroundColor Gray
            break
        }
    }
}

if (-not $existingSecret) {
    Write-Host "Generation d'un nouveau secret..." -ForegroundColor Gray
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $existingSecret = [Convert]::ToBase64String($bytes)
}

$preview = $existingSecret.Substring(0, [Math]::Min(20, $existingSecret.Length))
Write-Host "Secret: $preview..." -ForegroundColor Gray
echo $existingSecret | gh secret set NEXTAUTH_SECRET --repo $repo

if ($LASTEXITCODE -eq 0) {
    Write-Host "Secret ajoute avec succes" -ForegroundColor Green
} else {
    Write-Host "Erreur lors de l'ajout du secret" -ForegroundColor Red
}
Write-Host ""

# 3. DATABASE_URL
Write-Host "3/4 - DATABASE_URL" -ForegroundColor Cyan

$dbUrl = $null
if (Test-Path $envFile) {
    $lines = Get-Content $envFile
    foreach ($line in $lines) {
        if ($line.StartsWith("DATABASE_URL=")) {
            $dbUrl = $line.Substring(13).Trim().Trim('"')
            Write-Host "Trouve dans .env.local" -ForegroundColor Gray
            break
        }
    }
}

if (-not $dbUrl) {
    Write-Host "DATABASE_URL non trouve dans .env.local" -ForegroundColor Yellow
    $dbUrl = "file:./prisma/dev.db"
    Write-Host "Utilisation de la valeur par defaut: $dbUrl" -ForegroundColor Gray
}

Write-Host "URL: $dbUrl" -ForegroundColor Gray
echo $dbUrl | gh secret set DATABASE_URL --repo $repo

if ($LASTEXITCODE -eq 0) {
    Write-Host "Secret ajoute avec succes" -ForegroundColor Green
} else {
    Write-Host "Erreur lors de l'ajout du secret" -ForegroundColor Red
}
Write-Host ""

# 4. OLLAMA_BASE_URL
Write-Host "4/4 - OLLAMA_BASE_URL (optionnel)" -ForegroundColor Cyan

$ollamaUrl = $null
if (Test-Path $envFile) {
    $lines = Get-Content $envFile
    foreach ($line in $lines) {
        if ($line.StartsWith("OLLAMA_BASE_URL=")) {
            $ollamaUrl = $line.Substring(16).Trim().Trim('"')
            Write-Host "Trouve dans .env.local" -ForegroundColor Gray
            break
        }
    }
}

if (-not $ollamaUrl) {
    $ollamaUrl = "http://localhost:11434"
    Write-Host "Utilisation de la valeur par defaut: $ollamaUrl" -ForegroundColor Gray
}

Write-Host "URL: $ollamaUrl" -ForegroundColor Gray
echo $ollamaUrl | gh secret set OLLAMA_BASE_URL --repo $repo

if ($LASTEXITCODE -eq 0) {
    Write-Host "Secret ajoute avec succes" -ForegroundColor Green
} else {
    Write-Host "Erreur lors de l'ajout du secret" -ForegroundColor Red
}
Write-Host ""

# Récapitulatif
Write-Host "="*60 -ForegroundColor Gray
Write-Host "Configuration des secrets terminee" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Gray
Write-Host ""

Write-Host "Secrets configures dans GitHub:" -ForegroundColor Cyan
gh secret list --repo $repo

Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. Commitez le workflow: git add .github/workflows/azure-swa-deploy.yml" -ForegroundColor White
Write-Host "2. Poussez vers GitHub: git push origin main" -ForegroundColor White
Write-Host "3. Verifiez le deploiement: https://github.com/$repo/actions" -ForegroundColor White
Write-Host ""

Write-Host "URL de production:" -ForegroundColor Cyan
Write-Host "https://agreeable-desert-0d1659d03.6.azurestaticapps.net" -ForegroundColor Green
Write-Host ""
