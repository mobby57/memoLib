@echo off
echo 🚀 Lancement des tests E2E avec auth bypass...
echo.

cd frontend-react

echo 📦 Vérification des dépendances...
if not exist node_modules (
    echo Installation des dépendances...
    npm install
)

echo.
echo 🧪 Lancement des tests E2E...
echo.

npm run test:e2e

echo.
echo 📊 Ouverture du rapport...
npm run test:e2e:report

pause