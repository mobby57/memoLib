# 🚀 DEPLOIEMENT WEB HEROKU (SANS CLI)

## 1. ALLER SUR HEROKU
https://dashboard.heroku.com

## 2. CREER COMPTE GRATUIT
- Sign up gratuit
- Verification email

## 3. CREER APP
- New → Create new app
- App name: `iapostemanager`
- Region: Europe
- Create app

## 4. CONNECTER GITHUB
- Deploy tab
- Deployment method: GitHub
- Connect to GitHub
- Search repo: iapostemanage
- Connect

## 5. CONFIGURER VARIABLES
- Settings tab
- Config Vars → Reveal Config Vars
- Add:
  - KEY: `SECRET_KEY`
  - VALUE: `RmuekVcRKUvQrDLqTQWgnNem1hWog-R6IoByxAOgk1Q`
- Add:
  - KEY: `FLASK_ENV` 
  - VALUE: `production`

## 6. DEPLOYER
- Deploy tab
- Manual deploy
- Branch: main
- Deploy Branch

## 7. OUVRIR APP
- View app (URL automatique)

**TEMPS TOTAL: 5 minutes**
**RESULTAT: URL live Heroku**