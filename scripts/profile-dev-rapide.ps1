$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-and-preview.ps1 -SkipMigrations -OpenBrowser
