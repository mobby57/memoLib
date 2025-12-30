# 🔧 CONFIGURATION ENVIRONNEMENT - IA POSTE MANAGER

## 📋 VARIABLES D'ENVIRONNEMENT REQUISES

### 🔐 **Sécurité**
```bash
SECRET_KEY=votre-cle-secrete-unique-32-caracteres
FLASK_ENV=production
```

### 🗄️ **Base de Données**
```bash
DATABASE_URL=sqlite:///iapostemanage.db
DATA_DIR=/home/sidmoro/mysite/data
```

### 🤖 **IA & Services**
```bash
CESEDA_AI_MODEL=proprietary-v1
PREDICTION_THRESHOLD=0.87
MAX_CASES_ANALYSIS=50000
```

### 📧 **Email (Optionnel)**
```bash
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-app
```

### 🏢 **Cabinet Avocat**
```bash
CABINET_NAME=MS CONSEILS
CABINET_SIRET=12345678901234
CABINET_ADDRESS=123 Rue de la Justice, 75001 Paris
```

---

## 🚀 CONFIGURATION PYTHONANYWHERE

### 1. **Accéder aux Variables**
- Dashboard PythonAnywhere
- Onglet **Web**
- Section **Environment variables**

### 2. **Ajouter Variables Essentielles**
```
SECRET_KEY = iaposte-manager-secret-key-2025
FLASK_ENV = production
DATA_DIR = /home/sidmoro/mysite/data
CESEDA_AI_MODEL = proprietary-v1
CABINET_NAME = MS CONSEILS
```

### 3. **Variables Optionnelles**
```
PREDICTION_THRESHOLD = 0.87
MAX_CASES_ANALYSIS = 50000
DEBUG_MODE = False
```

---

## 💻 CONFIGURATION LOCALE (.env)

### Créer fichier `.env`
```bash
# Sécurité
SECRET_KEY=dev-key-local-only
FLASK_ENV=development

# Base de données
DATA_DIR=./data
DATABASE_URL=sqlite:///local.db

# IA CESEDA
CESEDA_AI_MODEL=proprietary-v1
PREDICTION_THRESHOLD=0.87

# Cabinet
CABINET_NAME=MS CONSEILS - DEV
CABINET_SIRET=12345678901234

# Debug
DEBUG_MODE=True
```

---

## 🔧 UTILISATION DANS LE CODE

### Mise à jour flask_app.py
```python
import os
from pathlib import Path

# Configuration sécurisée
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'demo-key-change-in-production')
app.config['DEBUG'] = os.getenv('DEBUG_MODE', 'False').lower() == 'true'

# Chemins dynamiques
DATA_DIR = Path(os.getenv('DATA_DIR', '/home/sidmoro/mysite/data'))
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///iapostemanage.db')

# Configuration IA
PREDICTION_THRESHOLD = float(os.getenv('PREDICTION_THRESHOLD', '0.87'))
MAX_CASES = int(os.getenv('MAX_CASES_ANALYSIS', '50000'))

# Cabinet
CABINET_NAME = os.getenv('CABINET_NAME', 'MS CONSEILS')
CABINET_SIRET = os.getenv('CABINET_SIRET', '12345678901234')
```

---

## 🎯 CONFIGURATION PAR ENVIRONNEMENT

### **Développement Local**
```bash
FLASK_ENV=development
DEBUG_MODE=True
DATA_DIR=./data
SECRET_KEY=dev-key-local
```

### **Production PythonAnywhere**
```bash
FLASK_ENV=production
DEBUG_MODE=False
DATA_DIR=/home/sidmoro/mysite/data
SECRET_KEY=production-secure-key-32-chars
```

### **Test/Staging**
```bash
FLASK_ENV=testing
DEBUG_MODE=True
DATA_DIR=/tmp/test-data
SECRET_KEY=test-key-staging
```

---

## ✅ VÉRIFICATION CONFIGURATION

### Script de test
```python
import os

def check_env():
    required_vars = [
        'SECRET_KEY',
        'FLASK_ENV', 
        'DATA_DIR',
        'CABINET_NAME'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        status = "✅" if value else "❌"
        print(f"{status} {var}: {value or 'NON DÉFINI'}")

if __name__ == '__main__':
    check_env()
```

---

## 🔒 SÉCURITÉ PRODUCTION

### Variables sensibles à protéger
- ✅ `SECRET_KEY` - Clé de session Flask
- ✅ `DATABASE_URL` - Connexion base de données  
- ✅ `MAIL_PASSWORD` - Mot de passe email
- ✅ `API_KEYS` - Clés API externes

### Bonnes pratiques
- Utiliser des clés de 32+ caractères
- Différentes clés par environnement
- Rotation régulière des secrets
- Jamais de secrets dans le code source

---

**🎯 Configuration adaptée spécifiquement au projet IA Poste Manager avec toutes les variables nécessaires pour le fonctionnement optimal.**