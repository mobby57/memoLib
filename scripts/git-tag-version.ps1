param(
  [ValidateSet('patch', 'minor', 'major')]
  [string]$Bump = 'patch',
  [switch]$Push,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Git {
  param([string[]]$GitArgs)

  $output = & git -C $repoRoot @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Commande git en echec: git $($GitArgs -join ' ')"
  }

  return $output
}

function Get-LatestSemanticTag {
  $tags = Invoke-Git -GitArgs @('tag', '--list', 'v*.*.*')
  $versions = @()

  foreach ($tag in $tags) {
    if ($tag -match '^v(\d+)\.(\d+)\.(\d+)$') {
      $versions += [PSCustomObject]@{
        Tag = $tag
        Version = [Version]::new([int]$Matches[1], [int]$Matches[2], [int]$Matches[3])
      }
    }
  }

  return $versions | Sort-Object Version -Descending | Select-Object -First 1
}

function Get-PackageVersion {
  $packageJsonPath = Join-Path $repoRoot 'package.json'
  $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
  if (-not $packageJson.version) {
    throw 'La version est absente de package.json'
  }

  return [Version]$packageJson.version
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

$latestTag = Get-LatestSemanticTag
$packageVersion = Get-PackageVersion

if ($null -eq $latestTag) {
  $nextVersion = $packageVersion
}
elseif ($packageVersion -gt $latestTag.Version) {
  $nextVersion = $packageVersion
}
else {
  $nextVersion = Get-NextVersion -BaseVersion $latestTag.Version -BumpType $Bump
}

$tagName = "v$($nextVersion.ToString())"

$existingTag = & git -C $repoRoot tag --list $tagName
if ($LASTEXITCODE -ne 0) {
  throw 'Impossible de verifier les tags existants'
}

if ($existingTag) {
  throw "Le tag existe deja: $tagName"
}

if ($DryRun) {
  Write-Host "Dry run: prochain tag -> $tagName"
  exit 0
}

Invoke-Git -GitArgs @('tag', '-a', $tagName, '-m', "Release $tagName") | Out-Null
Write-Host "Tag cree: $tagName"

if ($Push) {
  Invoke-Git -GitArgs @('push', 'origin', $tagName) | Out-Null
  Write-Host "Tag pousse vers origin: $tagName"
}
