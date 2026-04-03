Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
  # Vérifier que ggshield est installé
  if (-not (Get-Command 'ggshield' -ErrorAction SilentlyContinue)) {
    Write-Warning '[security-scan-changed] ggshield non installe. Installer via: pip install ggshield'
    exit 1
  }

  # Gérer le cas d'un repo sans commit (HEAD inexistant)
  $hasHead = git rev-parse --verify HEAD 2>$null
  if ($LASTEXITCODE -eq 0) {
    $tracked = @(git diff --name-only --diff-filter=ACMR HEAD)
  } else {
    # Repo sans commit : tous les fichiers stagés
    $tracked = @(git diff --name-only --cached)
  }
  $untracked = @(git ls-files --others --exclude-standard)

  $paths = @($tracked + $untracked | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Sort-Object -Unique)

  if ($paths.Count -eq 0) {
    Write-Host '[security-scan-changed] Aucun fichier modifie a scanner.'
    exit 0
  }

  $existingFiles = @()
  foreach ($p in $paths) {
    if (Test-Path -LiteralPath $p -PathType Leaf) {
      $existingFiles += $p
    }
  }

  if ($existingFiles.Count -eq 0) {
    Write-Host '[security-scan-changed] Aucun fichier modifie scannable.'
    exit 0
  }

  Write-Host "[security-scan-changed] Scan de $($existingFiles.Count) fichier(s)..."
  # Utiliser $existingFiles (pas @existingFiles) pour éviter le splatting PowerShell
  & ggshield secret scan path $existingFiles --yes --use-gitignore

  if ($LASTEXITCODE -ne 0) {
    throw "ggshield a retourne le code $LASTEXITCODE"
  }

  Write-Host '[security-scan-changed] OK: aucun secret detecte.'
}
finally {
  Pop-Location
}
