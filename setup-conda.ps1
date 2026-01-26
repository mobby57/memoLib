# Setup Conda Environment
# IA Poste Manager - Python Backend

$ErrorActionPreference = "Stop"
$envName = "iapostemanager"
$pythonVersion = "3.11"

Write-Output ""
Write-Output "========================================"
Write-Output "  SETUP CONDA ENVIRONMENT"
Write-Output "  IA Poste Manager"
Write-Output "========================================"
Write-Output ""

# Verifier Conda
Write-Output "[1/5] Verification Conda..."
try {
    $condaVersion = conda --version
    Write-Output "   [OK] $condaVersion"
} catch {
    Write-Output "   [ERREUR] Conda non installe!"
    Write-Output ""
    Write-Output "   Installez Miniconda ou Anaconda:"
    Write-Output "   https://docs.conda.io/en/latest/miniconda.html"
    exit 1
}

# Verifier si l'environnement existe
Write-Output ""
Write-Output "[2/5] Verification environnement existant..."
$envExists = conda env list | Select-String $envName
if ($envExists) {
    Write-Output "   [INFO] Environnement '$envName' existe deja"
    
    $choice = Read-Host "   Supprimer et recreer? (o/N)"
    if ($choice -eq "o" -or $choice -eq "O") {
        Write-Output "   [INFO] Suppression de l'environnement..."
        conda env remove -n $envName -y
    } else {
        Write-Output "   [INFO] Conservation de l'environnement existant"
        Write-Output "   [INFO] Mise a jour des packages..."
        conda activate $envName
        goto UPDATE_PACKAGES
    }
}

# Creer l'environnement
Write-Output ""
Write-Output "[3/5] Creation de l'environnement..."
Write-Output "   Python version: $pythonVersion"

conda create -n $envName python=$pythonVersion -y
if ($LASTEXITCODE -ne 0) {
    Write-Output "   [ERREUR] Echec de la creation"
    exit 1
}
Write-Output "   [OK] Environnement cree"

# Activer l'environnement
Write-Output ""
Write-Output "[4/5] Activation de l'environnement..."
conda activate $envName
if ($LASTEXITCODE -ne 0) {
    Write-Output "   [ERREUR] Echec de l'activation"
    exit 1
}
Write-Output "   [OK] Environnement active"

:UPDATE_PACKAGES
# Installer les packages
Write-Output ""
Write-Output "[5/5] Installation des packages..."
Write-Output ""

# Packages principaux
$packages = @(
    "fastapi",
    "uvicorn[standard]",
    "python-dotenv",
    "pydantic",
    "httpx",
    "aiohttp",
    "sqlalchemy",
    "asyncpg",
    "redis",
    "celery",
    "python-jose[cryptography]",
    "passlib[bcrypt]",
    "python-multipart",
    "jinja2",
    "pytest",
    "pytest-asyncio",
    "requests"
)

foreach ($pkg in $packages) {
    Write-Output "   [INFO] Installation: $pkg"
    pip install $pkg --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Output "      [OK]"
    } else {
        Write-Output "      [WARN] Echec (non critique)"
    }
}

# Packages optionnels (IA)
Write-Output ""
Write-Output "   [INFO] Packages IA (optionnels)..."

$optionalPackages = @(
    "numpy",
    "pandas",
    "scikit-learn",
    "transformers",
    "torch"
)

foreach ($pkg in $optionalPackages) {
    Write-Output "   [INFO] Installation: $pkg"
    pip install $pkg --quiet 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Output "      [OK]"
    } else {
        Write-Output "      [SKIP] (optionnel)"
    }
}

# Resume
Write-Output ""
Write-Output "========================================"
Write-Output "  INSTALLATION TERMINEE"
Write-Output "========================================"
Write-Output ""
Write-Output "Environnement: $envName"
Write-Output ""
Write-Output "Commandes utiles:"
Write-Output "  Activer:    conda activate $envName"
Write-Output "  Desactiver: conda deactivate"
Write-Output "  Supprimer:  conda env remove -n $envName"
Write-Output ""
Write-Output "Pour demarrer le backend:"
Write-Output "  .\start-python-backend.ps1"
Write-Output ""
