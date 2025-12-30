# 🔧 DEBUGGING PYTHONANYWHERE - GUIDE COMPLET

## 🚨 DIAGNOSTIC IMMÉDIAT

### 1. VÉRIFIER STATUT APPLICATION
- **Web tab** → Voir si erreurs affichées
- **URL test:** https://sidmoro.pythonanywhere.com
- **Statut attendu:** Page de connexion

### 2. CONSULTER LES LOGS
```
📋 Logs disponibles:
├── sidmoro.pythonanywhere.com.error.log   # Erreurs Python
└── sidmoro.pythonanywhere.com.server.log  # Erreurs serveur
```

## ❌ ERREURS FRÉQUENTES & SOLUTIONS

### 🔴 ImportError dans les logs

**Symptôme:** `ImportError: No module named 'flask'`

**Solution:**
```bash
# Console Bash
pip3.10 install --user Flask==2.3.3 Werkzeug==2.3.7
```

### 🔴 Erreur 500 / Page blanche

**Symptôme:** Page d'erreur 500 ou page complètement blanche

**Solutions:**
1. **Vérifier WSGI file** (code exact requis):
```python
import sys
sys.path.insert(0, '/home/sidmoro/mysite')
from flask_app import app as application
```

2. **Vérifier structure fichiers:**
```bash
ls -la /home/sidmoro/mysite/
# Doit afficher:
# flask_app.py
# requirements_pythonanywhere.txt  
# templates/
# data/
```

### 🔴 "403 Forbidden" ou "Connection Refused"

**Symptôme:** Accès refusé à l'application

**Solution - Permissions:**
```bash
chmod 644 /home/sidmoro/mysite/flask_app.py
chmod -R 644 /home/sidmoro/mysite/templates/*
chmod 755 /home/sidmoro/mysite/data
```

### 🔴 Erreur base de données

**Symptôme:** `FileNotFoundError: data directory`

**Solution:**
```bash
mkdir -p /home/sidmoro/mysite/data
chmod 755 /home/sidmoro/mysite/data
```

### 🔴 Template not found

**Symptôme:** `TemplateNotFound: login.html`

**Solution:**
```bash
# Vérifier templates
ls -la /home/sidmoro/mysite/templates/
# Doit contenir: login.html, dashboard.html, ai_assistant.html
```

## 🔧 TESTS DE DIAGNOSTIC

### Test 1: Vérifier installation Flask
```bash
python3.10 -c "import flask; print(flask.__version__)"
# Doit afficher: 2.3.3
```

### Test 2: Test manuel application
```bash
cd /home/sidmoro/mysite
python3.10 flask_app.py
# Doit afficher: Running on http://0.0.0.0:5000
# Ctrl+C pour arrêter
```

### Test 3: Vérifier imports
```bash
python3.10 -c "from flask_app import app; print('OK')"
# Doit afficher: OK
```

## 🚀 SOLUTIONS RADICALES

### Solution 1: Réinstallation complète
```bash
# Supprimer tout
rm -rf /home/sidmoro/mysite/*

# Re-créer structure
mkdir -p /home/sidmoro/mysite/templates
mkdir -p /home/sidmoro/mysite/data

# Re-uploader tous les fichiers
# Suivre étapes 3-8 du guide principal
```

### Solution 2: WSGI file de secours
```python
# Si problème WSGI, utiliser cette version:
import sys
import os

# Debug path
print("Python path:", sys.path)
print("Current dir:", os.getcwd())

sys.path.insert(0, '/home/sidmoro/mysite')

try:
    from flask_app import app as application
    print("Flask app imported successfully")
except Exception as e:
    print("Import error:", str(e))
    raise

if __name__ == "__main__":
    application.run()
```

### Solution 3: Flask app minimal de test
```python
# Créer test_app.py pour diagnostic
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Test OK - Flask fonctionne!"

if __name__ == '__main__':
    app.run()
```

## 📞 SUPPORT AVANCÉ

### Avant de contacter le support:
1. **Copier logs d'erreur** complets
2. **Noter étapes exactes** suivies
3. **Tester solutions** ci-dessus

### Contacts support:
- **Email:** liveusercare@pythonanywhere.com
- **Forums:** https://www.pythonanywhere.com/forums/
- **Feedback:** Bouton "Send feedback" sur PythonAnywhere

### Template email support:
```
Sujet: Erreur déploiement Flask - sidmoro.pythonanywhere.com

Bonjour,

J'ai un problème avec mon application Flask:
- Username: sidmoro
- URL: https://sidmoro.pythonanywhere.com
- Erreur: [décrire le problème]

Logs d'erreur:
[coller les lignes pertinentes des logs]

Étapes suivies:
[lister les étapes du guide suivies]

Merci pour votre aide.
```

## ✅ CHECKLIST FINALE

Avant de déclarer échec, vérifier:
- [ ] Compte PythonAnywhere créé avec username `sidmoro`
- [ ] 5 fichiers uploadés dans `/home/sidmoro/mysite/`
- [ ] Flask installé: `pip3.10 install --user Flask Werkzeug`
- [ ] Web app créée (Python 3.10, Flask)
- [ ] WSGI file modifié avec code exact
- [ ] Dossier `data/` créé
- [ ] Application rechargée (Reload button)
- [ ] Logs consultés pour erreurs spécifiques

**SI TOUT EST ✅ ET ÇA NE MARCHE PAS → CONTACTER SUPPORT**

---

## 🎯 RÉSULTAT ATTENDU

**URL:** https://sidmoro.pythonanywhere.com
**Page:** Formulaire de connexion MS CONSEILS
**Login:** admin / admin123
**Résultat:** Dashboard IA juridique opérationnel

**99% des problèmes sont résolus avec ce guide !** 🚀