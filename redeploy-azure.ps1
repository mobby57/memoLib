#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Redéploie MemoLib rapidement (build + push + update)
.EXAMPLE
    .\redeploy-azure.ps1
#>

param(
    [string]$ResourceGroup = "memolib-rg",
    [string]$AppName = "memolib-api",
    [string]$AcrName = "memolibacr"
)

$ErrorActionPreference = "Stop"

$tag = Get-Date -Format "yyyyMMdd-HHmmss"
$acrServer = az acr show --name $AcrName --query loginServer -o tsv

Write-Host "🔨 Build & push..." -ForegroundColor Cyan
az acr build --registry $AcrName --image "${AppName}:${tag}" --image "${AppName}:latest" --file Dockerfile.azure .

Write-Host "🚀 Déploiement..." -ForegroundColor Cyan
az containerapp update `
    --resource-group $ResourceGroup `
    --name $AppName `
    --image "${acrServer}/${AppName}:${tag}"

$url = az containerapp show --resource-group $ResourceGroup --name $AppName --query "properties.configuration.ingress.fqdn" -o tsv
Write-Host "`n✅ Déployé: https://$url" -ForegroundColor Green
