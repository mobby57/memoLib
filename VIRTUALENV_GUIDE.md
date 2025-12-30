# 🔧 VIRTUALENV PYTHONANYWHERE - SOLUTION DÉFINITIVE

## ⚠️ PROBLÈME VIRTUALENV

PythonAnywhere demande un virtualenv pour Flask. **LAISSEZ VIDE** pour utiliser le système par défaut.

## ✅ SOLUTION SIMPLE

### OPTION 1: LAISSER VIDE (RECOMMANDÉ)
- Dans Web tab → Virtualenv field
- **LAISSER COMPLÈTEMENT VIDE**
- Cliquer "Reload"

### OPTION 2: CRÉER VIRTUALENV (SI NÉCESSAIRE)

#### A. Créer virtualenv
```bash
# Console Bash
cd /home/sidmoro
python3.10 -m venv mysite-venv
```

#### B. Activer et installer
```bash
source mysite-venv/bin/activate
pip install Flask==2.3.3 Werkzeug==2.3.7
```

#### C. Configurer dans Web tab
- Virtualenv path: `/home/sidmoro/mysite-venv`
- Cliquer "Reload"

## 🚀 CONFIGURATION FINALE WEB APP

### Dans Web tab:
- **Source code:** `/home/sidmoro/mysite`
- **Working directory:** `/home/sidmoro/mysite`
- **WSGI configuration file:** Cliquer et modifier avec:

```python
import sys
import os

# Add your project directory to sys.path
sys.path.insert(0, '/home/sidmoro/mysite')

from flask_app import app as application

if __name__ == "__main__":
    application.run()
```

### Virtualenv field:
- **LAISSER VIDE** ou `/home/sidmoro/mysite-venv`

## ✅ ÉTAPES FINALES

1. **Vérifier structure:**
```bash
ls -la /home/sidmoro/mysite/
# Doit contenir: flask_app.py, templates/, data/
```

2. **Tester Flask:**
```bash
cd /home/sidmoro/mysite
python3.10 -c "import flask; print('Flask OK')"
```

3. **Reload application:**
- Web tab → **Reload sidmoro.pythonanywhere.com**

4. **Tester URL:**
- https://sidmoro.pythonanywhere.com

## 🎯 RÉSULTAT ATTENDU

- **Page de connexion** MS CONSEILS
- **Login:** admin / admin123
- **Dashboard** IA juridique fonctionnel

**VIRTUALENV VIDE = SOLUTION LA PLUS SIMPLE !** 🚀