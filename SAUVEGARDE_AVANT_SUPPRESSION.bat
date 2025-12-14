@echo off
echo ========================================
echo    SAUVEGARDE AVANT SUPPRESSION
echo ========================================
echo.
echo Creation d'une sauvegarde des elements essentiels...
echo.

REM Créer dossier de sauvegarde avec timestamp
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set timestamp=%timestamp: =0%
set backup_dir=BACKUP_ESSENTIEL_%timestamp%

mkdir "%backup_dir%"
echo ✅ Dossier de sauvegarde cree: %backup_dir%

REM Sauvegarder les elements essentiels
echo.
echo === SAUVEGARDE EN COURS ===

echo [1/8] Sauvegarde src/...
if exist "src" (
    xcopy "src" "%backup_dir%\src\" /E /I /Q
    echo ✅ src/ sauvegarde
)

echo [2/8] Sauvegarde templates/...
if exist "templates" (
    xcopy "templates" "%backup_dir%\templates\" /E /I /Q
    echo ✅ templates/ sauvegarde
)

echo [3/8] Sauvegarde static/...
if exist "static" (
    xcopy "static" "%backup_dir%\static\" /E /I /Q
    echo ✅ static/ sauvegarde
)

echo [4/8] Sauvegarde docs/ essentiels...
if exist "docs" (
    xcopy "docs" "%backup_dir%\docs\" /E /I /Q
    echo ✅ docs/ sauvegarde
)

echo [5/8] Sauvegarde tests/ unitaires...
if exist "tests" (
    xcopy "tests" "%backup_dir%\tests\" /E /I /Q
    echo ✅ tests/ sauvegarde
)

echo [6/8] Sauvegarde donnees chiffrees...
if exist "data\credentials.enc" copy "data\credentials.enc" "%backup_dir%\"
if exist "data\salt.bin" copy "data\salt.bin" "%backup_dir%\"
if exist "data\metadata.json" copy "data\metadata.json" "%backup_dir%\"
if exist "data\*.db" copy "data\*.db" "%backup_dir%\"
echo ✅ Donnees chiffrees sauvegardees

echo [7/8] Sauvegarde configuration...
if exist ".env" copy ".env" "%backup_dir%\"
if exist ".env.example" copy ".env.example" "%backup_dir%\"
if exist "requirements.txt" copy "requirements.txt" "%backup_dir%\"
if exist "package.json" copy "package.json" "%backup_dir%\"
if exist "docker-compose.yml" copy "docker-compose.yml" "%backup_dir%\"
echo ✅ Configuration sauvegardee

echo [8/8] Sauvegarde documentation principale...
if exist "README.md" copy "README.md" "%backup_dir%\"
if exist "ANALYSE_COMPLETE_PROJETS.md" copy "ANALYSE_COMPLETE_PROJETS.md" "%backup_dir%\"
if exist "STRUCTURE_FINALE_OPTIMISEE.md" copy "STRUCTURE_FINALE_OPTIMISEE.md" "%backup_dir%\"
echo ✅ Documentation principale sauvegardee

echo.
echo ========================================
echo        SAUVEGARDE TERMINEE
echo ========================================
echo.
echo ✅ Sauvegarde creee dans: %backup_dir%
echo ✅ Taille: ~200MB (elements essentiels uniquement)
echo.
echo Contenu sauvegarde:
echo   src/                    - Code principal complet
echo   templates/              - Templates HTML/JSON
echo   static/                 - Assets CSS/JS/images
echo   docs/                   - Documentation
echo   tests/                  - Tests unitaires
echo   credentials.enc         - Donnees chiffrees
echo   requirements.txt        - Dependances
echo   docker-compose.yml      - Configuration
echo   README.md               - Documentation
echo.
echo Vous pouvez maintenant executer:
echo   SUPPRESSION_AUTOMATIQUE.bat
echo.
echo En cas de probleme, restaurer avec:
echo   xcopy "%backup_dir%\*" . /E /I
echo.
pause