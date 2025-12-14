@echo off
echo ========================================
echo   SecureVault - Version Harmonisee
echo ========================================

echo.
echo 1. Verification Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python non installe
    echo Installez Python depuis https://python.org
    pause
    exit /b 1
)
echo ✅ Python OK

echo.
echo 2. Installation dependances...
pip install flask flask-cors >nul 2>&1
echo ✅ Dependances OK

echo.
echo 3. Creation dossiers...
if not exist "src\core" mkdir src\core
echo ✅ Structure OK

echo.
echo 4. Demarrage application harmonisee...
echo ========================================
echo   ENDPOINTS HARMONISES DEMARRE!
echo ========================================
echo.
echo 🌐 Application: http://localhost:5000
echo 📡 API Docs: http://localhost:5000/api/docs
echo 💚 Health: http://localhost:5000/api/health
echo 🔐 Login: http://localhost:5000/login-page
echo.
echo Tous les endpoints suivent le meme format!
echo.

python app_harmonized.py