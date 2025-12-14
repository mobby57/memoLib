@echo off
echo ========================================
echo   SecureVault - Demarrage LOCAL (sans Docker)
echo ========================================

echo.
echo 1. Verification Python...
python --version
if errorlevel 1 (
    echo ❌ Python non installe
    echo Installez Python depuis https://python.org
    pause
    exit /b 1
)
echo ✅ Python OK

echo.
echo 2. Installation dependances...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Erreur installation dependances
    pause
    exit /b 1
)
echo ✅ Dependances OK

echo.
echo 3. Creation dossiers...
if not exist "data" mkdir data
if not exist "logs" mkdir logs
echo ✅ Dossiers OK

echo.
echo 4. Demarrage application...
echo ========================================
echo   SecureVault DEMARRE!
echo ========================================
echo.
echo 🌐 Ouvrez: http://localhost:5000
echo.
echo Pour arreter: Ctrl+C
echo.

python app_simple.py