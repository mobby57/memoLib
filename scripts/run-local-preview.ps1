param(
    [int]$PortStart = 8091,
    [int]$PortEnd = 8120,
    [string]$DatabaseFile = 'memolib.local.preview.db',
    [string]$JwtSecret = 'MEMOLIB_LOCAL_DEV_SECRET_2026_32_CHARS_MIN',
    [switch]$OpenBrowser
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

$selectedPort = $null
for ($port = $PortStart; $port -le $PortEnd; $port++) {
    $inUse = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $inUse) {
        $selectedPort = $port
        break
    }
}

if (-not $selectedPort) {
    throw "Aucun port libre trouvé entre $PortStart et $PortEnd."
}

$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = "http://localhost:$selectedPort"
$env:JwtSettings__SecretKey = $JwtSecret
$env:ConnectionStrings__Default = "Data Source=$DatabaseFile"
$env:DisableHttpsRedirection = 'true'

$apiProcess = Start-Process -FilePath 'dotnet' -ArgumentList '.\bin\Release\net9.0\MemoLib.Api.dll' -PassThru

$baseUrl = "http://localhost:$selectedPort"
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
    try {
        $health = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/health" -Method GET -TimeoutSec 2
        if ($health.StatusCode -eq 200) {
            $ready = $true
            break
        }
    }
    catch {
    }
    Start-Sleep -Milliseconds 500
}

if (-not $ready) {
    try { Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue } catch {}
    throw "API non joignable sur $baseUrl"
}

$distDir = Join-Path $projectDir 'dist'
if (-not (Test-Path $distDir)) {
    New-Item -Path $distDir -ItemType Directory | Out-Null
}

$sessionPath = Join-Path $distDir 'local-preview-session.json'
$session = [pscustomobject]@{
    startedAt = (Get-Date).ToString('o')
    pid = $apiProcess.Id
    port = $selectedPort
    baseUrl = $baseUrl
    database = $DatabaseFile
}
$session | ConvertTo-Json -Depth 4 | Set-Content -Path $sessionPath -Encoding UTF8

if ($OpenBrowser) {
    Start-Process "$baseUrl/health" | Out-Null
}

$session | ConvertTo-Json -Depth 4
Write-Host "Session: $sessionPath"
