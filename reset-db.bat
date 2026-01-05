@echo off
echo 🔄 Réinitialisation de la base de données IA Poste Manager...

REM Arrêter le serveur de développement s'il tourne
taskkill /f /im node.exe 2>nul

REM Supprimer l'ancienne base
if exist "prisma\dev.db" del "prisma\dev.db"
if exist "prisma\dev.db-journal" del "prisma\dev.db-journal"
if exist "prisma\migrations" rmdir /s /q "prisma\migrations"

echo ✅ Ancienne base supprimée

REM Créer la nouvelle base
echo 📦 Création de la nouvelle base...
npx prisma db push --force-reset

REM Générer le client
echo 🔧 Génération du client Prisma...
npx prisma generate

REM Seeder les données
echo 🌱 Insertion des données de test...
npx tsx prisma/seed.ts

echo 🎉 Base de données réinitialisée avec succès !
echo 🚀 Vous pouvez maintenant lancer: npm run dev

pause