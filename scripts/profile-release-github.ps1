param(
    [string]$Owner = 'mobby57',
    [string]$Repo = 'memoLib'
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

$env:GITHUB_TOKEN = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN', 'User')
if ([string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) {
    throw 'GITHUB_TOKEN non défini côté utilisateur.'
}

powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -Owner $Owner -Repo $Repo -PublishStable -PromoteStableFromDaily
