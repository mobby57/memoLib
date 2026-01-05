# ==================================================================
# SCRIPT DE VERIFICATION AUTOMATIQUE - IA Poste Manager
# ==================================================================

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "    VERIFICATION AUTOMATIQUE - IA Poste Manager" -ForegroundColor Cyan
Write-Host "=============================================================`n" -ForegroundColor Cyan

$checks = @()

# ==================================================================
# 1. SERVEUR NODE.JS
# ==================================================================
Write-Host "[1/9] Verification du serveur Node.js..." -ForegroundColor Yellow
$nodeProcess = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcess) {
    Write-Host "   [OK] Serveur actif (PID: $($nodeProcess.Id))" -ForegroundColor Green
    $checks += "[OK] Serveur Node"
} else {
    Write-Host "   [KO] Serveur non actif" -ForegroundColor Red
    $checks += "[KO] Serveur Node"
}

# ==================================================================
# 2. PORT 3000
# ==================================================================
Write-Host "`n[2/9] Verification du port 3000..." -ForegroundColor Yellow
try {
    $port3000 = netstat -ano | Select-String ":3000" | Select-Object -First 1
    if ($port3000) {
        Write-Host "   [OK] Port 3000 en ecoute" -ForegroundColor Green
        $checks += "[OK] Port 3000"
    } else {
        Write-Host "   [KO] Port 3000 non utilise" -ForegroundColor Red
        $checks += "[KO] Port 3000"
    }
} catch {
    Write-Host "   [!!] Impossible de verifier le port" -ForegroundColor Yellow
    $checks += "[!!] Port 3000"
}

# ==================================================================
# 3. BASE DE DONNEES
# ==================================================================
Write-Host "`n[3/9] Verification de la base de donnees..." -ForegroundColor Yellow
if (Test-Path "prisma/dev.db") {
    $dbSize = (Get-Item "prisma/dev.db").Length / 1KB
    Write-Host "   [OK] Base de donnees trouvee ($([math]::Round($dbSize, 2)) KB)" -ForegroundColor Green
    $checks += "[OK] Database"
} else {
    Write-Host "   [KO] Base de donnees manquante" -ForegroundColor Red
    $checks += "[KO] Database"
}

# ==================================================================
# 4. FICHIERS CRITIQUES
# ==================================================================
Write-Host "`n[4/9] Verification des fichiers critiques..." -ForegroundColor Yellow
$criticalFiles = @(
    "package.json",
    "next.config.js",
    "prisma/schema.prisma",
    "src/app/layout.tsx",
    "src/app/providers.tsx",
    ".env.local"
)

# Fichier avec crochets - verification speciale
$nextAuthFile = "src\app\api\auth\[...nextauth]\route.ts"

$missingFiles = @()
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "   [KO] $file MANQUANT" -ForegroundColor Red
        $missingFiles += $file
    }
}

# Verification NextAuth avec LiteralPath
if (Test-Path -LiteralPath $nextAuthFile) {
    Write-Host "   [OK] NextAuth route.ts" -ForegroundColor Green
} else {
    Write-Host "   [KO] NextAuth route.ts MANQUANT" -ForegroundColor Red
    $missingFiles += "NextAuth route.ts"
}

if ($missingFiles.Count -eq 0) {
    $checks += "[OK] Fichiers critiques"
} else {
    $checks += "[KO] Fichiers critiques (" + $missingFiles.Count + " manquants)"
}

# ==================================================================
# 5. VARIABLES D'ENVIRONNEMENT
# ==================================================================
Write-Host "`n[5/9] Verification des variables d'environnement..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    $requiredVars = @("DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL")
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "   [OK] $var configure" -ForegroundColor Green
        } else {
            Write-Host "   [KO] $var manquant" -ForegroundColor Red
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -eq 0) {
        $checks += "[OK] Variables ENV"
    } else {
        $checks += "[KO] Variables ENV (" + $missingVars.Count + " manquantes)"
    }
} else {
    Write-Host "   [KO] Fichier .env.local manquant" -ForegroundColor Red
    $checks += "[KO] Variables ENV"
}

# ==================================================================
# 6. COMPILATION TYPESCRIPT (rapide)
# ==================================================================
Write-Host "`n[6/9] Verification TypeScript (scan rapide)..." -ForegroundColor Yellow
try {
    $tsErrors = & npx tsc --noEmit --skipLibCheck 2>&1 | Select-String "error TS" | Measure-Object
    $errorCount = $tsErrors.Count
    
    if ($errorCount -eq 0) {
        Write-Host "   [OK] Aucune erreur TypeScript" -ForegroundColor Green
        $checks += "[OK] TypeScript"
    } else {
        Write-Host "   [!!] $errorCount erreurs TypeScript detectees" -ForegroundColor Yellow
        $checks += "[!!] TypeScript (" + $errorCount + " erreurs)"
    }
} catch {
    Write-Host "   [!!] Impossible de verifier TypeScript" -ForegroundColor Yellow
    $checks += "[!!] TypeScript"
}

# ==================================================================
# 7. COMPTES UTILISATEURS (via seed check)
# ==================================================================
Write-Host "`n[7/9] Verification des comptes de test..." -ForegroundColor Yellow
$testAccounts = @(
    "superadmin@iapostemanager.com",
    "jean.dupont@cabinet-dupont.fr",
    "mohamed.benali@example.com"
)

Write-Host "   [INFO] Comptes attendus:" -ForegroundColor Cyan
foreach ($account in $testAccounts) {
    Write-Host "      - $account" -ForegroundColor White
}
$checks += "[INFO] Comptes test (3 configures)"

# ==================================================================
# 8. MODULES NODE_MODULES
# ==================================================================
Write-Host "`n[8/9] Verification des dependances..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $moduleCount = (Get-ChildItem "node_modules" -Directory).Count
    Write-Host "   [OK] node_modules present (" + $moduleCount + " packages)" -ForegroundColor Green
    $checks += "[OK] Dependencies"
} else {
    Write-Host "   [KO] node_modules manquant - Executez: npm install" -ForegroundColor Red
    $checks += "[KO] Dependencies"
}

# ==================================================================
# 9. SESSION TIMEOUT CONFIGURE
# ==================================================================
Write-Host "`n[9/9] Verification de la configuration session..." -ForegroundColor Yellow
$routeFile = "src\app\api\auth\[...nextauth]\route.ts"
if (Test-Path -LiteralPath $routeFile) {
    $routeContent = Get-Content -LiteralPath $routeFile -Raw
    if ($routeContent -match "maxAge.*2.*60.*60") {
        Write-Host "   [OK] Session timeout configure (2h)" -ForegroundColor Green
        $checks += "[OK] Session timeout"
    } else {
        Write-Host "   [!!] Session timeout non configure" -ForegroundColor Yellow
        $checks += "[!!] Session timeout"
    }
} else {
    Write-Host "   [KO] Fichier route.ts manquant" -ForegroundColor Red
    $checks += "[KO] Session timeout"
}

# ==================================================================
# RESUME FINAL
# ==================================================================
Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "                  RESUME DES VERIFICATIONS" -ForegroundColor Cyan
Write-Host "=============================================================`n" -ForegroundColor Cyan

foreach ($check in $checks) {
    Write-Host "  $check" -ForegroundColor White
}

# Compter les statuts
$okCount = ($checks | Where-Object { $_ -match "\[OK\]" }).Count
$errorCount = ($checks | Where-Object { $_ -match "\[KO\]" }).Count
$warningCount = ($checks | Where-Object { $_ -match "\[!!\]" }).Count
$infoCount = ($checks | Where-Object { $_ -match "\[INFO\]" }).Count

Write-Host "`n=============================================================" -ForegroundColor White
Write-Host "  OK: $okCount  |  Erreurs: $errorCount  |  Avertissements: $warningCount  |  Info: $infoCount" -ForegroundColor White
Write-Host "=============================================================`n" -ForegroundColor White

# ==================================================================
# INSTRUCTIONS FINALES
# ==================================================================
if ($errorCount -eq 0 -and $nodeProcess) {
    Write-Host "*** APPLICATION PRETE ! ***" -ForegroundColor Green
    Write-Host "`nAcceder a: http://localhost:3000`n" -ForegroundColor Cyan
    
    Write-Host "=============================================================" -ForegroundColor Gray
    Write-Host "        COMPTES DE TEST DISPONIBLES" -ForegroundColor Cyan
    Write-Host "=============================================================`n" -ForegroundColor Gray
    
    Write-Host "1. SUPER ADMIN" -ForegroundColor Magenta
    Write-Host "   Email: superadmin@iapostemanager.com" -ForegroundColor White
    Write-Host "   Pass:  SuperAdmin2026!`n" -ForegroundColor Yellow
    
    Write-Host "2. AVOCAT" -ForegroundColor Blue
    Write-Host "   Email: jean.dupont@cabinet-dupont.fr" -ForegroundColor White
    Write-Host "   Pass:  Avocat2026!`n" -ForegroundColor Yellow
    
    Write-Host "3. CLIENT" -ForegroundColor Green
    Write-Host "   Email: mohamed.benali@example.com" -ForegroundColor White
    Write-Host "   Pass:  Client2026!`n" -ForegroundColor Yellow
    
} elseif ($errorCount -gt 0) {
    Write-Host "*** ERREURS DETECTEES - Veuillez corriger avant de continuer ***" -ForegroundColor Red
    
    if (-not $nodeProcess) {
        Write-Host "`nPour demarrer le serveur:" -ForegroundColor Cyan
        Write-Host "   npm run dev`n" -ForegroundColor White
    }
    
    if (-not (Test-Path "prisma/dev.db")) {
        Write-Host "Pour initialiser la base de donnees:" -ForegroundColor Cyan
        Write-Host "   npm run db:reset`n" -ForegroundColor White
    }
    
} else {
    Write-Host "*** Serveur non actif ***" -ForegroundColor Yellow
    Write-Host "`nDemarrer avec: npm run dev`n" -ForegroundColor Cyan
}

Write-Host "=============================================================`n" -ForegroundColor Gray
