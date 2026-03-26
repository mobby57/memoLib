param(
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$hooksPath = Join-Path $repoRoot '.githooks'

if (-not (Test-Path $hooksPath)) {
  throw "Le dossier .githooks est introuvable: $hooksPath"
}

Write-Host 'Configuration des hooks Git versionnes...'

git -C $repoRoot config core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) {
  throw 'Impossible de configurer core.hooksPath'
}

if ($Force) {
  Write-Host 'Mode Force active: verification supplementaire ignoree.'
}

Write-Host 'OK: hooks actifs via .githooks'
Write-Host 'Verification: git config --get core.hooksPath'
