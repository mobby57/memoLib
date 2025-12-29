# 🚀 Déploiement Heroku - IA Poste Manager

## Guide Rapide

### Prérequis

1. Compte Heroku gratuit: https://signup.heroku.com
2. Heroku CLI installé: https://devcenter.heroku.com/articles/heroku-cli

### Installation Heroku CLI

**Windows:**
```bash
# Télécharger depuis https://devcenter.heroku.com/articles/heroku-cli
# Ou avec Chocolatey:
choco install heroku-cli
```

**Vérifier installation:**
```bash
heroku --version
```

### Déploiement en 5 Étapes

#### 1️⃣ Login Heroku

```bash
heroku login
```

#### 2️⃣ Créer Application

```bash
heroku create iapostemanager
# Ou avec un nom personnalisé:
# heroku create votre-nom-app
```

#### 3️⃣ Ajouter PostgreSQL

```bash
# Plan gratuit (500 MB, 20 connexions)
heroku addons:create heroku-postgresql:essential-0

# Vérifier
heroku config:get DATABASE_URL
```

#### 4️⃣ Configurer Variables d'Environnement

```bash
# Flask
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# Email Gmail
heroku config:set IMAP_USERNAME=votre.email@gmail.com
heroku config:set IMAP_PASSWORD=votre-app-password
heroku config:set SMTP_USERNAME=votre.email@gmail.com
heroku config:set SMTP_PASSWORD=votre-app-password

# Optionnel: OpenAI
heroku config:set OPENAI_API_KEY=sk-...
```

#### 5️⃣ Déployer

```bash
# Si pas encore fait
git init
git add .
git commit -m "Deploy IA Poste Manager to Heroku"

# Push vers Heroku
git push heroku main

# Ou si branche différente:
# git push heroku votre-branche:main
```

### Post-Déploiement

#### Vérifier le déploiement

```bash
# Voir logs
heroku logs --tail

# Ouvrir dans navigateur
heroku open

# Status
heroku ps
```

#### Tester l'API

```bash
# Health check
curl https://iapostemanager.herokuapp.com/api/v2/health

# Login
curl -X POST https://iapostemanager.herokuapp.com/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"email_system","password":"EmailSystem2025!"}'
```

### Initialiser la Base de Données

```bash
# Se connecter à la DB
heroku pg:psql

# Créer les tables (si pas de migrations)
# Copier le SQL depuis docs/DATABASE_SCHEMA.sql

# Ou via script Python
heroku run python scripts/init_database.py
```

### Gestion de l'Application

#### Logs et Monitoring

```bash
# Logs temps réel
heroku logs --tail

# Logs des 1000 dernières lignes
heroku logs -n 1000

# Logs d'une app spécifique
heroku logs --app iapostemanager --tail
```

#### Redémarrer

```bash
heroku restart
```

#### Scaler

```bash
# 1 dyno web gratuit
heroku ps:scale web=1

# Arrêter
heroku ps:scale web=0
```

### Configuration PostgreSQL

#### Connexion DB

```bash
# Ouvrir psql
heroku pg:psql

# Info DB
heroku pg:info

# Backups
heroku pg:backups:capture
heroku pg:backups:download
```

#### Importer données

```bash
# Depuis fichier SQL
heroku pg:psql < backup.sql

# Ou via Python
heroku run python scripts/import_data.py
```

### Limitations Plan Gratuit

- **Dynos:** 550 heures/mois (sleep après 30min inactivité)
- **PostgreSQL:** Essential-0 - 1 GB storage, 20 connexions
- **Build:** 300 minutes/mois
- **Sleep mode:** App s'endort après 30min sans trafic

### Keep-Alive (Éviter Sleep)

**Option 1: UptimeRobot** (gratuit)
- https://uptimerobot.com
- Ping toutes les 5 minutes

**Option 2: Cron-job.org** (gratuit)
- https://cron-job.org
- Requête HTTP périodique

**Option 3: Script local**
```bash
# Ping toutes les 25 minutes
watch -n 1500 curl https://iapostemanager.herokuapp.com/api/v2/health
```

### Troubleshooting

#### App crash au démarrage

```bash
# Voir logs
heroku logs --tail

# Vérifier Procfile
cat Procfile

# Vérifier buildpack
heroku buildpacks
```

#### Database connection error

```bash
# Vérifier DATABASE_URL
heroku config:get DATABASE_URL

# Tester connexion
heroku pg:info
```

#### Port binding error

Vérifier dans `run_server.py`:
```python
port = int(os.environ.get('PORT', 5000))
app.run(host='0.0.0.0', port=port)
```

### Rollback

```bash
# Voir releases
heroku releases

# Rollback à version précédente
heroku rollback v123
```

### Variables d'Environnement

```bash
# Lister toutes
heroku config

# Ajouter
heroku config:set MA_VARIABLE=valeur

# Supprimer
heroku config:unset MA_VARIABLE

# Éditer interactif
heroku config:edit
```

### Commandes Utiles

```bash
# Shell interactif
heroku run bash

# Console Python
heroku run python

# Exécuter script
heroku run python mon_script.py

# SSH dans dyno
heroku ps:exec

# Informations app
heroku apps:info
```

### Fichiers Créés pour Heroku

- ✅ `Procfile` - Commande démarrage web
- ✅ `runtime.txt` - Version Python
- ✅ `requirements.txt` - Dependencies
- ✅ `run_server.py` - App compatible Gunicorn

### Migration depuis autre hébergeur

```bash
# Exporter DB actuelle
pg_dump $DATABASE_URL > backup.sql

# Importer vers Heroku
heroku pg:psql < backup.sql
```

### URLs Importantes

- **Dashboard:** https://dashboard.heroku.com
- **Logs:** https://dashboard.heroku.com/apps/iapostemanager/logs
- **Settings:** https://dashboard.heroku.com/apps/iapostemanager/settings
- **Resources:** https://dashboard.heroku.com/apps/iapostemanager/resources

### Support

- Documentation: https://devcenter.heroku.com
- Status: https://status.heroku.com
- Community: https://help.heroku.com

---

## 🎯 Checklist Déploiement

- [ ] Heroku CLI installé
- [ ] `heroku login` réussi
- [ ] App créée: `heroku create iapostemanager`
- [ ] PostgreSQL ajouté: `heroku addons:create heroku-postgresql:essential-0`
- [ ] Variables configurées (SECRET_KEY, IMAP, SMTP)
- [ ] Code commité: `git commit -m "Deploy"`
- [ ] Déployé: `git push heroku main`
- [ ] Tables DB créées
- [ ] User système créé
- [ ] Tests API passent
- [ ] Keep-alive configuré (UptimeRobot)

**Votre app sera accessible à:** https://iapostemanager.herokuapp.com
