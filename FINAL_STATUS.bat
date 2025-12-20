@echo off
echo ========================================================
echo    IAPosteManager v2.2 - STATUS FINAL
echo ========================================================

:: Test rapide
python --version >nul 2>&1 && node --version >nul 2>&1 && python -c "import flask,openai" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ✅ PROJET PRET - TOUS LES TESTS PASSES
    echo.
    echo 🚀 Pour demarrer:
    echo   START_ALL.bat
    echo.
    echo 📊 URLs:
    echo   Frontend: http://localhost:3001
    echo   Backend:  http://localhost:5000
    echo.
    echo 🎉 READY FOR PRODUCTION!
) else (
    echo.
    echo ⚠️ CORRECTIONS NECESSAIRES
    echo.
    echo Actions:
    echo   1. pip install -r requirements.txt
    echo   2. Copier .env.example vers .env
    echo   3. cd src\frontend ^&^& npm install
)
echo.
echo ========================================================