# 🚀 Déploiement PythonAnywhere - IA Poste Manager

## 📋 Guide Étape par Étape

### 1. Créer Compte PythonAnywhere
- Aller sur https://www.pythonanywhere.com
- Créer compte gratuit (Beginner)
- Confirmer email et se connecter

### 2. Upload Fichiers
**Via interface Files:**
```
/home/yourusername/
├── iapostemanage/
│   ├── app.py
│   ├── requirements_pythonanywhere.txt → requirements.txt
│   ├── .env_pythonanywhere → .env
│   ├── wsgi_pythonanywhere.py
│   ├── templates/
│   │   ├── index.html
│   │   └── generate.html
│   └── static/
│       ├── style.css
│       └── script.js
```

### 3. Configuration Web App
- **Web** → **Add new web app**
- **Framework:** Flask
- **Python version:** 3.10
- **Source code:** `/home/yourusername/iapostemanage`

### 4. Configurer WSGI File
**Remplacer contenu de:** `/var/www/yourusername_pythonanywhere_com_wsgi.py`
```python
#!/usr/bin/python3.10
import sys
import os

# Remplacer 'yourusername' par votre nom d'utilisateur
path = '/home/yourusername/iapostemanage'
if path not in sys.path:
    sys.path.insert(0, path)

from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

from app import app as application
```

### 5. Installer Dépendances
**Console Bash:**
```bash
cd iapostemanage
pip3.10 install --user -r requirements.txt
```

### 6. Configurer Variables
**Éditer `.env`:**
```bash
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=votre-cle-secrete-ici
OPENAI_API_KEY=votre-cle-openai-ici
```

### 7. Reload Web App
- **Web** → **Reload yourusername.pythonanywhere.com**
- Attendre 30 secondes
- Tester: https://yourusername.pythonanywhere.com

## 🔧 Dépannage

### Erreurs Communes
- **500 Error:** Vérifier logs dans Web → Error log
- **Import Error:** Vérifier requirements.txt installé
- **Path Error:** Vérifier chemin dans WSGI file

### Logs Utiles
```bash
# Console Bash
tail -f /var/log/yourusername.pythonanywhere.com.error.log
```

## 📊 Limites Tier Gratuit
- **CPU:** 100 secondes/jour
- **Stockage:** 512MB
- **Trafic:** Illimité
- **Domaine:** yourusername.pythonanywhere.com

---
**URL finale:** https://yourusername.pythonanywhere.com
**Coût:** 0€/mois (tier gratuit)
**Temps déploiement:** 15 minutes