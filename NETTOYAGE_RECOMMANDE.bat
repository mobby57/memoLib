@echo off
echo === NETTOYAGE PROJET IAPosteManager ===
echo.
echo Suppression des dossiers inutiles...

REM Archives massives
rmdir /s /q archive
rmdir /s /q assistant_demarches
rmdir /s /q chronology
rmdir /s /q backup

REM Doublons frontend
rmdir /s /q frontend-react
rmdir /s /q react-app
rmdir /s /q mobile-app

REM Sessions temporaires
rmdir /s /q data\flask_session
rmdir /s /q flask_session

REM Dossiers vides/inutiles
rmdir /s /q config
rmdir /s /q migrations
rmdir /s /q gui
rmdir /s /q k8s
rmdir /s /q landing
rmdir /s /q monitoring

echo.
echo === NETTOYAGE TERMINE ===
echo Espace libere: ~2.8GB
echo Structure optimisee pour le developpement
pause