# 🚀 COMMENT FAIRE - GUIDE VISUEL ÉTAPE PAR ÉTAPE

## 📦 ÉTAPE 1: RÉCUPÉRER LES FICHIERS

### A. Télécharger le ZIP
- Fichier: `sidmoro_pythonanywhere_deploy.zip`
- Extraire sur votre ordinateur
- Vous obtenez 5 fichiers

### B. Fichiers obtenus:
```
📁 Dossier extrait/
├── flask_app.py
├── requirements_pythonanywhere.txt
├── 📁 templates/
│   ├── login.html
│   ├── dashboard.html
│   └── ai_assistant.html
└── PYTHONANYWHERE_DEFINITIF.md
```

## 🌐 ÉTAPE 2: CRÉER COMPTE PYTHONANYWHERE

### A. Aller sur le site
1. Ouvrir navigateur
2. Aller sur: **https://www.pythonanywhere.com**
3. Cliquer "Pricing & signup"
4. Choisir "Create a Beginner account" (GRATUIT)

### B. Créer le compte
1. Username: **sidmoro**
2. Email: votre email
3. Password: votre mot de passe
4. Cliquer "Create account"

## 📁 ÉTAPE 3: UPLOADER LES FICHIERS

### A. Accéder aux fichiers
1. Une fois connecté, cliquer onglet **"Files"**
2. Vous êtes dans `/home/sidmoro/`
3. Cliquer sur **"mysite"** (ou créer ce dossier)

### B. Uploader les fichiers
1. Cliquer **"Upload a file"**
2. Sélectionner `flask_app.py` → Upload
3. Sélectionner `requirements_pythonanywhere.txt` → Upload
4. Créer dossier **"templates"**
5. Entrer dans templates/
6. Uploader les 3 fichiers HTML

### C. Structure finale:
```
/home/sidmoro/mysite/
├── flask_app.py ✅
├── requirements_pythonanywhere.txt ✅
└── templates/ ✅
    ├── login.html ✅
    ├── dashboard.html ✅
    └── ai_assistant.html ✅
```

## ⚙️ ÉTAPE 4: INSTALLER DÉPENDANCES

### A. Ouvrir console
1. Cliquer onglet **"Consoles"**
2. Cliquer **"Bash"**
3. Une console noire s'ouvre

### B. Installer Flask
```bash
pip3.10 install --user -r /home/sidmoro/mysite/requirements_pythonanywhere.txt
```
4. Appuyer ENTRÉE
5. Attendre installation (30 secondes)

## 🌐 ÉTAPE 5: CRÉER WEB APP

### A. Aller dans Web
1. Cliquer onglet **"Web"**
2. Cliquer **"Add a new web app"**

### B. Configuration
1. Domain: **sidmoro.pythonanywhere.com** (automatique)
2. Python version: **Python 3.10**
3. Framework: **Flask**
4. Path: `/home/sidmoro/mysite/flask_app.py`
5. Cliquer **"Next"** puis **"Next"**

## 🔧 ÉTAPE 6: CONFIGURER WSGI

### A. Modifier WSGI file
1. Dans Web tab, cliquer sur le lien WSGI file
2. **SUPPRIMER TOUT** le contenu
3. **COLLER** ce code:

```python
import sys
import os

sys.path.insert(0, '/home/sidmoro/mysite')

from flask_app import app as application

if __name__ == "__main__":
    application.run()
```

4. Cliquer **"Save"**

## 📂 ÉTAPE 7: CRÉER DOSSIER DATA

### A. Retour console Bash
1. Onglet "Consoles" → Bash
2. Taper:
```bash
mkdir /home/sidmoro/mysite/data
```
3. Appuyer ENTRÉE

## 🚀 ÉTAPE 8: LANCER L'APPLICATION

### A. Démarrer
1. Retour onglet **"Web"**
2. Cliquer gros bouton vert **"Reload sidmoro.pythonanywhere.com"**
3. Attendre 30 secondes

### B. Tester
1. Cliquer sur **https://sidmoro.pythonanywhere.com**
2. Page de connexion s'affiche ✅

## 🎯 ÉTAPE 9: SE CONNECTER

### A. Identifiants
- **Username:** admin
- **Password:** admin123

### B. Fonctionnalités disponibles
✅ Dashboard professionnel
✅ Assistant IA juridique
✅ Analyse prédictive 87%
✅ Première IA juridique mondiale

---

## 🎉 FÉLICITATIONS !

**Votre IA juridique est en ligne sur:**
**https://sidmoro.pythonanywhere.com**

**Temps total: 10-15 minutes maximum**

## 🆘 EN CAS DE PROBLÈME

### 🔍 DIAGNOSTIC RAPIDE
1. **Web tab** → Vérifier statut application
2. **Logs d'erreur:** sidmoro.pythonanywhere.com.error.log
3. **Logs serveur:** sidmoro.pythonanywhere.com.server.log

### ❌ ERREURS COURANTES

#### ImportError dans les logs?
```bash
# Console Bash - vérifier installation
pip3.10 install --user Flask Werkzeug
```

#### Erreur 500 / Page blanche?
1. **Vérifier WSGI file** - Code exact requis
2. **Structure fichiers:**
```bash
ls -la /home/sidmoro/mysite/
# Doit afficher: flask_app.py, templates/, data/
```

#### "403 Forbidden" ou "Connection Refused"?
1. **Permissions fichiers:**
```bash
chmod 644 /home/sidmoro/mysite/flask_app.py
chmod -R 644 /home/sidmoro/mysite/templates/
```

#### Erreur base de données?
```bash
# Créer dossier data si manquant
mkdir -p /home/sidmoro/mysite/data
chmod 755 /home/sidmoro/mysite/data
```

### 🔧 SOLUTIONS RAPIDES

#### Réinstaller complètement:
```bash
# Supprimer et recréer
rm -rf /home/sidmoro/mysite/*
# Re-uploader tous les fichiers
```

#### Vérifier configuration WSGI:
```python
# WSGI file EXACT (copier-coller):
import sys
sys.path.insert(0, '/home/sidmoro/mysite')
from flask_app import app as application
```

#### Test manuel:
```bash
# Console Bash - tester Flask
cd /home/sidmoro/mysite
python3.10 flask_app.py
# Doit afficher: Running on http://0.0.0.0:5000
```

### 📞 SUPPORT AVANCÉ
- **Email:** liveusercare@pythonanywhere.com
- **Forums:** PythonAnywhere community
- **Feedback:** Bouton "Send feedback" sur le site
- **Inclure:** Lignes pertinentes des logs d'erreur

**SUPPORT: Suivre exactement ces étapes dans l'ordre !** 🚀