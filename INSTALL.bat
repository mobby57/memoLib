@echo off
echo ========================================
echo INSTALLATION IA POSTE MANAGER v3.0
echo ========================================
echo.

REM Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python n'est pas installe ou pas dans le PATH
    echo Telechargez Python depuis https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python detecte
echo.

REM Créer environnement virtuel
echo [1/4] Creation de l'environnement virtuel...
if not exist "venv" (
    python -m venv venv
    echo [OK] Environnement virtuel cree
) else (
    echo [INFO] Environnement virtuel existe deja
)
echo.

REM Activer environnement virtuel
echo [2/4] Activation de l'environnement virtuel...
call venv\Scripts\activate.bat
echo [OK] Environnement virtuel active
echo.

REM Installer dépendances
echo [3/4] Installation des dependances...
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERREUR] L'installation des dependances a echoue
    pause
    exit /b 1
)
echo [OK] Dependances installees
echo.

REM Vérifier installation
echo [4/4] Verification de l'installation...
python test_installation.py
if errorlevel 1 (
    echo.
    echo [ERREUR] La verification a detecte des problemes
    pause
    exit /b 1
)

echo.
echo ========================================
echo INSTALLATION TERMINEE AVEC SUCCES!
echo ========================================
echo.
echo Pour lancer l'application:
echo   1. Activez l'environnement: venv\Scripts\activate
echo   2. Lancez l'app: python app.py
echo   3. Ouvrez: http://localhost:5000/login
echo.
echo Compte demo: admin / admin123
echo.
pause
