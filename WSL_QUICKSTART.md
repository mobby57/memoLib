# Quick Start WSL

## Problème Actuel
Vous avez des erreurs car le projet est sur le système de fichiers Windows (`/mnt/c/`) ce qui cause des conflits de permissions avec WSL.

## Solution Rapide (5 minutes)

### Étape 1: Exécuter le script de fix
```bash
cd /mnt/c/Users/moros/Desktop/iaPostemanage
chmod +x scripts/wsl-fix.sh
./scripts/wsl-fix.sh
```

Le script va:
- Détecter que vous êtes sur /mnt/c/
- Proposer de copier le projet vers ~/iaPostemanage
- Nettoyer et réinstaller proprement

### Étape 2: Suivre les instructions
Choisissez l'option 2 pour copier vers ~/iaPostemanage

### Étape 3: Développer normalement
```bash
cd ~/iaPostemanage
npm run dev
```

## Alternative Manuelle

Si vous préférez rester sur /mnt/c/:

```bash
# 1. Nettoyer complètement
rm -rf node_modules .next package-lock.json

# 2. Réinstaller
npm install

# 3. Générer Prisma
npx prisma generate

# 4. Lancer
npm run dev
```

⚠️ **Note**: Rester sur /mnt/c/ peut causer des problèmes de performance et permissions.

## Vérifier l'Installation

```bash
chmod +x scripts/wsl-check.sh
./scripts/wsl-check.sh
```

Cela affichera l'état de votre environnement et les actions nécessaires.

## Problèmes Résolus

✅ **Husky MODULE_NOT_FOUND** - Script prepare rendu optionnel  
✅ **EACCES permissions** - Détecté et script de migration fourni  
✅ **next/prisma not found** - Installation propre depuis WSL  
✅ **Docker Compose** - Guide d'installation fourni  

## Documentation Complète

Voir `docs/WSL_GUIDE.md` pour le guide complet.
