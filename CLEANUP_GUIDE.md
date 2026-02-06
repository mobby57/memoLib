# 🧹 Guide de Nettoyage du Projet

Ce document liste les fichiers et dossiers à supprimer pour nettoyer le projet.

## ⚠️ ATTENTION - Fichiers Sensibles à Supprimer Immédiatement

```bash
# Clés privées GitHub App (À SUPPRIMER ET UTILISER SECRETS)
rm *.pem
rm ia-poste-manager-pro.*.pem
rm memolib-guardian.*.pem
rm prod-key.txt

# Bases de données de développement
rm dev.db
rm prod.db
rm prisma/dev.db
rm prisma/prod.db
rm prisma/prisma/dev.db
```

## 🗑️ Fichiers Temporaires

```bash
# Logs
rm *.log
rm dev-error.log
rm dev-output.log
rm dev-server.log
rm server.log
rm build.log
rm build-full.log
rm build-output.log

# Fichiers temporaires
rm temp_*.txt
rm test-upload-temp.txt
rm syntaxiquement
rm valide

# Reports
rm bugs-report.json
rm database-test-report.json
rm migration-report.json
rm performance-metrics.json
rm ascii-conversion-report.txt
rm type-errors.txt
rm type-errors-new.txt
```

## 📁 Dossiers à Supprimer

```bash
# Cache et build artifacts
rm -rf .jest-cache/
rm -rf .next/
rm -rf .swc/
rm -rf .wrangler/
rm -rf .open-next/
rm -rf out-azure/
rm -rf nextjs-app/
rm -rf coverage/
rm -rf test-results/
rm -rf playwright-report/

# Backups (à archiver ailleurs si nécessaire)
rm -rf backups/

# Legacy code
rm -rf dbcodeio-public/
rm -rf app-sentry-backup/
rm -rf backend-python/
rm -rf frontend-node/
```

## 📄 Fichiers de Documentation Redondants

À consolider ou supprimer:

```bash
# Multiples guides de démarrage
QUICK_START.md (garder)
QUICKSTART.md (supprimer - doublon)
START_HERE.md (consolider dans README)
QUICK_START_PRODUCTION.md (déplacer vers docs/)

# Multiples guides de déploiement
DEPLOY_*.md (consolider en un seul dans docs/)
DEPLOYMENT_*.md (consolider)

# Status reports obsolètes
STATUS_*.md
PHASE*_*.md
PROJECT_STATUS.md
COMPLETION_*.md
FINAL_*.md
```

## 🔧 Scripts de Nettoyage Automatique

### Windows (PowerShell)

```powershell
# Créer un script clean-project.ps1
@"
# Nettoyage automatique MemoLib
Write-Host "🧹 Nettoyage du projet..." -ForegroundColor Cyan

# Supprimer les caches
Remove-Item -Recurse -Force .jest-cache, .next, .swc, .turbo, coverage -ErrorAction SilentlyContinue

# Supprimer les logs
Remove-Item *.log -ErrorAction SilentlyContinue

# Supprimer les fichiers temporaires
Remove-Item temp_*.txt -ErrorAction SilentlyContinue

Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
"@ | Out-File -FilePath clean-project.ps1 -Encoding UTF8
```

### Linux/Mac (Bash)

```bash
#!/bin/bash
# clean-project.sh

echo "🧹 Nettoyage du projet..."

# Supprimer les caches
rm -rf .jest-cache .next .swc .turbo coverage

# Supprimer les logs
rm -f *.log

# Supprimer les fichiers temporaires
rm -f temp_*.txt

echo "✅ Nettoyage terminé!"
```

## 📋 Checklist de Nettoyage

- [ ] Supprimer les fichiers .pem et les stocker dans GitHub Secrets
- [ ] Supprimer les bases de données de dev du repo
- [ ] Nettoyer les logs et fichiers temporaires
- [ ] Supprimer les dossiers de cache
- [ ] Archiver les backups ailleurs
- [ ] Supprimer les dossiers legacy
- [ ] Consolider la documentation
- [ ] Vérifier que .gitignore bloque tout
- [ ] Commit et push le nettoyage
- [ ] Vérifier que le build fonctionne toujours

## 🚀 Après le Nettoyage

```bash
# Vérifier que tout fonctionne
npm run clean
npm install
npm run build
npm run test

# Si tout est OK, commit
git add .
git commit -m "chore: clean project structure and remove legacy files"
git push
```

## 📊 Gain Attendu

- **Taille du repo**: -50% à -70%
- **Temps de clone**: -40%
- **Clarté**: +100%
- **Sécurité**: Fichiers sensibles supprimés

---

**Note**: Toujours faire un backup complet avant le nettoyage massif!
