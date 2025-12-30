# 🚀 Guide de Déploiement Production - IA Poste Manager Édition Avocat

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Configuration locale](#configuration-locale)
3. [Déploiement PythonAnywhere](#déploiement-pythonanywhere)
4. [Déploiement Vercel](#déploiement-vercel)
5. [Déploiement Render](#déploiement-render)
6. [Configuration avancée](#configuration-avancée)
7. [Dépannage](#dépannage)

---

## Vue d'ensemble

### Fonctionnalités de l'application

✅ **Système d'authentification** avec Flask-Login  
✅ **Gestion des délais juridiques** avec calcul des jours ouvrables  
✅ **Facturation et suivi du temps** avec génération de factures  
✅ **Registre de conformité** avec numérotation chronologique  
✅ **Tableaux de bord et rapports** avec Chart.js  
✅ **Notifications professionnelles** (toasts au lieu d'alert)  
✅ **Interface responsive** optimisée mobile  

### Architecture technique

```
iaPostemanage/
├── app.py                      # Application Flask principale
├── requirements.txt            # Dépendances Python
├── src/
│   └── backend/
│       ├── services/legal/     # Modules juridiques
│       └── routes/             # Routes API
├── templates/legal/            # Pages HTML
├── static/
│   ├── css/                    # Styles
│   ├── js/                     # Scripts JavaScript
│   └── images/                 # Assets
└── data/                       # Base de données JSON (dev)
```

---

## Configuration locale

### 1️⃣ Prérequis

- Python 3.9+
- pip (gestionnaire de packages)
- Git (optionnel)

### 2️⃣ Installation

```bash
# Cloner ou télécharger le projet
cd iaPostemanage

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### 3️⃣ Configuration

Créer un fichier `.env` à la racine :

```env
SECRET_KEY=votre-clé-secrète-très-longue-et-aléatoire
FLASK_ENV=development
```

Générer une SECRET_KEY sécurisée :

```python
import secrets
print(secrets.token_hex(32))
```

### 4️⃣ Lancement local

```bash
# Démarrer le serveur
python app.py

# Ouvrir dans le navigateur
# http://localhost:5000/login
```

**Compte de démonstration :**
- Utilisateur : `admin`
- Mot de passe : `admin123`

---

## Déploiement PythonAnywhere

### 📌 Étape 1 : Création du compte

1. Créer un compte sur [PythonAnywhere](https://www.pythonanywhere.com)
2. Choisir le plan **gratuit** (pour démarrer)

### 📌 Étape 2 : Upload du code

**Option A : Upload manuel**

1. Aller dans **Files**
2. Créer le dossier `iaPostemanage`
3. Uploader tous les fichiers du projet

**Option B : Via Git (recommandé)**

```bash
# Dans la console Bash de PythonAnywhere
cd ~
git clone https://github.com/VOTRE_USERNAME/iaPostemanage.git
cd iaPostemanage
```

### 📌 Étape 3 : Configuration de l'environnement virtuel

```bash
# Dans la console Bash
cd ~/iaPostemanage
mkvirtualenv --python=/usr/bin/python3.10 iaposte
workon iaposte
pip install -r requirements.txt
```

### 📌 Étape 4 : Configuration de l'application Web

1. Aller dans **Web**
2. Cliquer sur **Add a new web app**
3. Sélectionner **Manual configuration**
4. Choisir **Python 3.10**

### 📌 Étape 5 : Configuration WSGI

Éditer le fichier WSGI (`/var/www/VOTRE_USERNAME_pythonanywhere_com_wsgi.py`) :

```python
import sys
import os

# Ajouter le chemin du projet
path = '/home/VOTRE_USERNAME/iaPostemanage'
if path not in sys.path:
    sys.path.insert(0, path)

# Variables d'environnement
os.environ['SECRET_KEY'] = 'VOTRE-SECRET-KEY-ICI'

# Importer l'application
from app import app as application
```

### 📌 Étape 6 : Configuration des fichiers statiques

Dans la section **Static files** :

| URL            | Directory                                      |
|----------------|------------------------------------------------|
| `/static/`     | `/home/VOTRE_USERNAME/iaPostemanage/static/`   |

### 📌 Étape 7 : Variables d'environnement

Dans l'onglet **Web** → **Environment variables** :

```
SECRET_KEY=votre-secret-key-de-production
FLASK_ENV=production
```

### 📌 Étape 8 : Reload et test

1. Cliquer sur **Reload** (bouton vert)
2. Visiter `https://VOTRE_USERNAME.pythonanywhere.com/login`

### 🔧 Dépannage PythonAnywhere

**Erreur 502 Bad Gateway**
```bash
# Vérifier les logs d'erreur
tail -n 100 /var/log/VOTRE_USERNAME.pythonanywhere.com.error.log
```

**Module non trouvé**
```bash
# Réinstaller les dépendances
workon iaposte
pip install -r requirements.txt --force-reinstall
```

**Permissions denied**
```bash
# Vérifier les permissions
chmod 755 ~/iaPostemanage
chmod 644 ~/iaPostemanage/app.py
```

---

## Déploiement Vercel

### 📌 Étape 1 : Préparation

Créer `vercel.json` à la racine :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ],
  "env": {
    "SECRET_KEY": "@secret-key"
  }
}
```

Créer `wsgi.py` :

```python
from app import app

if __name__ == "__main__":
    app.run()
```

### 📌 Étape 2 : Installation Vercel CLI

```bash
npm install -g vercel
```

### 📌 Étape 3 : Déploiement

```bash
# Se connecter
vercel login

# Déployer
vercel --prod

# Ajouter la SECRET_KEY
vercel secrets add secret-key "VOTRE-SECRET-KEY-ICI"
```

### 📌 Étape 4 : Variables d'environnement

Dans le dashboard Vercel :

1. Aller dans **Settings** → **Environment Variables**
2. Ajouter :
   - `SECRET_KEY` : votre clé secrète
   - `FLASK_ENV` : `production`

---

## Déploiement Render

### 📌 Étape 1 : Préparation

Créer `render.yaml` :

```yaml
services:
  - type: web
    name: iaposte-manager
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: PYTHON_VERSION
        value: 3.10.0
```

### 📌 Étape 2 : Connexion GitHub

1. Créer un dépôt GitHub avec votre code
2. Se connecter à [Render](https://render.com)
3. Cliquer sur **New +** → **Web Service**
4. Connecter votre dépôt GitHub

### 📌 Étape 3 : Configuration

- **Name** : `iaposte-manager`
- **Environment** : `Python 3`
- **Build Command** : `pip install -r requirements.txt`
- **Start Command** : `gunicorn app:app`

### 📌 Étape 4 : Variables d'environnement

Ajouter dans **Environment** :

```
SECRET_KEY=votre-secret-key
FLASK_ENV=production
```

---

## Configuration avancée

### 🔐 Sécurité en production

**1. Changer le mot de passe par défaut**

Dans `app.py`, remplacer la logique d'authentification simple par une base de données avec mots de passe hashés :

```python
from werkzeug.security import generate_password_hash, check_password_hash

# Hash un mot de passe
hashed = generate_password_hash('mon_mot_de_passe')

# Vérifier un mot de passe
check_password_hash(hashed, 'tentative_mot_de_passe')
```

**2. Activer HTTPS**

Sur PythonAnywhere : Activé automatiquement  
Sur Vercel : Activé automatiquement  
Sur Render : Activé automatiquement  

**3. Configurer CORS strictement**

Dans `app.py` :

```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://votre-domaine.com"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})
```

### 📊 Migration vers PostgreSQL (production)

**1. Installer les dépendances**

```bash
pip install psycopg2-binary Flask-SQLAlchemy
```

**2. Configurer SQLAlchemy**

```python
from flask_sqlalchemy import SQLAlchemy

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
db = SQLAlchemy(app)
```

**3. Créer les modèles**

```python
class Deadline(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_name = db.Column(db.String(200))
    deadline_date = db.Column(db.DateTime)
    # ... autres champs
```

### 📧 Configuration Email (notifications)

**1. Installer Flask-Mail**

```bash
pip install Flask-Mail
```

**2. Configurer SMTP**

```python
from flask_mail import Mail, Message

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

mail = Mail(app)
```

**3. Envoyer des notifications**

```python
def send_deadline_alert(deadline):
    msg = Message(
        subject=f"⚠️ Délai urgent: {deadline['case_name']}",
        recipients=['avocat@cabinet.fr'],
        body=f"Le délai expire le {deadline['deadline_date']}"
    )
    mail.send(msg)
```

---

## Dépannage

### ❌ Erreur: ModuleNotFoundError

**Cause** : Dépendances manquantes

**Solution** :
```bash
pip install -r requirements.txt
```

### ❌ Erreur: Unauthorized (401)

**Cause** : Session expirée ou mauvaise configuration de Flask-Login

**Solution** :
```python
# Vérifier SECRET_KEY dans .env
# Vérifier que login_manager est bien initialisé
```

### ❌ Erreur: 404 Not Found sur /legal/dashboard

**Cause** : Routes non enregistrées ou templates introuvables

**Solution** :
```bash
# Vérifier que le dossier templates/ existe
# Vérifier que register_legal_routes() est appelé
```

### ❌ Static files (CSS/JS) ne chargent pas

**Cause** : Configuration des fichiers statiques incorrecte

**Solution PythonAnywhere** :
```
# Vérifier Static files mapping :
URL: /static/
Directory: /home/USERNAME/iaPostemanage/static/
```

**Solution Vercel** :
```json
{
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    }
  ]
}
```

### ❌ Erreur: werkzeug.routing.exceptions.BuildError

**Cause** : Template ou route introuvable

**Solution** :
```python
# Vérifier que render_template() pointe vers le bon fichier
# Vérifier l'arborescence templates/legal/
```

---

## 📊 Monitoring et logs

### PythonAnywhere

```bash
# Logs d'erreur
tail -f /var/log/VOTRE_USERNAME.pythonanywhere.com.error.log

# Logs d'accès
tail -f /var/log/VOTRE_USERNAME.pythonanywhere.com.access.log
```

### Vercel

```bash
# Dashboard Vercel → votre projet → Logs
# ou via CLI :
vercel logs
```

### Render

- Dashboard → votre service → **Logs**

---

## ✅ Checklist de déploiement

- [ ] SECRET_KEY générée aléatoirement
- [ ] Variables d'environnement configurées
- [ ] Dépendances installées (`requirements.txt`)
- [ ] Mot de passe admin changé
- [ ] HTTPS activé
- [ ] Fichiers statiques accessibles
- [ ] Base de données initialisée
- [ ] Tests effectués sur toutes les pages
- [ ] Notifications email configurées (optionnel)
- [ ] Monitoring activé
- [ ] Backups configurés (données)

---

## 🆘 Support

**Erreur non résolue ?**

1. Vérifier les logs d'erreur de votre plateforme
2. Vérifier que toutes les dépendances sont installées
3. Tester en local d'abord (`python app.py`)
4. Consulter la documentation officielle :
   - [Flask](https://flask.palletsprojects.com/)
   - [PythonAnywhere](https://help.pythonanywhere.com/)
   - [Vercel](https://vercel.com/docs)
   - [Render](https://render.com/docs)

---

## 📝 Changelog

**v3.0.0** (Actuelle)
- ✅ Authentification Flask-Login
- ✅ Modules juridiques complets
- ✅ Système de notifications professionnelles
- ✅ Dashboard et rapports Chart.js
- ✅ Guide de déploiement complet

**v2.0.0**
- ✅ Pages juridiques (délais, facturation, conformité)
- ✅ API REST complète

**v1.0.0**
- ✅ Application de base (emails, templates, contacts)

---

**🎉 Félicitations ! Votre application juridique est maintenant en production !**
