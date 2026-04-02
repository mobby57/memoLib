param(
    [switch]$SkipMigrations,
    [switch]$StopAfterTest,
    [switch]$OpenBrowser
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

Write-Host '==> 1/4 predeploy local gate'
$preArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', '.\scripts\predeploy-local.ps1'
)
if ($SkipMigrations) {
    $preArgs += '-SkipMigrations'
}

powershell @preArgs
if ($LASTEXITCODE -ne 0) {
    throw 'predeploy-local a échoué.'
}

Write-Host '==> 2/4 start local preview'
$runArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', '.\scripts\run-local-preview.ps1'
)
if ($OpenBrowser -and -not $StopAfterTest) {
    $runArgs += '-OpenBrowser'
}

powershell @runArgs
if ($LASTEXITCODE -ne 0) {
    throw 'run-local-preview a échoué.'
}

Write-Host '==> 3/4 auto local flow test'
powershell -ExecutionPolicy Bypass -File .\scripts\auto-local-flow.ps1
if ($LASTEXITCODE -ne 0) {
    throw 'auto-local-flow a échoué.'
}

Write-Host '==> 4/4 done'
$sessionPath = Join-Path $projectDir 'dist\local-preview-session.json'
$session = Get-Content -Raw -Path $sessionPath | ConvertFrom-Json

$stopStatus = 'RUNNING'
if ($StopAfterTest) {
    Write-Host '==> auto-stop preview'
    powershell -ExecutionPolicy Bypass -File .\scripts\stop-local-preview.ps1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'stop-local-preview a échoué.'
    }
    $stopStatus = 'STOPPED'
}

[pscustomobject]@{
    status = 'READY_FOR_PREDEPLOY'
    baseUrl = $session.baseUrl
    previewStatus = $stopStatus
    sessionFile = $sessionPath
    reportFile = (Join-Path $projectDir 'dist\predeploy-local-report.json')
} | ConvertTo-Json -Depth 4
