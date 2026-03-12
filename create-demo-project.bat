@echo off
echo Creation d'un projet Next.js minimal pour la demo...
echo.

cd ..
if not exist demo-nextjs mkdir demo-nextjs
cd demo-nextjs

echo Initialisation du projet...
npm init -y
npm install next@latest react@latest react-dom@latest lucide-react

echo Creation de la structure...
if not exist src\app\demo mkdir src\app\demo
if not exist src\app\demo\workspace-reasoning mkdir src\app\demo\workspace-reasoning

echo Copie du fichier de demo...
copy "..\MemoLib.Api\src\app\[locale]\demo\workspace-reasoning\page.tsx" "src\app\demo\workspace-reasoning\page.tsx"

echo.
echo ========================================
echo   Projet cree dans: demo-nextjs
echo ========================================
echo.
echo Lancez: cd ..\demo-nextjs && npm run dev
echo.
pause
