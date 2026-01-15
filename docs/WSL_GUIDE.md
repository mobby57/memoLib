# Guide WSL - Résolution des Problèmes

## Problèmes Courants WSL

### 1. Erreur EACCES (Permission Denied)

**Cause:** Le projet est sur `/mnt/c/` (système de fichiers Windows), ce qui cause des conflits de permissions.

**Solutions:**

#### Option A: Déplacer vers le système de fichiers WSL (recommandé)
```bash
# Copier le projet dans votre home WSL
cd ~
cp -r /mnt/c/Users/moros/Desktop/iaPostemanage ./iaPostemanage
cd iaPostemanage

# Nettoyer et réinstaller
rm -rf node_modules .next
npm install
```

#### Option B: Fixer les permissions sur /mnt/c
```bash
# Dans /etc/wsl.conf (créer si n'existe pas)
sudo nano /etc/wsl.conf

# Ajouter:
[automount]
options = "metadata,umask=22,fmask=11"

# Redémarrer WSL depuis PowerShell Windows
wsl --shutdown
wsl
```

#### Option C: Utiliser le script automatique
```bash
chmod +x scripts/wsl-fix.sh
./scripts/wsl-fix.sh
```

### 2. Erreur Husky "MODULE_NOT_FOUND"

**Cause:** Husky essaye de s'installer avant que node_modules existe.

**Solution:** Le script `prepare` a été modifié pour être optionnel.

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### 3. "sh: 1: next: not found"

**Cause:** node_modules pas installé ou binaires incompatibles.

**Solution:**
```bash
# Vérifier node et npm
node --version  # Devrait être v20+
npm --version

# Réinstaller proprement
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install

# Tester
npx next --version
```

### 4. Docker Compose introuvable

**Option A: Installer Docker Desktop avec WSL2**
1. Télécharger Docker Desktop pour Windows
2. Dans Settings → Resources → WSL Integration
3. Activer l'intégration pour votre distro WSL

**Option B: Installer Docker dans WSL**
```bash
# Mettre à jour
sudo apt-get update

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Redémarrer WSL
exit
# Puis rouvrir WSL

# Installer docker-compose
sudo apt-get install docker-compose-plugin
```

## Configuration Recommandée WSL

### 1. Configurer Git pour WSL
```bash
# Éviter les problèmes CRLF/LF
git config --global core.autocrlf input
git config --global core.eol lf

# Configurer votre identité
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"
```

### 2. Optimiser les performances
```bash
# Dans ~/.bashrc ou ~/.zshrc, ajouter:
export NODE_OPTIONS="--max-old-space-size=4096"

# Recharger
source ~/.bashrc
```

### 3. Variables d'environnement
```bash
# Créer .env.local dans le projet
cat > .env.local << EOF
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF
```

## Workflow de Développement WSL

### Démarrage du Projet
```bash
# 1. Aller dans le projet (système de fichiers WSL recommandé)
cd ~/iaPostemanage

# 2. Installer les dépendances
npm install

# 3. Générer Prisma
npx prisma generate

# 4. Créer la base de données
npx prisma migrate dev

# 5. Seed (optionnel)
npx prisma db seed

# 6. Lancer le dev server
npm run dev
```

### Commandes Quotidiennes
```bash
# Dev server
npm run dev

# Ouvrir Prisma Studio (DB GUI)
npx prisma studio

# Type check
npm run type-check

# Tests
npm run test
```

## Troubleshooting Avancé

### Nettoyer complètement le projet
```bash
# Supprimer tous les artefacts
rm -rf node_modules .next out dist coverage
rm -rf prisma/dev.db prisma/dev.db-journal
rm -f package-lock.json

# Vider le cache npm
npm cache clean --force

# Réinstaller depuis zéro
npm install
npx prisma generate
npx prisma migrate dev
```

### Erreur "ENOSPC: System limit for number of file watchers"
```bash
# Augmenter la limite de watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Port 3000 déjà utilisé
```bash
# Trouver et tuer le processus
lsof -ti:3000 | xargs kill -9

# Ou utiliser un autre port
PORT=3001 npm run dev
```

### Problèmes de mémoire
```bash
# Augmenter la mémoire WSL
# Dans C:\Users\VOTRE_USER\.wslconfig (Windows)
[wsl2]
memory=8GB
processors=4

# Redémarrer WSL depuis PowerShell
wsl --shutdown
```

## Vérification de Santé

Script pour vérifier que tout fonctionne:

```bash
#!/bin/bash
echo "🔍 Vérification de l'environnement..."

# Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js non installé"
fi

# npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm non installé"
fi

# Prisma
if npx prisma --version &> /dev/null; then
    echo "✅ Prisma installé"
else
    echo "❌ Prisma non disponible"
fi

# Next.js
if npx next --version &> /dev/null; then
    echo "✅ Next.js installé"
else
    echo "❌ Next.js non disponible"
fi

# Docker (optionnel)
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
else
    echo "⚠️  Docker non installé (optionnel)"
fi

# Permissions
if [ -w node_modules 2>/dev/null ]; then
    echo "✅ Permissions node_modules OK"
else
    echo "⚠️  node_modules manquant ou permissions incorrectes"
fi

echo ""
echo "📁 Emplacement actuel: $PWD"
if [[ "$PWD" == /mnt/c/* ]]; then
    echo "⚠️  Vous êtes sur le système de fichiers Windows"
    echo "   Recommandé: Déplacer vers ~/iaPostemanage"
fi
```

## Bonnes Pratiques WSL

1. **Travailler dans ~/ pas /mnt/c/**
   - Meilleures performances
   - Pas de problèmes de permissions
   - Compatibilité Linux native

2. **Utiliser VS Code avec WSL**
   ```bash
   # Installer extension Remote - WSL
   # Puis dans le projet:
   code .
   ```

3. **Git depuis WSL**
   - Toujours commit/push depuis WSL, pas Windows
   - Évite les problèmes CRLF/LF

4. **Base de données**
   - SQLite fonctionne bien sur WSL
   - Pour PostgreSQL, utiliser Docker ou installation native WSL

## Ressources

- [WSL Documentation](https://docs.microsoft.com/windows/wsl/)
- [Next.js on WSL](https://nextjs.org/docs/advanced-features/debugging#debugging-on-wsl)
- [Docker Desktop WSL2](https://docs.docker.com/desktop/wsl/)
