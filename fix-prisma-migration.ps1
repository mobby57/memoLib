#!/usr/bin/env pwsh
# Script de résolution migration Prisma - password_hashed

Write-Host "🔧 Résolution Migration Prisma" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "⚠️  Problème détecté:" -ForegroundColor Yellow
Write-Host "   Column 'password_hashed' manquante dans table User"
Write-Host "   4 rows existantes sans valeur par défaut`n"

Write-Host "📋 Options disponibles:`n" -ForegroundColor Cyan

Write-Host "1. Migration propre (RECOMMANDÉ)" -ForegroundColor Green
Write-Host "   - Ajoute colonne avec valeur temporaire"
Write-Host "   - Préserve les données existantes"
Write-Host "   - Nécessite mise à jour manuelle des passwords`n"

Write-Host "2. Reset complet (⚠️  PERTE DE DONNÉES)" -ForegroundColor Red
Write-Host "   - Supprime toutes les données"
Write-Host "   - Recrée le schéma"
Write-Host "   - Réexécute seed`n"

Write-Host "3. Ignorer (déploiement sans migrations)" -ForegroundColor Yellow
Write-Host "   - Désactive release_command dans fly.toml"
Write-Host "   - Migration manuelle requise après déploiement`n"

$choice = Read-Host "Choisir une option (1/2/3)"

switch ($choice) {
    "1" {
        Write-Host "`n🔧 Option 1: Migration propre" -ForegroundColor Green
        
        # Créer migration
        Write-Host "Création de la migration..." -ForegroundColor Cyan
        npx prisma migrate dev --name add_password_hashed_with_default --create-only
        
        Write-Host "`n✅ Migration créée!" -ForegroundColor Green
        Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
        Write-Host "   1. Éditer le fichier de migration dans prisma/migrations/"
        Write-Host "   2. Ajouter: ALTER TABLE `"User`" ADD COLUMN `"password_hashed`" TEXT DEFAULT 'CHANGE_ME';"
        Write-Host "   3. Exécuter: npx prisma migrate deploy"
        Write-Host "   4. Mettre à jour les passwords via script ou interface admin"
    }
    
    "2" {
        Write-Host "`n⚠️  Option 2: Reset complet" -ForegroundColor Red
        $confirm = Read-Host "ATTENTION: Toutes les données seront perdues. Confirmer? (oui/non)"
        
        if ($confirm -eq "oui") {
            Write-Host "Reset de la base de données..." -ForegroundColor Yellow
            npx prisma db push --force-reset
            
            Write-Host "Seed des données..." -ForegroundColor Cyan
            npm run db:seed
            
            Write-Host "`n✅ Base de données réinitialisée!" -ForegroundColor Green
        } else {
            Write-Host "Opération annulée." -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host "`n⚠️  Option 3: Ignorer migrations" -ForegroundColor Yellow
        
        # Backup fly.toml
        Copy-Item fly.toml fly.toml.backup
        
        # Commenter release_command
        $content = Get-Content fly.toml
        $content = $content -replace 'release_command = "npx prisma migrate deploy"', '# release_command = "npx prisma migrate deploy"'
        $content | Set-Content fly.toml
        
        Write-Host "`n✅ release_command désactivé dans fly.toml" -ForegroundColor Green
        Write-Host "📝 Backup créé: fly.toml.backup" -ForegroundColor Cyan
        Write-Host "`n⚠️  N'oubliez pas d'exécuter manuellement:" -ForegroundColor Yellow
        Write-Host "   fly ssh console -C 'npx prisma migrate deploy'"
    }
    
    default {
        Write-Host "`n❌ Option invalide" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Script termine" -ForegroundColor Green
