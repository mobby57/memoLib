# Installation de curl sur Windows
# Script automatique avec plusieurs méthodes

Write-Host "`n🔧 INSTALLATION CURL`n" -ForegroundColor Cyan

# Vérifier si curl existe déjà
Write-Host "📋 Vérification de curl existant..." -ForegroundColor Yellow
$curlPath = Get-Command curl.exe -ErrorAction SilentlyContinue

if ($curlPath) {
    Write-Host "✅ curl.exe déjà installé: $($curlPath.Source)" -ForegroundColor Green
    curl.exe --version
    Write-Host "`nℹ️  Utilisez 'curl.exe' au lieu de 'curl' dans PowerShell" -ForegroundColor Cyan
    exit 0
}

Write-Host "❌ curl.exe non trouvé dans PATH" -ForegroundColor Red
Write-Host "`n🚀 Installation en cours...`n" -ForegroundColor Yellow

# Méthode 1: Winget (Windows 10/11 moderne)
Write-Host "Méthode 1: Tentative via winget..." -ForegroundColor Cyan
try {
    $winget = Get-Command winget -ErrorAction Stop
    Write-Host "✅ winget disponible" -ForegroundColor Green
    
    Write-Host "Installation de curl..." -ForegroundColor Yellow
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    
    # Git for Windows inclut curl
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    $curlPath = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curlPath) {
        Write-Host "`n✅ CURL INSTALLÉ AVEC SUCCÈS!" -ForegroundColor Green
        curl.exe --version
        exit 0
    }
} catch {
    Write-Host "⚠️  winget non disponible" -ForegroundColor Yellow
}

# Méthode 2: Chocolatey
Write-Host "`nMéthode 2: Tentative via Chocolatey..." -ForegroundColor Cyan
try {
    $choco = Get-Command choco -ErrorAction Stop
    Write-Host "✅ Chocolatey disponible" -ForegroundColor Green
    
    choco install curl -y
    
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    $curlPath = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curlPath) {
        Write-Host "`n✅ CURL INSTALLÉ AVEC SUCCÈS!" -ForegroundColor Green
        curl.exe --version
        exit 0
    }
} catch {
    Write-Host "⚠️  Chocolatey non disponible" -ForegroundColor Yellow
    Write-Host "   Installer Chocolatey: https://chocolatey.org/install" -ForegroundColor Gray
}

# Méthode 3: Téléchargement direct
Write-Host "`nMéthode 3: Téléchargement direct depuis curl.se..." -ForegroundColor Cyan

$curlUrl = "https://curl.se/windows/dl-8.5.0_3/curl-8.5.0_3-win64-mingw.zip"
$downloadPath = "$env:TEMP\curl.zip"
$extractPath = "$env:ProgramFiles\curl"

try {
    Write-Host "Téléchargement..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $curlUrl -OutFile $downloadPath
    
    Write-Host "Extraction..." -ForegroundColor Yellow
    Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
    
    # Ajouter au PATH
    $curlBinPath = Join-Path $extractPath "curl-8.5.0_3-win64-mingw\bin"
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    
    if ($currentPath -notlike "*$curlBinPath*") {
        Write-Host "Ajout au PATH système..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$curlBinPath", "Machine")
        $env:Path += ";$curlBinPath"
    }
    
    # Nettoyage
    Remove-Item $downloadPath -Force
    
    Write-Host "`n✅ CURL INSTALLÉ AVEC SUCCÈS!" -ForegroundColor Green
    Write-Host "📍 Emplacement: $curlBinPath" -ForegroundColor Cyan
    Write-Host "`n⚠️  IMPORTANT: Redémarrez PowerShell pour utiliser curl.exe" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ Échec du téléchargement direct" -ForegroundColor Red
    Write-Host "Erreur: $_" -ForegroundColor Red
}

Write-Host "`n📝 INSTALLATION MANUELLE (si tout a échoué):" -ForegroundColor Yellow
Write-Host "   1. Téléchargez: https://curl.se/windows/" -ForegroundColor White
Write-Host "   2. Extrayez dans C:\Program Files\curl" -ForegroundColor White
Write-Host "   3. Ajoutez au PATH: C:\Program Files\curl\bin" -ForegroundColor White
Write-Host "`n   OU" -ForegroundColor Cyan
Write-Host "   Installez Git for Windows (inclut curl):" -ForegroundColor White
Write-Host "   https://git-scm.com/download/win" -ForegroundColor Gray
Write-Host ""
