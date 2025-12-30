# DEPLOIEMENT HEROKU MANUEL

## 1. INSTALLER HEROKU CLI
https://devcenter.heroku.com/articles/heroku-cli

## 2. CREER APP
```bash
heroku create iapostemanager --region eu
```

## 3. CONFIGURER VARIABLES
```bash
heroku config:set SECRET_KEY="RmuekVcRKUvQrDLqTQWgnNem1hWog-R6IoByxAOgk1Q"
heroku config:set FLASK_ENV="production"
```

## 4. DEPLOYER
```bash
git push heroku main
```

## 5. OUVRIR APP
```bash
heroku open
```

**ALTERNATIVE: Interface Web Heroku**
1. https://dashboard.heroku.com
2. New → Create new app
3. Connect GitHub repo
4. Deploy branch: main
5. Variables dans Settings

**RESULTAT: URL automatique Heroku**