param(
    [switch]$SkipTypeCheck
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not $SkipTypeCheck) {
    Write-Host '[safe-build] Type checking...' -ForegroundColor Cyan
    npm.cmd run type-check
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

Write-Host '[safe-build] Building Next.js...' -ForegroundColor Cyan
npm.cmd run build
exit $LASTEXITCODE
