param(
  [string]$Message,
  [switch]$Push
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Git {
  param([string[]]$Args)
  & git -C $repoRoot @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Commande git en echec: git $($Args -join ' ')"
  }
}

$status = & git -C $repoRoot status --porcelain
if ($LASTEXITCODE -ne 0) {
  throw 'Impossible de lire git status'
}

if ([string]::IsNullOrWhiteSpace(($status | Out-String))) {
  Write-Host 'Aucun changement a committer.'
  exit 0
}

if ([string]::IsNullOrWhiteSpace($Message)) {
  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $Message = "chore(versioning): snapshot $timestamp"
}

Write-Host 'Ajout de toutes les modifications...'
Invoke-Git -Args @('add', '-A')

Write-Host "Commit: $Message"
Invoke-Git -Args @('commit', '-m', $Message)

if ($Push) {
  Write-Host 'Push vers le remote...'
  Invoke-Git -Args @('push')
}

$hash = & git -C $repoRoot rev-parse --short HEAD
if ($LASTEXITCODE -ne 0) {
  throw 'Impossible de recuperer le hash du commit'
}

Write-Host "OK: commit cree -> $hash"
