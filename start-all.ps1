# Start All Services
# IA Poste Manager - Launch all required services

$ErrorActionPreference = "Continue"

Write-Output ""
Write-Output "========================================"
Write-Output "  START ALL SERVICES"
Write-Output "  IA Poste Manager"
Write-Output "========================================"
Write-Output ""

# ========================================
# Pre-checks
# ========================================
Write-Output "[0] Verifications..."
Write-Output "----------------------------------------"

# Verifier Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Output "   [OK] Node.js: $nodeVersion"
} else {
    Write-Output "   [ERREUR] Node.js non installe"
    exit 1
}

# Verifier npm
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Output "   [OK] NPM: $npmVersion"
} else {
    Write-Output "   [ERREUR] NPM non installe"
    exit 1
}

# Verifier node_modules
if (-not (Test-Path "node_modules")) {
    Write-Output "   [INFO] Installation des dependances..."
    npm install
}
Write-Output "   [OK] Dependances installees"

Write-Output ""

# ========================================
# Selection des services
# ========================================
Write-Output "Services disponibles:"
Write-Output "  1. Next.js Frontend seulement"
Write-Output "  2. Frontend + Backend Python"
Write-Output "  3. Frontend + Redis (Docker)"
Write-Output "  4. Tout (Frontend + Backend + Redis)"
Write-Output ""

$choice = Read-Host "Votre choix (1-4, defaut: 1)"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

Write-Output ""

# ========================================
# Lancement des services
# ========================================
switch ($choice) {
    "1" {
        Write-Output "[1] Lancement Next.js..."
        Write-Output "----------------------------------------"
        Write-Output ""
        Write-Output "   URL: http://localhost:3000"
        Write-Output ""
        npm run dev
    }
    "2" {
        Write-Output "[1] Lancement Backend Python..."
        Write-Output "----------------------------------------"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\start-python-backend.ps1"
        
        Write-Output "   [OK] Backend demarre dans nouvelle fenetre"
        Write-Output ""
        
        Start-Sleep -Seconds 3
        
        Write-Output "[2] Lancement Next.js..."
        Write-Output "----------------------------------------"
        Write-Output ""
        Write-Output "   Frontend: http://localhost:3000"
        Write-Output "   Backend:  http://localhost:8000"
        Write-Output ""
        npm run dev
    }
    "3" {
        Write-Output "[1] Lancement Redis (Docker)..."
        Write-Output "----------------------------------------"
        
        # Verifier Docker
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            docker run -d --name iaposte-redis -p 6379:6379 redis:alpine 2>$null
            Write-Output "   [OK] Redis demarre sur port 6379"
        } else {
            Write-Output "   [WARN] Docker non disponible, utilisation Upstash"
        }
        
        Write-Output ""
        
        Write-Output "[2] Lancement Next.js..."
        Write-Output "----------------------------------------"
        Write-Output ""
        Write-Output "   Frontend: http://localhost:3000"
        Write-Output "   Redis:    localhost:6379"
        Write-Output ""
        npm run dev
    }
    "4" {
        Write-Output "[1] Lancement Redis..."
        Write-Output "----------------------------------------"
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            docker run -d --name iaposte-redis -p 6379:6379 redis:alpine 2>$null
            Write-Output "   [OK] Redis demarre"
        }
        
        Write-Output ""
        Write-Output "[2] Lancement Backend Python..."
        Write-Output "----------------------------------------"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\start-python-backend.ps1"
        Write-Output "   [OK] Backend demarre"
        
        Start-Sleep -Seconds 3
        
        Write-Output ""
        Write-Output "[3] Lancement Next.js..."
        Write-Output "----------------------------------------"
        Write-Output ""
        Write-Output "   Frontend: http://localhost:3000"
        Write-Output "   Backend:  http://localhost:8000"
        Write-Output "   Redis:    localhost:6379"
        Write-Output ""
        npm run dev
    }
    default {
        Write-Output "[INFO] Choix invalide, lancement Next.js par defaut..."
        npm run dev
    }
}
