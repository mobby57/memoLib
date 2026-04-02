param(
    [switch]$SkipMigrations
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

$startedAt = (Get-Date).ToString('o')

Write-Host '==> PREDEPLOY LOCAL: vérification outillage'
$dotnetVersion = (& dotnet --version).Trim()
if ([string]::IsNullOrWhiteSpace($dotnetVersion)) {
    throw 'dotnet SDK introuvable.'
}

Write-Host '==> PREDEPLOY LOCAL: build + smoke + package'
$goAllArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', '.\scripts\go-all.ps1',
    '-SkipPublish'
)

if ($SkipMigrations) {
    $goAllArgs += '-SkipMigrations'
}

$goAllOutput = powershell @goAllArgs
if ($LASTEXITCODE -ne 0) {
    throw 'go-all -SkipPublish a échoué.'
}

Write-Host '==> PREDEPLOY LOCAL: vérification artefacts'
$distDir = Join-Path $projectDir 'dist'
$latestZip = Join-Path $distDir 'memolib-local-demo-latest.zip'
$latestSha = Join-Path $distDir 'memolib-local-demo-latest.sha256.txt'
$demoExe = Join-Path $distDir 'local-demo\MemoLib.Api.exe'
$runBat = Join-Path $distDir 'local-demo\run-demo.bat'

$zipExists = Test-Path $latestZip
$shaExists = Test-Path $latestSha
$exeExists = Test-Path $demoExe
$runBatExists = Test-Path $runBat

if (-not ($zipExists -and $shaExists -and $exeExists -and $runBatExists)) {
    throw 'Artefacts de déploiement incomplets.'
}

$zipHash = (Get-FileHash -Path $latestZip -Algorithm SHA256).Hash
$finishedAt = (Get-Date).ToString('o')

$report = [pscustomobject]@{
    status = 'PASS'
    scope = 'predeploy-local-before-vercel'
    startedAt = $startedAt
    finishedAt = $finishedAt
    dotnetVersion = $dotnetVersion
    zip = $latestZip
    zipSha256 = $zipHash
    shaFile = $latestSha
    demoExe = $demoExe
    runScript = $runBat
    migrationsSkipped = [bool]$SkipMigrations
}

$reportPath = Join-Path $distDir 'predeploy-local-report.json'
$report | ConvertTo-Json -Depth 5 | Set-Content -Path $reportPath -Encoding UTF8

$report | ConvertTo-Json -Depth 5
Write-Host "Rapport: $reportPath"
