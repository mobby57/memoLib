# Demo Databases
# IA Poste Manager - Test database connections

$ErrorActionPreference = "Stop"

Write-Output ""
Write-Output "========================================"
Write-Output "  DEMO DATABASES"
Write-Output "========================================"
Write-Output ""

# ========================================
# Test PostgreSQL (Neon)
# ========================================
Write-Output "[1] PostgreSQL (Neon)"
Write-Output "----------------------------------------"

$pgUrl = $env:DATABASE_URL
if ($pgUrl) {
    Write-Output "   [OK] DATABASE_URL configuree"
    
    # Parser l'URL
    if ($pgUrl -match "postgresql://([^:]+):([^@]+)@([^/]+)/(.+)") {
        $pgHost = $Matches[3]
        $pgDb = $Matches[4] -replace '\?.*', ''
        Write-Output "   Host: $pgHost"
        Write-Output "   Database: $pgDb"
    }
    
    # Test connexion via Prisma
    Write-Output ""
    Write-Output "   [INFO] Test connexion Prisma..."
    try {
        # PowerShell compatible - use echo instead of <<<
        "SELECT 1" | npx prisma db execute --stdin 2>$null
        Write-Output "   [OK] Connexion PostgreSQL reussie"
    } catch {
        Write-Output "   [WARN] Echec connexion (verifiez DATABASE_URL)"
    }
    
} else {
    Write-Output "   [WARN] DATABASE_URL non configuree"
}

Write-Output ""

# ========================================
# Test Redis (Upstash)
# ========================================
Write-Output "[2] Redis (Upstash)"
Write-Output "----------------------------------------"

$redisUrl = $env:UPSTASH_REDIS_REST_URL
$redisToken = $env:UPSTASH_REDIS_REST_TOKEN

if ($redisUrl -and $redisToken) {
    Write-Output "   [OK] Variables Redis configurees"
    Write-Output "   URL: $redisUrl"
    
    # Test connexion
    Write-Output ""
    Write-Output "   [INFO] Test connexion Redis..."
    try {
        $headers = @{
            "Authorization" = "Bearer $redisToken"
        }
        $response = Invoke-RestMethod -Uri "$redisUrl/ping" -Headers $headers -Method GET
        Write-Output "   [OK] Connexion Redis reussie"
    } catch {
        Write-Output "   [WARN] Echec connexion Redis"
    }
    
} else {
    Write-Output "   [WARN] Variables Redis non configurees"
    Write-Output "   UPSTASH_REDIS_REST_URL"
    Write-Output "   UPSTASH_REDIS_REST_TOKEN"
}

Write-Output ""

# ========================================
# Test SQLite (Local)
# ========================================
Write-Output "[3] SQLite (Local)"
Write-Output "----------------------------------------"

$sqliteDb = "prisma/dev.db"
if (Test-Path $sqliteDb) {
    $size = (Get-Item $sqliteDb).Length / 1KB
    Write-Output "   [OK] Base SQLite trouvee"
    Write-Output "   Fichier: $sqliteDb"
    Write-Output "   Taille: $([math]::Round($size, 2)) KB"
} else {
    Write-Output "   [INFO] Base SQLite non trouvee (normal si Neon utilise)"
}

Write-Output ""

# ========================================
# Test Cloudflare D1
# ========================================
Write-Output "[4] Cloudflare D1"
Write-Output "----------------------------------------"

try {
    $d1List = wrangler d1 list 2>$null
    if ($d1List) {
        Write-Output "   [OK] Bases D1 disponibles:"
        $d1List | ForEach-Object { Write-Output "      $_" }
    } else {
        Write-Output "   [INFO] Aucune base D1 trouvee"
    }
} catch {
    Write-Output "   [INFO] Wrangler non configure ou non authentifie"
}

Write-Output ""

# ========================================
# Resume
# ========================================
Write-Output "========================================"
Write-Output "  RESUME"
Write-Output "========================================"
Write-Output ""

$dbCount = 0
if ($pgUrl) { $dbCount++ }
if ($redisUrl) { $dbCount++ }
if (Test-Path $sqliteDb) { $dbCount++ }

Write-Output "Bases de donnees configurees: $dbCount"
Write-Output ""

if ($dbCount -eq 0) {
    Write-Output "[WARN] Aucune base configuree!"
    Write-Output "   Executez: npx prisma db push"
    Write-Output "   Ou configurez DATABASE_URL dans .env"
}
