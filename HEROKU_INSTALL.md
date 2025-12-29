# Guide Installation Heroku CLI

## Windows

### Option 1: Installeur Officiel (Recommandé)

1. Télécharger: https://cli-assets.heroku.com/heroku-x64.exe
2. Exécuter l'installeur
3. Redémarrer PowerShell
4. Vérifier: `heroku --version`

### Option 2: Chocolatey

```powershell
choco install heroku-cli
```

### Option 3: npm (si Node.js installé)

```bash
npm install -g heroku
```

## Après Installation

```bash
# Vérifier
heroku --version

# Login
heroku login

# Tester
heroku apps
```

## Déploiement Rapide

Une fois Heroku CLI installé, exécuter:

```bash
deploy_heroku.bat
```

Ce script va:
1. Login Heroku
2. Créer l'app
3. Ajouter PostgreSQL
4. Configurer variables d'env
5. Déployer le code

## Liens

- Installation: https://devcenter.heroku.com/articles/heroku-cli
- Documentation: https://devcenter.heroku.com
- Dashboard: https://dashboard.heroku.com
