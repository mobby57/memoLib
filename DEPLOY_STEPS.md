# 🚀 DÉPLOIEMENT HEROKU - ÉTAPES EXACTES

## 1. OUVRIR HEROKU
https://dashboard.heroku.com

## 2. CRÉER APP
- Cliquer "New" → "Create new app"
- App name: `iapostemanager`
- Region: Europe
- "Create app"

## 3. CONNECTER GITHUB
- Onglet "Deploy"
- Section "Deployment method"
- Cliquer "GitHub"
- "Connect to GitHub" (autoriser si demandé)
- Search: `iaPostemanage`
- "Connect"

## 4. VARIABLES D'ENVIRONNEMENT
- Onglet "Settings"
- Section "Config Vars"
- "Reveal Config Vars"
- Ajouter:
  - KEY: `SECRET_KEY`
  - VALUE: `RmuekVcRKUvQrDLqTQWgnNem1hWog-R6IoByxAOgk1Q`
  - "Add"
- Ajouter:
  - KEY: `FLASK_ENV`
  - VALUE: `production`
  - "Add"

## 5. DÉPLOYER
- Retour onglet "Deploy"
- Section "Manual deploy"
- Branch: `main`
- "Deploy Branch"

## 6. OUVRIR APP
- "View" (URL automatique générée)

**TEMPS: 3 minutes**
**RÉSULTAT: Application live sur Heroku**