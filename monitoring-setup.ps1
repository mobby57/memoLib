# Monitoring Setup
# IA Poste Manager - Configure monitoring tools

$ErrorActionPreference = "Stop"

Write-Output ""
Write-Output "========================================"
Write-Output "  MONITORING SETUP"
Write-Output "========================================"
Write-Output ""

# ========================================
# Verifier les outils installes
# ========================================
Write-Output "[1] Verification des outils"
Write-Output "----------------------------------------"

$tools = @{
    "node" = "Node.js"
    "npm" = "NPM"
    "npx" = "NPX"
}

foreach ($tool in $tools.GetEnumerator()) {
    $cmd = Get-Command $tool.Key -ErrorAction SilentlyContinue
    if ($cmd) {
        $version = & $tool.Key --version 2>$null
        Write-Output "   [OK] $($tool.Value): $version"
    } else {
        Write-Output "   [WARN] $($tool.Value): Non installe"
    }
}

Write-Output ""

# ========================================
# Configuration Sentry (optionnel)
# ========================================
Write-Output "[2] Sentry (Error Tracking)"
Write-Output "----------------------------------------"

$sentryDsn = $env:SENTRY_DSN
if ($sentryDsn) {
    Write-Output "   [OK] SENTRY_DSN configure"
} else {
    Write-Output "   [INFO] SENTRY_DSN non configure (optionnel)"
    Write-Output "   Pour activer: ajoutez SENTRY_DSN dans .env"
}

Write-Output ""

# ========================================
# Configuration Vercel Analytics
# ========================================
Write-Output "[3] Vercel Analytics"
Write-Output "----------------------------------------"

$vercelAnalytics = $env:VERCEL_ANALYTICS_ID
if ($vercelAnalytics) {
    Write-Output "   [OK] Vercel Analytics configure"
} else {
    Write-Output "   [INFO] Analytics via Vercel Dashboard"
    Write-Output "   Activez dans: vercel.com/dashboard/analytics"
}

Write-Output ""

# ========================================
# Health Check Endpoint
# ========================================
Write-Output "[4] Health Check"
Write-Output "----------------------------------------"

$healthUrl = "http://localhost:3000/api/health"
try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
    Write-Output "   [OK] Health endpoint accessible"
    Write-Output "   Status: $($response.StatusCode)"
} catch {
    Write-Output "   [INFO] Serveur local non demarre"
    Write-Output "   Demarrez avec: npm run dev"
}

Write-Output ""

# ========================================
# Logs Configuration
# ========================================
Write-Output "[5] Configuration Logs"
Write-Output "----------------------------------------"

$logLevel = $env:LOG_LEVEL
if ($logLevel) {
    Write-Output "   [OK] LOG_LEVEL: $logLevel"
} else {
    Write-Output "   [INFO] LOG_LEVEL par defaut (info)"
}

# Verifier dossier logs
$logsDir = "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    Write-Output "   [OK] Dossier logs cree"
} else {
    $logFiles = Get-ChildItem -Path $logsDir -Filter "*.log" -ErrorAction SilentlyContinue
    Write-Output "   [OK] Dossier logs: $($logFiles.Count) fichier(s)"
}

Write-Output ""

# ========================================
# Resume
# ========================================
Write-Output "========================================"
Write-Output "  CONFIGURATION TERMINEE"
Write-Output "========================================"
Write-Output ""
Write-Output "Monitoring actif:"
Write-Output "  - Health Check: /api/health"
Write-Output "  - Logs: ./logs/"
Write-Output "  - Dev Dashboard: /dev/dashboard"
Write-Output ""
Write-Output "Pour plus d'options:"
Write-Output "  - Sentry: sentry.io"
Write-Output "  - Datadog: datadoghq.com"
Write-Output "  - Grafana: grafana.com"
Write-Output ""
