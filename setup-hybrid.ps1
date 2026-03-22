#!/usr/bin/env pwsh
# ============================================================
# MemoLib - Setup Hybride Gratuit
# ============================================================
# Frontend : memolib.space       → Vercel (0€)
# API      : api.memolib.space   → Azure F1 (0€)
# DB       : Neon PostgreSQL     (0€)
# Cache    : Upstash Redis       (0€)
# Total    : ~1€/mois (domaine)
# ============================================================

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MemoLib - Configuration Hybride" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ── 1. Collecter les secrets ──────────────────────────────────

Write-Host "[1/6] Configuration des secrets`n" -ForegroundColor Yellow

# DATABASE_URL Neon
$dbUrl = Read-Host "DATABASE_URL Neon (postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require)"
if (-not $dbUrl -or $dbUrl -notmatch "^postgres") {
    Write-Host "ERREUR: URL PostgreSQL invalide" -ForegroundColor Red
    exit 1
}

# Convertir DATABASE_URL format Prisma → format .NET (Host=;Port=;Database=;Username=;Password=;SSL Mode=)
$uri = [System.Uri]::new($dbUrl.Replace("postgresql://", "http://").Replace("postgres://", "http://").Split("?")[0])
$userInfo = $uri.UserInfo -split ":"
$dotnetConnStr = "Host=$($uri.Host);Port=$(if($uri.Port -gt 0){$uri.Port}else{5432});Database=$($uri.AbsolutePath.TrimStart('/'));Username=$($userInfo[0]);Password=$($userInfo[1]);SSL Mode=Require;Trust Server Certificate=true"
Write-Host "  Connection string .NET: OK" -ForegroundColor Green

# Upstash Redis
Write-Host "`n  -- Upstash Redis (gratuit) --" -ForegroundColor Magenta
Write-Host "  1. Va sur https://console.upstash.com" -ForegroundColor Gray
Write-Host "  2. Cree une DB Redis gratuite (region EU)" -ForegroundColor Gray
Write-Host "  3. Copie UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN`n" -ForegroundColor Gray

$redisUrl = Read-Host "UPSTASH_REDIS_REST_URL (ou ENTREE pour skip Redis)"
$redisToken = ""
if ($redisUrl) {
    $redisToken = Read-Host "UPSTASH_REDIS_REST_TOKEN"
}

# ── 2. Configurer Azure App Settings ─────────────────────────

Write-Host "`n[2/6] Configuration Azure App Service`n" -ForegroundColor Yellow

$settings = @(
    "UsePostgreSQL=true",
    "ConnectionStrings__Default=$dotnetConnStr",
    "ASPNETCORE_ENVIRONMENT=Production",
    "Cors__AllowedOrigins__0=https://memolib.space",
    "Cors__AllowedOrigins__1=https://www.memolib.space",
    "Cors__AllowedOrigins__2=https://memolib-api.azurewebsites.net"
)

if ($redisUrl) {
    $settings += "Redis__Url=$redisUrl"
    $settings += "Redis__Token=$redisToken"
}

Write-Host "  Mise a jour des app settings..." -ForegroundColor Gray
az webapp config appsettings set `
    --resource-group memolib-rg `
    --name memolib-api `
    --settings @settings `
    --output table

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: az webapp config failed" -ForegroundColor Red
    exit 1
}
Write-Host "  App settings: OK" -ForegroundColor Green

# ── 3. Build & Deploy API ─────────────────────────────────────

Write-Host "`n[3/6] Build & Deploy MemoLib.Api`n" -ForegroundColor Yellow

Write-Host "  Compilation Release..." -ForegroundColor Gray
dotnet publish -c Release -o ./publish --nologo -v quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: dotnet publish failed" -ForegroundColor Red
    exit 1
}
Write-Host "  Build: OK" -ForegroundColor Green

Write-Host "  Creation du zip..." -ForegroundColor Gray
Remove-Item ./memolib-deploy.zip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path './publish/*' -DestinationPath './memolib-deploy.zip' -Force
Write-Host "  Zip: OK" -ForegroundColor Green

Write-Host "  Deploiement sur Azure..." -ForegroundColor Gray
az webapp deploy `
    --resource-group memolib-rg `
    --name memolib-api `
    --src-path ./memolib-deploy.zip `
    --type zip `
    --output table
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: az webapp deploy failed" -ForegroundColor Red
    exit 1
}
Write-Host "  Deploy: OK" -ForegroundColor Green

# ── 4. Configurer DNS Vercel ──────────────────────────────────

Write-Host "`n[4/6] Configuration DNS (Vercel)`n" -ForegroundColor Yellow
Write-Host "  Tu dois configurer ces records dans le dashboard Vercel:" -ForegroundColor Gray
Write-Host "  https://vercel.com/mobby57s-projects/memolib/settings/domains`n" -ForegroundColor Cyan

Write-Host "  ┌─────────────────────────────────────────────────────────┐" -ForegroundColor White
Write-Host "  │ Type   │ Name │ Value                                  │" -ForegroundColor White
Write-Host "  ├─────────────────────────────────────────────────────────┤" -ForegroundColor White
Write-Host "  │ A      │ @    │ 76.76.21.21 (Vercel)                   │" -ForegroundColor Green
Write-Host "  │ CNAME  │ www  │ cname.vercel-dns.com                   │" -ForegroundColor Green
Write-Host "  │ CNAME  │ api  │ memolib-api.azurewebsites.net          │" -ForegroundColor Yellow
Write-Host "  └─────────────────────────────────────────────────────────┘" -ForegroundColor White

Write-Host "`n  IMPORTANT: Supprimer le record A actuel (89.168.55.130)" -ForegroundColor Red

$dnsReady = Read-Host "`n  DNS configure? (o/n)"

# ── 5. Configurer custom domain Azure ─────────────────────────

if ($dnsReady -eq "o") {
    Write-Host "`n[5/6] Custom domain Azure`n" -ForegroundColor Yellow

    Write-Host "  NOTE: Azure F1 (Free) ne supporte PAS les custom domains." -ForegroundColor Red
    Write-Host "  api.memolib.space pointera vers Azure mais sans SSL Azure." -ForegroundColor Red
    Write-Host "  Le SSL sera gere par Vercel/Cloudflare en proxy.`n" -ForegroundColor Yellow
    Write-Host "  L'API reste accessible via: https://memolib-api.azurewebsites.net" -ForegroundColor Green
} else {
    Write-Host "`n[5/6] DNS skip - a configurer manuellement plus tard`n" -ForegroundColor Yellow
}

# ── 6. Verification ──────────────────────────────────────────

Write-Host "[6/6] Verification`n" -ForegroundColor Yellow

Write-Host "  Redemarrage de l'app..." -ForegroundColor Gray
az webapp restart --resource-group memolib-rg --name memolib-api 2>$null
Start-Sleep -Seconds 20

# Test API
Write-Host "  Test API..." -ForegroundColor Gray
try {
    $r = Invoke-WebRequest -Uri 'https://memolib-api.azurewebsites.net/health' -UseBasicParsing -TimeoutSec 60
    Write-Host "  Health check: HTTP $($r.StatusCode) OK!" -ForegroundColor Green
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "  Health check: HTTP $code" -ForegroundColor Red

    if ($code -eq 500) {
        Write-Host "`n  Telechargement des logs..." -ForegroundColor Gray
        Remove-Item './azure-logs.zip' -Force -ErrorAction SilentlyContinue
        Remove-Item './azure-logs' -Recurse -Force -ErrorAction SilentlyContinue
        az webapp log download --resource-group memolib-rg --name memolib-api --log-file './azure-logs.zip' 2>$null
        Expand-Archive -Path './azure-logs.zip' -DestinationPath './azure-logs' -Force
        $eventLog = Get-Content './azure-logs/LogFiles/eventlog.xml' -Raw -ErrorAction SilentlyContinue
        if ($eventLog -match 'Exception Info: (.+?)(?=</Data)') {
            Write-Host "  Erreur: $($Matches[1])" -ForegroundColor Red
        }
    }
}

# Test demo.html
try {
    $r = Invoke-WebRequest -Uri 'https://memolib-api.azurewebsites.net/demo.html' -UseBasicParsing -TimeoutSec 30
    Write-Host "  demo.html: HTTP $($r.StatusCode) ($($r.Content.Length) chars)" -ForegroundColor Green
} catch {
    Write-Host "  demo.html: ERREUR" -ForegroundColor Red
}

# Nettoyage
Remove-Item './publish' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item './memolib-deploy.zip' -Force -ErrorAction SilentlyContinue
Remove-Item './azure-logs.zip' -Force -ErrorAction SilentlyContinue
Remove-Item './azure-logs' -Recurse -Force -ErrorAction SilentlyContinue

# ── Resume ────────────────────────────────────────────────────

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESUME CONFIGURATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend (Vercel):" -ForegroundColor White
Write-Host "    https://memolib.space" -ForegroundColor Green
Write-Host ""
Write-Host "  API .NET (Azure F1):" -ForegroundColor White
Write-Host "    https://memolib-api.azurewebsites.net" -ForegroundColor Green
Write-Host "    https://memolib-api.azurewebsites.net/demo.html" -ForegroundColor Green
Write-Host "    https://memolib-api.azurewebsites.net/swagger" -ForegroundColor Green
Write-Host ""
Write-Host "  DB: Neon PostgreSQL (gratuit)" -ForegroundColor White
if ($redisUrl) {
    Write-Host "  Cache: Upstash Redis (gratuit)" -ForegroundColor White
}
Write-Host ""
Write-Host "  Cout total: ~1 EUR/mois (domaine)" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================`n" -ForegroundColor Cyan
