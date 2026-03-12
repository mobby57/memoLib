@echo off
echo Nettoyage du cache Next.js...
if exist .next rmdir /s /q .next
if exist .turbopack rmdir /s /q .turbopack
echo.
echo Lancement du serveur...
npm run dev
