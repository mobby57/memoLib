# Configuration Avancée Automatique - IA Poste Manager
# Ce script configure tous les services avancés automatiquement

param(
    [switch]$SkipOllama,
    [switch]$SkipDatabase,
    [switch]$SkipServices
)

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  CONFIGURATION AVANCEE AUTOMATIQUE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour vérifier un service
function Test-Service {
    param(
        [string]$Url,
        [string]$Name
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 2 -ErrorAction Stop
        Write-Host "  [OK] $Name actif" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  [!] $Name non accessible" -ForegroundColor Yellow
        return $false
    }
}

# ============================================
# ETAPE 1: Vérification Prisma Database
# ============================================
if (-not $SkipDatabase) {
    Write-Host "[1/5] Configuration Base de Donnees..." -ForegroundColor Cyan
    Write-Host ""
    
    # Générer le client Prisma
    Write-Host "  Generation client Prisma..." -ForegroundColor Yellow
    npx prisma generate 2>&1 | Out-Null
    
    # Push schema
    Write-Host "  Application schema..." -ForegroundColor Yellow
    npx prisma db push --accept-data-loss 2>&1 | Out-Null
    
    if (Test-Path "prisma/dev.db") {
        Write-Host "  [OK] Base de donnees prete" -ForegroundColor Green
    } else {
        Write-Host "  [!] Erreur creation base" -ForegroundColor Red
    }
    
    Write-Host ""
}

# ============================================
# ETAPE 2: Vérification Services Backend
# ============================================
if (-not $SkipServices) {
    Write-Host "[2/5] Verification Services Backend..." -ForegroundColor Cyan
    Write-Host ""
    
    $services = @(
        "src/services/email_service.py",
        "src/services/ai_service.py",
        "src/services/voice_service.py",
        "src/services/__init__.py"
    )
    
    $allServicesExist = $true
    foreach ($service in $services) {
        if (Test-Path $service) {
            Write-Host "  [OK] $(Split-Path $service -Leaf)" -ForegroundColor Green
        } else {
            Write-Host "  [!] $(Split-Path $service -Leaf) manquant" -ForegroundColor Red
            $allServicesExist = $false
        }
    }
    
    if ($allServicesExist) {
        Write-Host ""
        Write-Host "  [OK] Tous les services backend sont presents" -ForegroundColor Green
    }
    
    Write-Host ""
}

# ============================================
# ETAPE 3: Configuration Variables Environnement
# ============================================
Write-Host "[3/5] Verification Variables Environnement..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    $requiredVars = @{
        "DATABASE_URL" = "file:./prisma/dev.db"
        "NEXTAUTH_URL" = "http://localhost:3000"
        "NEXTAUTH_SECRET" = $null
        "OLLAMA_BASE_URL" = "http://localhost:11434"
        "OLLAMA_MODEL" = "llama3.2:3b"
    }
    
    $needsUpdate = $false
    
    foreach ($var in $requiredVars.Keys) {
        if ($envContent -match $var) {
            Write-Host "  [OK] $var" -ForegroundColor Green
        } else {
            Write-Host "  [!] $var manquant" -ForegroundColor Yellow
            $needsUpdate = $true
        }
    }
    
    if ($needsUpdate) {
        Write-Host ""
        Write-Host "  [!] Certaines variables manquent dans .env.local" -ForegroundColor Yellow
        Write-Host "      Verifiez le fichier .env.local.example" -ForegroundColor Gray
    }
} else {
    Write-Host "  [!] .env.local absent - creation a partir de .env.local.example" -ForegroundColor Yellow
    
    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" ".env.local"
        Write-Host "  [OK] .env.local cree" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================
# ETAPE 4: Test Ollama (IA Locale)
# ============================================
if (-not $SkipOllama) {
    Write-Host "[4/5] Verification Ollama (IA Locale)..." -ForegroundColor Cyan
    Write-Host ""
    
    $ollamaRunning = Test-Service -Url "http://localhost:11434" -Name "Ollama"
    
    if (-not $ollamaRunning) {
        Write-Host ""
        Write-Host "  INSTRUCTIONS OLLAMA:" -ForegroundColor Yellow
        Write-Host "  1. Installer Ollama: https://ollama.ai/download" -ForegroundColor White
        Write-Host "  2. Lancer: ollama serve" -ForegroundColor White
        Write-Host "  3. Telecharger modele: ollama pull llama3.2:3b" -ForegroundColor White
    }
    
    Write-Host ""
}

# ============================================
# ETAPE 5: Test Infrastructure Complete
# ============================================
Write-Host "[5/5] Verification Infrastructure Complete..." -ForegroundColor Cyan
Write-Host ""

# Test Frontend
$frontendRunning = Test-Service -Url "http://localhost:3000" -Name "Frontend Next.js"

# Test Backend
$backendRunning = Test-Service -Url "http://localhost:8000/health" -Name "Backend FastAPI"

Write-Host ""

# ============================================
# RESUME FINAL
# ============================================
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  RESUME CONFIGURATION" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$components = @(
    @{Name="Base de donnees Prisma"; Status=(Test-Path "prisma/dev.db")},
    @{Name="Services Backend"; Status=(Test-Path "src/services/email_service.py")},
    @{Name="Variables environnement"; Status=(Test-Path ".env.local")},
    @{Name="Frontend Next.js"; Status=$frontendRunning},
    @{Name="Backend FastAPI"; Status=$backendRunning}
)

foreach ($component in $components) {
    $statusText = if ($component.Status) { "[OK]" } else { "[!]" }
    $statusColor = if ($component.Status) { "Green" } else { "Yellow" }
    
    Write-Host "  $statusText " -NoNewline -ForegroundColor $statusColor
    Write-Host $component.Name -ForegroundColor White
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Prochaines étapes
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host ""

if (-not $frontendRunning) {
    Write-Host "  Frontend: npm run dev" -ForegroundColor Yellow
}

if (-not $backendRunning) {
    Write-Host "  Backend: .\start-backend-venv.ps1" -ForegroundColor Yellow
}

if (-not (Test-Service -Url "http://localhost:11434" -Name "Ollama" 2>&1 | Out-Null)) {
    Write-Host "  Ollama: ollama serve (optionnel)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  Prisma Studio: npx prisma studio" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Application: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "[OK] Configuration avancee terminee!" -ForegroundColor Green
Write-Host ""
