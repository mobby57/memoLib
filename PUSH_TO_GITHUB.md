# 🚀 Mettre le projet sur GitHub

## Étape 1: Initialiser Git (si pas déjà fait)

```powershell
cd C:\Users\moros\Desktop\iaPostemanage

# Initialiser le repo
git init

# Configurer votre identité
git config user.name "mooby865"
git config user.email "votre-email@example.com"
```

## Étape 2: Créer .gitignore

```powershell
# Créer le fichier .gitignore
@"
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Environment variables
.env
.env.local
.env.production
.env.*.local
email-provisioning.env
config/email-config.env

# Database
*.db
*.sqlite
*.sqlite3
data/

# Logs
logs/
*.log

# Backups
backups/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Tests
coverage/
.nyc_output/
playwright-report/
test-results/

# Build
build/
dist/
*.tgz

# Secrets
*.pem
*.key
*.crt
id_rsa*
"@ | Out-File -FilePath .gitignore -Encoding utf8
```

## Étape 3: Ajouter les fichiers

```powershell
# Ajouter tous les fichiers
git add .

# Vérifier ce qui sera commité
git status

# Premier commit
git commit -m "Initial commit: iaPosteManager v3.6 - Production Ready"
```

## Étape 4: Créer le repo sur GitHub

1. Aller sur https://github.com/new
2. Repository name: `iapostemanager`
3. Description: `Application web pour automatiser l'envoi d'emails avec génération IA`
4. Public ou Private (votre choix)
5. **NE PAS** cocher "Initialize with README" (vous en avez déjà un)
6. Cliquer "Create repository"

## Étape 5: Lier et pousser vers GitHub

```powershell
# Ajouter le remote
git remote add origin https://github.com/mooby865/iapostemanager.git

# Vérifier
git remote -v

# Pousser vers GitHub
git branch -M main
git push -u origin main
```

## Étape 6: Vérifier sur GitHub

Aller sur https://github.com/mooby865/iapostemanager

Vous devriez voir tous vos fichiers!

## Étape 7: Configurer les secrets GitHub (pour CI/CD)

1. Aller sur https://github.com/mooby865/iapostemanager/settings/secrets/actions
2. Cliquer "New repository secret"
3. Ajouter ces secrets:

```
DOCKER_USERNAME = mooby865
DOCKER_PASSWORD = [votre token Docker Hub]
```

## Commandes Git utiles pour la suite

```powershell
# Voir l'état
git status

# Ajouter des modifications
git add .

# Commiter
git commit -m "Description des changements"

# Pousser vers GitHub
git push

# Voir l'historique
git log --oneline

# Créer une branche
git checkout -b nouvelle-branche

# Revenir à main
git checkout main
```

## En cas d'erreur "remote origin already exists"

```powershell
# Supprimer l'ancien remote
git remote remove origin

# Ajouter le nouveau
git remote add origin https://github.com/mooby865/iapostemanager.git
```

## Authentification GitHub

Si demandé, utilisez un Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Cocher: `repo`, `workflow`
4. Copier le token
5. Utiliser comme mot de passe lors du push

---

**✅ Une fois sur GitHub, le pipeline CI/CD se déclenchera automatiquement à chaque push!**
