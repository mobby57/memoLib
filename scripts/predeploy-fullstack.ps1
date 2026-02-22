param(
    [string]$FrontendRoot = 'c:\Users\moros\Desktop\memolib',
    [ValidateSet('type-check','build-fast','skip')]
    [string]$FrontendProfile = 'type-check',
    [switch]$SkipMigrations
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

$startedAt = (Get-Date).ToString('o')

Write-Host '==> FULLSTACK 1/2: backend predeploy gate'
$preArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', '.\scripts\predeploy-local.ps1'
)
if ($SkipMigrations) {
    $preArgs += '-SkipMigrations'
}

$backendStatus = 'FAIL'
$frontendStatus = 'FAIL'

try {
    powershell @preArgs
    if ($LASTEXITCODE -ne 0) {
        throw 'predeploy-local failed'
    }
    $backendStatus = 'PASS'
}
catch {
    $backendStatus = 'FAIL'
}

Write-Host '==> FULLSTACK 2/2: frontend type-check'
$frontendOutput = ''
if ($FrontendProfile -eq 'skip') {
    $frontendStatus = 'SKIPPED'
    $frontendOutput = 'Frontend check skipped by profile.'
}
elseif (Test-Path $FrontendRoot) {
    try {
        Push-Location $FrontendRoot
        try {
            if ($FrontendProfile -eq 'build-fast') {
                $frontendOutput = npm run build:fast 2>&1 | Out-String
            }
            else {
                $frontendOutput = npm run type-check 2>&1 | Out-String
            }

            if ($LASTEXITCODE -eq 0) {
                $frontendStatus = 'PASS'
            }
            else {
                $frontendStatus = 'FAIL'
            }
        }
        finally {
            Pop-Location
        }
    }
    catch {
        $frontendStatus = 'FAIL'
        $frontendOutput = $_.Exception.Message
    }
}
else {
    $frontendStatus = 'SKIPPED'
    $frontendOutput = "Frontend root introuvable: $FrontendRoot"
}

$overall = if ($backendStatus -eq 'PASS' -and $frontendStatus -eq 'PASS') { 'PASS' } else { 'FAIL' }

if ($backendStatus -eq 'PASS' -and $frontendStatus -eq 'SKIPPED') {
    $overall = 'PASS_BACKEND_ONLY'
}

$report = [pscustomobject]@{
    status = $overall
    scope = 'predeploy-fullstack-before-vercel'
    startedAt = $startedAt
    finishedAt = (Get-Date).ToString('o')
    backend = $backendStatus
    frontendTypeCheck = $frontendStatus
    frontendProfile = $FrontendProfile
    frontendRoot = $FrontendRoot
    frontendOutputTail = (($frontendOutput -split "`n") | Select-Object -Last 30) -join "`n"
    backendReportFile = (Join-Path $projectDir 'dist\predeploy-local-report.json')
}

$distDir = Join-Path $projectDir 'dist'
if (-not (Test-Path $distDir)) {
    New-Item -Path $distDir -ItemType Directory | Out-Null
}

$frontendLogPath = Join-Path $distDir 'predeploy-fullstack-frontend.log'
Set-Content -Path $frontendLogPath -Value $frontendOutput -Encoding UTF8

$reportPath = Join-Path $distDir 'predeploy-fullstack-report.json'
$report | ConvertTo-Json -Depth 6 | Set-Content -Path $reportPath -Encoding UTF8

$report | ConvertTo-Json -Depth 6
Write-Host "Report: $reportPath"

if ($overall -eq 'FAIL') {
    exit 1
}
