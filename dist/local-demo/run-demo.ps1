$ErrorActionPreference = 'Stop'

$candidatePorts = 8091..8100
$selectedPort = $null

foreach ($port in $candidatePorts) {
  $inUse = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $inUse) {
    $selectedPort = $port
    break
  }
}

if (-not $selectedPort) {
  throw 'Aucun port libre trouvÃ© entre 8091 et 8100.'
}

$env:ASPNETCORE_ENVIRONMENT = 'Production'
$env:ASPNETCORE_URLS = "http://localhost:$selectedPort"
$env:JwtSettings__SecretKey = 'MEMOLIB_LOCAL_DEMO_SECRET_2026_32_CHARS_MIN'
$env:DisableHttpsRedirection = 'true'

$dbDir = Join-Path $env:LOCALAPPDATA 'MemoLib'
if (-not (Test-Path $dbDir)) {
  New-Item -ItemType Directory -Path $dbDir | Out-Null
}

$env:ConnectionStrings__Default = "Data Source=$dbDir\\memolib.demo.db"

Write-Host "MemoLib demo: http://localhost:$selectedPort"
Start-Process "http://localhost:$selectedPort/health"

& .\MemoLib.Api.exe
