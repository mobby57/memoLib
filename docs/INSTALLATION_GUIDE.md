# 🚀 Guide d'Installation - IA Poste Manager

## ✅ Version: 1.0 Production-Ready

Ce guide vous permettra d'installer et configurer **IA Poste Manager** en 30 minutes.

---

## 📋 Prérequis

### 1. Logiciels Requis

| Logiciel | Version | Lien Téléchargement |
|----------|---------|---------------------|
| **Python** | 3.11+ | https://www.python.org/downloads/ |
| **Node.js** | 18+ | https://nodejs.org/ |
| **PostgreSQL** | 15+ | https://www.postgresql.org/download/ |
| **Git** | Latest | https://git-scm.com/downloads |

### 2. Compte Gmail

- Créer un compte Gmail ou utiliser un existant
- Activer "2-Step Verification"
- Générer un "App Password" (voir section Configuration Gmail)

---

## 🔧 Installation Étape par Étape

### Étape 1: Télécharger le Projet

```powershell
# Cloner le projet
cd C:\Users\VotreNom\Desktop
git clone https://github.com/votre-repo/iaPostemanage.git
cd iaPostemanage
```

Ou décompressez le fichier ZIP fourni.

### Étape 2: Installer PostgreSQL

**Windows:**
1. Téléchargez PostgreSQL depuis https://www.postgresql.org/download/windows/
2. Exécutez l'installateur
3. Choisissez un mot de passe pour l'utilisateur `postgres` (notez-le!)
4. Port par défaut: `5432`
5. Installez pgAdmin 4 (recommandé)

**Créer la Base de Données:**
```sql
-- Ouvrez pgAdmin 4 ou psql
CREATE DATABASE iapostemanager;
CREATE USER iaposte WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE iapostemanager TO iaposte;
```

**Test de Connexion:**
```powershell
psql -U postgres -d iapostemanager -h localhost
# Si succès: \q pour quitter
```

### Étape 3: Configuration Gmail App Password

1. Allez sur https://myaccount.google.com/security
2. Activez "2-Step Verification"
3. Allez dans "App passwords" (Mots de passe d'application)
4. Sélectionnez:
   - App: **Mail**
   - Device: **Windows Computer**
5. Cliquez "Generate"
6. **Copiez le mot de passe à 16 caractères** (ex: `abcd efgh ijkl mnop`)
7. Supprimez les espaces: `abcdefghijklmnop`

### Étape 4: Configurer le Fichier .env

```powershell
# Copier le template
cp .env.example .env

# Éditer avec Notepad
notepad .env
```

**Modifier ces lignes:**
```env
# Database
DATABASE_URL=postgresql://iaposte:votre_mot_de_passe_securise@localhost:5432/iapostemanager

# Email
IMAP_USERNAME=votre.email@gmail.com
IMAP_PASSWORD=abcdefghijklmnop
SMTP_USERNAME=votre.email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop

# Security
SECRET_KEY=generez-une-cle-aleatoire-ici
```

**Générer SECRET_KEY:**
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
# Copiez le résultat dans SECRET_KEY
```

### Étape 5: Installer les Dépendances Python

```powershell
# Créer environnement virtuel
python -m venv venv

# Activer l'environnement
.\venv\Scripts\Activate.ps1

# Installer les packages
pip install --upgrade pip
pip install -r requirements.txt
```

**Si requirements.txt manquant:**
```powershell
pip install flask flask-cors psycopg2-binary sqlalchemy python-dotenv pyjwt
```

### Étape 6: Créer les Tables PostgreSQL

```powershell
# Lancer le script de création
python scripts/create_database_tables.py
```

**Ou manuellement via pgAdmin/psql:**
```sql
-- Voir le fichier: docs/DATABASE_SCHEMA.sql
-- Exécuter les commandes CREATE TABLE
```

### Étape 7: Installer Frontend React

```powershell
cd src/frontend

# Installer dependencies
npm install

# Retour au dossier racine
cd ../..
```

### Étape 8: Créer l'Utilisateur Système

```powershell
python -c "
from src.backend.services.user_service_postgres import get_user_service
service = get_user_service()
user = service.register_user(
    username='email_system',
    email='system@iapostemanager.local',
    password='EmailSystem2025!',
    role='system'
)
print(f'User created: ID {user[\"id\"]}')
"
```

---

## 🚀 Démarrage

### Terminal 1: Backend API

```powershell
# Activer environnement virtuel
.\venv\Scripts\Activate.ps1

# Lancer le serveur
python start_api_production.py
```

**Vérification:**
- Console affiche: "Server running on: http://localhost:5000"
- Testez: http://localhost:5000/api/v2/health
- Réponse attendue: `{"status": "healthy", "database": "connected"}`

### Terminal 2: Frontend React

```powershell
cd src/frontend
npm run dev
```

**Vérification:**
- Console affiche: "Local: http://localhost:3005/"
- Ouvrez: http://localhost:3005/workspaces
- Page de login s'affiche

### Terminal 3: Email Poller (Optionnel)

```powershell
# Activer environnement virtuel
.\venv\Scripts\Activate.ps1

# Lancer le poller
python scripts/start_email_poller_v2.py
```

**Vérification:**
- Console affiche: "Polling automatique IMAP toutes les 60s"
- Aucune erreur IMAP/SMTP

---

## ✅ Vérification Complète

### Test 1: Health Check API
```powershell
Invoke-RestMethod http://localhost:5000/api/v2/health
# Doit retourner: status=healthy
```

### Test 2: Login Frontend
1. Ouvrez http://localhost:3005/workspaces
2. Login:
   - Username: `email_system`
   - Password: `EmailSystem2025!`
3. Vous devez voir le dashboard

### Test 3: API Complete
```powershell
powershell -ExecutionPolicy Bypass -File test_api_complete.ps1
# Doit afficher: "ALL TESTS PASSED"
```

### Test 4: Créer Workspace Manuel
```powershell
python create_test_workspace.py
# Doit créer un workspace et l'afficher
```

---

## 🐛 Dépannage

### Erreur: "Cannot connect to database"

**Cause:** PostgreSQL pas démarré ou mauvais credentials

**Solution:**
```powershell
# Vérifier si PostgreSQL tourne
Get-Service -Name postgresql*

# Démarrer si nécessaire
Start-Service postgresql-x64-15

# Tester connexion
psql -U iaposte -d iapostemanager -h localhost
```

### Erreur: "IMAP/SMTP Authentication Failed"

**Cause:** App Password invalide

**Solution:**
1. Vérifiez le mot de passe dans .env (sans espaces)
2. Régénérez un nouveau App Password Gmail
3. Vérifiez que 2-Step Verification est activée

### Erreur: "ModuleNotFoundError"

**Cause:** Environnement virtuel pas activé

**Solution:**
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend ne démarre pas

**Cause:** Node modules manquants

**Solution:**
```powershell
cd src/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port 5000 déjà utilisé

**Solution:**
```powershell
# Trouver le processus
netstat -ano | findstr :5000

# Tuer le processus (remplacez PID)
Stop-Process -Id PID -Force
```

---

## 📊 URLs du Système

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:5000 | API REST v2 |
| **Health Check** | http://localhost:5000/api/v2/health | Statut système |
| **API Docs** | http://localhost:5000/ | Documentation endpoints |
| **Frontend** | http://localhost:3005/workspaces | Interface utilisateur |
| **PostgreSQL** | localhost:5432 | Base de données |

---

## 🔐 Credentials par Défaut

### Utilisateur Système
- **Username:** `email_system`
- **Password:** `EmailSystem2025!`
- **Role:** system
- **Usage:** Email automation

### Base de Données
- **Database:** `iapostemanager`
- **User:** `iaposte`
- **Password:** (défini lors de l'installation)
- **Host:** localhost
- **Port:** 5432

⚠️ **IMPORTANT:** Changez tous les mots de passe en production!

---

## 📝 Prochaines Étapes

### Configuration Recommandée

1. **Créer un utilisateur admin:**
```powershell
python -c "
from src.backend.services.user_service_postgres import get_user_service
service = get_user_service()
admin = service.register_user(
    username='admin',
    email='admin@votre-entreprise.com',
    password='ChangezCeciEnProduction123!',
    role='admin'
)
print('Admin created:', admin['username'])
"
```

2. **Tester envoi email:**
```powershell
python send_test_email.py
# Vérifiez votre boîte Gmail
```

3. **Créer données de démo:**
```powershell
python demo_complete.py
# Crée workspaces et messages de test
```

### Production Deployment

Pour déployer en production, consultez:
- **docs/DEPLOYMENT_GUIDE.md** - Guide déploiement complet
- **docs/SECURITY_CHECKLIST.md** - Liste vérification sécurité
- **docs/MONITORING_SETUP.md** - Configuration monitoring

---

## 📞 Support

### Documentation
- **Guide Technique:** docs/INDEX_DOCUMENTATION_COMPLETE.md
- **API Reference:** docs/API_DOCUMENTATION.md
- **Frontend Guide:** docs/FRONTEND_INTEGRATION.md

### Problèmes Communs
- **docs/TROUBLESHOOTING.md** - Solutions problèmes fréquents
- **docs/FAQ.md** - Questions fréquentes

### Contact Support
- **Email:** support@iapostemanager.com
- **Issues:** GitHub Issues (si applicable)

---

## ✅ Checklist Installation

- [ ] PostgreSQL installé et running
- [ ] Python 3.11+ installé
- [ ] Node.js 18+ installé
- [ ] Database `iapostemanager` créée
- [ ] Gmail App Password généré
- [ ] Fichier .env configuré
- [ ] Dependencies Python installées
- [ ] Dependencies Node installées
- [ ] Tables PostgreSQL créées
- [ ] User système créé
- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Health check API OK
- [ ] Login frontend fonctionne
- [ ] Test API complet passe

---

## 🎉 Félicitations!

Votre installation **IA Poste Manager** est complète!

**Prochaine étape:** Consultez le **Guide Utilisateur** pour commencer à utiliser l'application.

**Version:** 1.0 Production-Ready  
**Date:** Décembre 2025
