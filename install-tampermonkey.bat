@echo off
echo ========================================
echo   INSTALLATION SCRIPTS TAMPERMONKEY
echo ========================================
echo.

echo Verification de Tampermonkey...
echo.
echo ETAPE 1: Installer Tampermonkey
echo - Chrome/Edge: https://www.tampermonkey.net/
echo - Firefox: https://addons.mozilla.org/firefox/addon/tampermonkey/
echo.
pause

echo.
echo ETAPE 2: Installation des scripts
echo.
echo Ouvrez Tampermonkey Dashboard et installez:
echo.
echo [1] Demo Automation          - tampermonkey\1-demo-automation.user.js
echo [2] Gmail Integration        - tampermonkey\2-gmail-integration.user.js
echo [3] Productivity Shortcuts   - tampermonkey\3-shortcuts.user.js
echo [4] Calendar Sync            - tampermonkey\4-calendar-sync.user.js
echo [5] OCR Helper               - tampermonkey\5-ocr-helper.user.js
echo [6] Client Portal UX         - tampermonkey\6-client-portal-ux.user.js
echo.
echo Methode rapide: Glisser-deposer chaque fichier .user.js dans Tampermonkey
echo.
pause

echo.
echo ETAPE 3: Verification
echo.
start http://localhost:5078/demo.html
echo.
echo Verifiez que vous voyez:
echo - Bouton "Demo Automatique" (en haut a droite)
echo - Icone clavier (en bas a droite)
echo - Bouton "Sync Calendar" (en bas a droite)
echo - Zone OCR (en bas a droite)
echo - Icone UX (en bas a droite)
echo.
echo Si vous ne voyez rien, verifiez que:
echo 1. Tampermonkey est installe et active
echo 2. Les scripts sont actives dans le Dashboard
echo 3. Vous etes sur http://localhost:5078/demo.html
echo.
pause

echo.
echo ========================================
echo   INSTALLATION TERMINEE !
echo ========================================
echo.
echo Scripts installes: 6/6
echo Documentation: tampermonkey\README.md
echo.
echo Appuyez sur ? pour voir les raccourcis clavier
echo.
pause
