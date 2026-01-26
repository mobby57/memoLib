# Installation de curl pour Windows
# IA Poste Manager

Write-Output "========================================"
Write-Output "  INSTALLATION CURL"
Write-Output "========================================"
Write-Output ""

# Verifier si curl est deja installe
$curlPath = Get-Command curl -ErrorAction SilentlyContinue

if ($curlPath) {
    Write-Output "[OK] curl est deja installe:"
    Write-Output "   Path: $($curlPath.Source)"
    curl --version | Select-Object -First 1
    exit 0
}

Write-Output "[INFO] curl non trouve. Installation..."
Write-Output ""

# Methode 1: Via winget (Windows 10/11)
Write-Output "[1] Tentative via winget..."
try {
    winget install cURL.cURL --silent --accept-package-agreements
    if ($LASTEXITCODE -eq 0) {
        Write-Output "[OK] curl installe via winget"
        exit 0
    }
} catch {
    Write-Output "[WARN] winget non disponible"
}

# Methode 2: Via chocolatey
Write-Output ""
Write-Output "[2] Tentative via Chocolatey..."
if (Get-Command choco -ErrorAction SilentlyContinue) {
    try {
        choco install curl -y
        if ($LASTEXITCODE -eq 0) {
            Write-Output "[OK] curl installe via Chocolatey"
            exit 0
        }
    } catch {
        Write-Output "[WARN] Echec Chocolatey"
    }
} else {
    Write-Output "[WARN] Chocolatey non installe"
}

# Methode 3: Telechargement manuel
Write-Output ""
Write-Output "[3] Telechargement manuel..."

$curlVersion = "8.5.0"
$downloadUrl = "https://curl.se/windows/dl-$curlVersion/curl-$curlVersion-win64-mingw.zip"
$tempDir = "$env:TEMP\curl-install"
$installDir = "$env:ProgramFiles\curl"

try {
    # Creer dossier temp
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Telecharger
    Write-Output "[INFO] Telechargement de curl $curlVersion..."
    Invoke-WebRequest -Uri $downloadUrl -OutFile "$tempDir\curl.zip"
    
    # Extraire
    Write-Output "[INFO] Extraction..."
    Expand-Archive -Path "$tempDir\curl.zip" -DestinationPath $tempDir -Force
    
    # Installer
    Write-Output "[INFO] Installation dans $installDir..."
    $extractedFolder = Get-ChildItem -Path $tempDir -Directory | Select-Object -First 1
    
    if (-not (Test-Path $installDir)) {
        New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    }
    
    Copy-Item -Path "$($extractedFolder.FullName)\bin\*" -Destination $installDir -Recurse -Force
    
    # Ajouter au PATH
    Write-Output "[INFO] Ajout au PATH..."
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$installDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "Machine")
        Write-Output "[OK] PATH mis a jour"
    }
    
    # Nettoyer
    Remove-Item -Path $tempDir -Recurse -Force
    
    Write-Output ""
    Write-Output "[OK] curl installe avec succes!"
    Write-Output "[INFO] Redemarrez votre terminal pour utiliser curl"
    
} catch {
    Write-Output "[ERREUR] Echec de l'installation: $_"
    Write-Output ""
    Write-Output "Alternative: Telecharger manuellement depuis:"
    Write-Output "  https://curl.se/windows/"
    exit 1
}
