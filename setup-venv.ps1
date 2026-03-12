# Configuration environnement virtuel Python pour MemoLib
Write-Host "🐍 Configuration environnement virtuel Python..." -ForegroundColor Cyan

# Créer venv
python -m venv venv

# Activer venv
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip setuptools wheel

# Installer dépendances Python
pip install -r ai-service\requirements.txt

Write-Host "✅ Environnement virtuel configuré" -ForegroundColor Green
Write-Host "Pour activer: .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
