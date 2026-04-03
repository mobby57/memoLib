Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host '[validate-integration] Lancement tests integration...'
Push-Location $repoRoot
try {
  & npm run test:integration
  if ($LASTEXITCODE -ne 0) {
    throw 'Les tests integration ont echoue.'
  }
  Write-Host '[validate-integration] OK: tests integration passes.'
}
finally {
  Pop-Location
}
