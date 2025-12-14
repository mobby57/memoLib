@echo off
echo ========================================
echo   Installation Python + Dependances
echo ========================================

echo.
echo 1. Verification Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo Python non trouve. Installation automatique...
    
    echo Telechargement Python...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe' -OutFile 'python-installer.exe'"
    
    echo Installation Python...
    python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
    
    echo Nettoyage...
    del python-installer.exe
    
    echo Redemarrez votre terminal et relancez ce script
    pause
    exit /b 0
)

echo ✅ Python installe: 
python --version

echo.
echo 2. Mise a jour pip...
python -m pip install --upgrade pip

echo.
echo 3. Installation dependances SecureVault...
pip install flask flask-cors cryptography python-dotenv

echo.
echo ========================================
echo   Installation TERMINEE!
echo ========================================
echo.
echo Lancez maintenant: START_LOCAL.bat
echo.
pause