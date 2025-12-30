@echo off
echo ========================================
echo DEMARRAGE IA POSTE MANAGER - VENV
echo ========================================

echo.
echo [1/5] Verification environnement virtuel...
if not exist venv (
    echo Creation environnement virtuel...
    python -m venv venv
) else (
    echo Environnement virtuel existant trouve
)

echo.
echo [2/5] Activation environnement virtuel...
call venv\Scripts\activate.bat

echo.
echo [3/5] Installation dependances...
pip install flask flask-cors python-dateutil

echo.
echo [4/5] Configuration environnement...
set CLIENT_ID=demo-cabinet
set CLIENT_NAME=Cabinet Demo
set SUBSCRIPTION_PLAN=professional
set CLIENT_COLOR=#3498db
set MAX_ANALYSIS_MONTHLY=500
set SECRET_KEY=demo-secret-key-12345
set DATA_DIR=./data

echo.
echo [5/5] Creation dossier data...
if not exist data mkdir data

echo.
echo ========================================
echo APPLICATION PRETE
echo ========================================
echo.
echo URL: http://localhost:5000
echo Login: admin / admin123
echo Client: %CLIENT_NAME%
echo Plan: %SUBSCRIPTION_PLAN%
echo.
echo Pour arreter: Ctrl+C
echo.

python flask_app_multitenant.py

pause