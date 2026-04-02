Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
  $tracked = @(git diff --name-only --diff-filter=ACMR HEAD)
  $untracked = @(git ls-files --others --exclude-standard)

  $paths = @($tracked + $untracked | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Sort-Object -Unique)

  if ($paths.Count -eq 0) {
    Write-Host '[security-scan-changed] Aucun fichier modifie a scanner.'
    exit 0
  }

  $existingFiles = @()
  foreach ($path in $paths) {
    if (Test-Path -LiteralPath $path -PathType Leaf) {
      $existingFiles += $path
    }
  }

  if ($existingFiles.Count -eq 0) {
    Write-Host '[security-scan-changed] Aucun fichier modifie scannable.'
    exit 0
  }

  Write-Host "[security-scan-changed] Scan de $($existingFiles.Count) fichier(s)..."
  & ggshield secret scan path @existingFiles --yes --use-gitignore

  if ($LASTEXITCODE -ne 0) {
    throw "ggshield a retourne le code $LASTEXITCODE"
  }

  Write-Host '[security-scan-changed] OK: aucun secret detecte.'
}
finally {
  Pop-Location
}
