@echo off
echo ========================================
echo    APPLICATION EMAIL INCLUSIVE
echo ========================================
echo.
echo Interface adaptee pour personnes:
echo - Illettrees
echo - Sourdes et muettes  
echo - Avec difficultes de lecture/ecriture
echo.
echo Fonctionnalites:
echo - Interface 100%% visuelle (icones)
echo - Questions simples guidees
echo - Upload de documents
echo - Reconnaissance vocale
echo - Generation automatique d'emails
echo.
echo ========================================

cd /d "%~dp0"

echo Verification de Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Python n'est pas installe ou pas dans le PATH
    echo Veuillez installer Python depuis https://python.org
    pause
    exit /b 1
)

echo Installation des dependances...
pip install flask requests >nul 2>&1

echo.
echo Demarrage de l'application...
echo.
echo URL d'acces: http://127.0.0.1:5000/inclusive
echo.
echo Appuyez sur Ctrl+C pour arreter
echo ========================================

python run_inclusive.py

pause