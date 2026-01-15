# Script de correction Gmail API

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "     CORRECTION GMAIL API - GUIDE PAS A PAS" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

# Etape 1
Write-Host "ETAPE 1/3 : Supprimer les fichiers invalides" -ForegroundColor Yellow
Write-Host ""

if (Test-Path "token.json") {
    Remove-Item "token.json" -Force
    Write-Host "  OK token.json supprime" -ForegroundColor Green
} else {
    Write-Host "  INFO token.json n'existe pas" -ForegroundColor Gray
}

if (Test-Path "credentials.json") {
    Remove-Item "credentials.json" -Force
    Write-Host "  OK credentials.json supprime" -ForegroundColor Green
} else {
    Write-Host "  INFO credentials.json n'existe pas" -ForegroundColor Gray
}

Write-Host ""
Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Etape 2
Write-Host "ETAPE 2/3 : Configurer le scope Gmail" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Ouvrez ce lien dans votre navigateur :" -ForegroundColor White
Write-Host "  https://console.cloud.google.com/apis/credentials/consent" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Suivez ces etapes EXACTEMENT :" -ForegroundColor White
Write-Host ""
Write-Host "  1. Cliquez sur 'MODIFIER L'APPLICATION'" -ForegroundColor White
Write-Host "  2. Allez a l'etape 'Portees' (2/4)" -ForegroundColor White
Write-Host "  3. Cliquez sur 'AJOUTER OU SUPPRIMER DES PORTEES'" -ForegroundColor White
Write-Host "  4. Dans la recherche, tapez : gmail" -ForegroundColor White
Write-Host "  5. COCHEZ : https://www.googleapis.com/auth/gmail.readonly" -ForegroundColor Cyan
Write-Host "  6. Cliquez sur 'METTRE A JOUR' en bas" -ForegroundColor White
Write-Host "  7. Cliquez sur 'ENREGISTRER ET CONTINUER' (plusieurs fois)" -ForegroundColor White
Write-Host ""
Write-Host "  " -NoNewline
Read-Host "Appuyez sur ENTREE quand c'est fait"

Write-Host ""
Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Etape 3
Write-Host "ETAPE 3/3 : Creer de nouveaux credentials" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Ouvrez ce lien dans votre navigateur :" -ForegroundColor White
Write-Host "  https://console.cloud.google.com/apis/credentials" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Suivez ces etapes EXACTEMENT :" -ForegroundColor White
Write-Host ""
Write-Host "  1. Trouvez l'ancien 'ID client OAuth 2.0'" -ForegroundColor White
Write-Host "  2. Cliquez sur l'icone corbeille pour le SUPPRIMER" -ForegroundColor White
Write-Host "  3. Cliquez sur '+ CREER DES IDENTIFIANTS'" -ForegroundColor White
Write-Host "  4. Selectionnez 'ID client OAuth'" -ForegroundColor White
Write-Host "  5. Type : Application de bureau" -ForegroundColor Cyan
Write-Host "  6. Nom : Email Monitor Desktop" -ForegroundColor White
Write-Host "  7. Cliquez sur 'CREER'" -ForegroundColor White
Write-Host "  8. Telechargez le fichier JSON" -ForegroundColor White
Write-Host "  9. RENOMMEZ en : credentials.json" -ForegroundColor White
Write-Host "  10. DEPLACEZ a la racine du projet" -ForegroundColor White
Write-Host ""
Write-Host "  " -NoNewline
Read-Host "Appuyez sur ENTREE quand c'est fait"

Write-Host ""
Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Verification
Write-Host "Verification..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "credentials.json") {
    Write-Host "  OK credentials.json trouve!" -ForegroundColor Green
    Write-Host ""
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
    Write-Host ""
    Write-Host "PRET A LANCER !" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Lancez : npm run email:monitor" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  IMPORTANT : Lors de l'autorisation, vous DEVEZ voir :" -ForegroundColor Yellow
    Write-Host "  'Afficher vos e-mails et parametres'" -ForegroundColor White
    Write-Host ""
    Write-Host "  Si vous ne voyez PAS cette permission," -ForegroundColor Yellow
    Write-Host "  recommencez l'ETAPE 2" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "  ERREUR credentials.json non trouve!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Verifiez que vous avez bien :" -ForegroundColor Yellow
    Write-Host "    1. Telecharge le fichier JSON" -ForegroundColor White
    Write-Host "    2. Renomme en 'credentials.json'" -ForegroundColor White
    Write-Host "    3. Place a la racine du projet" -ForegroundColor White
    Write-Host ""
}

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""
