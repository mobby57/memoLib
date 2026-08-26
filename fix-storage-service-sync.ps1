$ErrorActionPreference = "Stop"

Write-Host "=== Correction API synchrone de storageService.ts ===" -ForegroundColor Cyan

$file = Join-Path $PWD "src\lib\services\storageService.ts"

if (-not (Test-Path -LiteralPath $file)) {
    throw "Fichier introuvable : $file"
}

$content = Get-Content -LiteralPath $file -Raw

# getStoredFiles : retirer async et Promise
$content = $content -replace `
    'export async function getStoredFiles\(', `
    'export function getStoredFiles('

$content = $content -replace `
    'Promise<StoredFile\[\]>\s*\{', `
    'StoredFile[] {'

# getFileVersions : retirer async et Promise
$content = $content -replace `
    'export async function getFileVersions\(', `
    'export function getFileVersions('

$content = $content -replace `
    'Promise<StoredFile\[\]>\s*\{', `
    'StoredFile[] {'

# getLatestVersion doit également être synchrone
$content = $content -replace `
    'export async function getLatestVersion\(', `
    'export function getLatestVersion('

$content = $content -replace `
    'Promise<number>\s*\{', `
    'number {'

# Dans uploadFile, getLatestVersion ne doit plus être await
$content = $content -replace `
    'await getLatestVersion\(options\.parentId\)', `
    'getLatestVersion(options.parentId)'

# Vérifier qu'il ne reste pas de Promise sur ces fonctions
Set-Content -LiteralPath $file -Value $content -Encoding UTF8

Write-Host "API synchronisée corrigée." -ForegroundColor Green

Write-Host ""
Write-Host "=== Vérification TypeScript ===" -ForegroundColor Cyan

npx tsc --noEmit

if ($LASTEXITCODE -ne 0) {
    throw "TypeScript a encore détecté des erreurs."
}

Write-Host ""
Write-Host "=== SUCCÈS ===" -ForegroundColor Green
Write-Host "storageService.ts est maintenant compatible avec documents/page.tsx"