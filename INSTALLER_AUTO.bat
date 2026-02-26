@echo off
echo ========================================
echo INSTALLATION AUTOMATIQUE - IA POSTE MANAGER
echo ========================================

echo.
echo [1/5] Verification Python...
python --version
if %errorlevel% neq 0 (
    echo ERREUR: Python non installe
    echo Telecharger Python depuis: https://python.org
    pause
    exit /b 1
)

echo.
echo [2/5] Creation environnement virtuel...
if exist venv (
    echo Environnement virtuel existe deja
) else (
    python -m venv venv
    echo Environnement virtuel cree
)

echo.
echo [3/5] Activation environnement virtuel...
call venv\Scripts\activate.bat

echo.
echo [4/5] Installation des dependances...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERREUR: Installation des dependances echouee
    pause
    exit /b 1
)

echo.
echo [5/5] Verification installation...
python audit_technologies_fixed.py
if %errorlevel% neq 0 (
    echo AVERTISSEMENT: Certaines dependances manquent encore
) else (
    echo Installation REUSSIE!
)

echo.
echo ========================================
echo INSTALLATION TERMINEE
echo ========================================
echo.
echo Pour lancer l'application:
echo 1. venv\Scripts\activate
echo 2. python app.py
echo 3. Ouvrir http://localhost:5000
echo.
echo Login: admin / admin123
echo.
pause