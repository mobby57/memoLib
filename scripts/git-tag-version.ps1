param(
  [ValidateSet('patch', 'minor', 'major')]
  [string]$Bump = 'patch',
  [switch]$Push,
  [switch]$DryRun,
  [switch]$SkipPackageSync
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

function Get-WorkingTreeStatus {
  $status = & git -C $repoRoot status --porcelain
  if ($LASTEXITCODE -ne 0) {
    throw 'Impossible de lire l etat Git'
  }

  return ($status | Out-String).Trim()
}

function Invoke-Git {
  param([string[]]$GitArgs)

  $output = & git -C $repoRoot @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Commande git en echec: git $($GitArgs -join ' ')"
  }

  return $output
}

function Get-PackageVersion {
  $packageJsonPath = Join-Path $repoRoot 'package.json'
  $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
  if (-not $packageJson.version) {
    throw 'La version est absente de package.json'
  }

  return [Version]$packageJson.version
}

function Set-PackageVersion {
  param([Version]$Version)

  $packageJsonPath = Join-Path $repoRoot 'package.json'
  $packageJsonRaw = Get-Content -Path $packageJsonPath -Raw
  $updatedJson = [System.Text.RegularExpressions.Regex]::Replace(
    $packageJsonRaw,
    '("version"\s*:\s*")([^"]+)(")',
    ('$1' + $Version.ToString() + '$3'),
    1
  )

  if ($updatedJson -eq $packageJsonRaw) {
    throw 'Impossible de mettre a jour la version dans package.json'
  }

  Set-Content -Path $packageJsonPath -Value $updatedJson -NoNewline
}

function Get-NextVersion {
  param(
    [Version]$BaseVersion,
    [string]$BumpType
  )

  switch ($BumpType) {
    'major' { return [Version]::new($BaseVersion.Major + 1, 0, 0) }
    'minor' { return [Version]::new($BaseVersion.Major, $BaseVersion.Minor + 1, 0) }
    default { return [Version]::new($BaseVersion.Major, $BaseVersion.Minor, $BaseVersion.Build + 1) }
  }
}

function Test-TagExists {
  param([Version]$Version)

  $tagName = "v$($Version.ToString())"
  $existingTag = & git -C $repoRoot tag --list $tagName
  if ($LASTEXITCODE -ne 0) {
    throw 'Impossible de verifier les tags existants'
  }

  return -not [string]::IsNullOrWhiteSpace(($existingTag | Out-String).Trim())
}

$packageVersion = Get-PackageVersion
$workingTreeStatus = Get-WorkingTreeStatus
$explicitBump = $PSBoundParameters.ContainsKey('Bump')

if (-not [string]::IsNullOrWhiteSpace($workingTreeStatus)) {
  throw 'Le depot doit etre propre avant de creer un tag de version.'
}

if ($explicitBump) {
  $nextVersion = Get-NextVersion -BaseVersion $packageVersion -BumpType $Bump
}
else {
  $nextVersion = $packageVersion
  while (Test-TagExists -Version $nextVersion) {
    $nextVersion = Get-NextVersion -BaseVersion $nextVersion -BumpType 'patch'
  }
}

$tagName = "v$($nextVersion.ToString())"
$packageWillChange = (-not $SkipPackageSync) -and ($packageVersion -ne $nextVersion)

if (Test-TagExists -Version $nextVersion) {
  throw "Le tag existe deja: $tagName"
}

if ($DryRun) {
  if ($packageWillChange) {
    Write-Host "Dry run: package.json sera synchronise vers $($nextVersion.ToString())"
  }
  Write-Host "Dry run: prochain tag -> $tagName"
  exit 0
}

if ($packageWillChange) {
  Set-PackageVersion -Version $nextVersion
  Invoke-Git -GitArgs @('add', 'package.json') | Out-Null
  Invoke-Git -GitArgs @('commit', '-m', "chore(release): bump version to $tagName") | Out-Null
  Write-Host "Version package synchronisee: $tagName"
}

Invoke-Git -GitArgs @('tag', '-a', $tagName, '-m', "Release $tagName") | Out-Null
Write-Host "Tag cree: $tagName"

if ($Push) {
  if ($packageWillChange) {
    Invoke-Git -GitArgs @('push', 'origin', 'HEAD') | Out-Null
    Write-Host 'Commit de release pousse vers origin'
  }
  Invoke-Git -GitArgs @('push', 'origin', $tagName) | Out-Null
  Write-Host "Tag pousse vers origin: $tagName"
}
