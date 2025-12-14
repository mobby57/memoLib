@echo off
echo Demarrage SecureVault Accessible...
cd /d "%~dp0"
python -c "import sys; sys.path.append('src/accessibility'); from accessible_app import app; print('Application accessible demarree sur http://127.0.0.1:5001'); app.run(host='0.0.0.0', port=5001, debug=False)"
pause