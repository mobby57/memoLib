# Script d'initialisation de la base de donnees
# Cree les utilisateurs de demonstration

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  Initialisation de la base de donnees" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Etape 1: Supprimer l'ancienne base de donnees
Write-Host "Etape 1/3: Nettoyage de l'ancienne base..." -ForegroundColor Yellow
if (Test-Path "prisma/dev.db") {
    Remove-Item "prisma/dev.db" -Force
    Write-Host "   OK Ancienne base supprimee" -ForegroundColor Green
} else {
    Write-Host "   i Pas de base existante" -ForegroundColor Cyan
}

if (Test-Path "prisma/dev.db-journal") {
    Remove-Item "prisma/dev.db-journal" -Force
}

# Etape 2: Creer la nouvelle base
Write-Host "`nEtape 2/3: Creation de la nouvelle base..." -ForegroundColor Yellow
Write-Host "   > Synchronisation du schema Prisma..." -ForegroundColor Cyan
npx prisma db push --force-reset --skip-generate 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK Schema synchronise" -ForegroundColor Green
} else {
    Write-Host "   X Erreur de synchronisation!" -ForegroundColor Red
    exit 1
}

# Etape 3: Seed - Inserer les donnees de demo
Write-Host "`nEtape 3/3: Insertion des donnees de demonstration..." -ForegroundColor Yellow
Write-Host "   > Execution du seed..." -ForegroundColor Cyan

npx tsx prisma/seed.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n   OK Donnees inserees avec succes!" -ForegroundColor Green
} else {
    Write-Host "`n   X Erreur lors du seed!" -ForegroundColor Red
    exit 1
}

# Resume
Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "  Base de donnees initialisee avec succes!" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Green

Write-Host "Comptes de demonstration disponibles:`n" -ForegroundColor Cyan

Write-Host "  Super Admin:" -ForegroundColor Yellow
Write-Host "    Email: superadmin@iapostemanager.com" -ForegroundColor White
Write-Host "    Pass:  SuperAdmin2026!`n" -ForegroundColor White

Write-Host "  Cabinet Dupont (Basic):" -ForegroundColor Yellow
Write-Host "    Email: jean.dupont@cabinet-dupont.fr" -ForegroundColor White
Write-Host "    Pass:  Avocat2026!`n" -ForegroundColor White

Write-Host "  Cabinet Martin (Premium):" -ForegroundColor Yellow
Write-Host "    Email: sophie.martin@cabinet-martin.fr" -ForegroundColor White
Write-Host "    Pass:  Avocat2026!`n" -ForegroundColor White

Write-Host "  Cabinet Rousseau (Enterprise):" -ForegroundColor Yellow
Write-Host "    Email: pierre.rousseau@cabinet-rousseau.fr" -ForegroundColor White
Write-Host "    Pass:  Avocat2026!`n" -ForegroundColor White

Write-Host "Vous pouvez maintenant vous connecter avec ces identifiants!`n" -ForegroundColor Green
