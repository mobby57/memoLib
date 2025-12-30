# 🔧 DEBUGGING PYTHONANYWHERE - SOLUTIONS

## ❌ ERREURS COURANTES ET SOLUTIONS

### 1. **ImportError - render_template_string**
**Erreur:** `ImportError: cannot import name 'render_template_string'`

**Solution:** Utiliser `flask_app_fixed.py` qui évite render_template_string
```python
# ❌ Problématique
from flask import render_template_string
return render_template_string(HTML_TEMPLATE)

# ✅ Solution
return '''<html>...</html>'''
```

### 2. **403 Forbidden Error**
**Cause:** Permissions fichiers incorrectes

**Solution:**
```bash
chmod 644 /home/sidmoro/mysite/flask_app.py
chmod 755 /home/sidmoro/mysite/data
```

### 3. **Connection Refused**
**Cause:** Application ne démarre pas

**Solution:** Vérifier syntaxe Python
```python
# Tester localement
python3 flask_app.py
```

### 4. **Database Connection Errors**
**Cause:** Chemin DATA_DIR incorrect

**Solution:**
```python
# ✅ Chemin correct PythonAnywhere
DATA_DIR = Path('/home/sidmoro/mysite/data')
```

## 🔍 VÉRIFICATION LOGS

### Accéder aux logs
- **Error log:** sidmoro.pythonanywhere.com.error.log
- **Server log:** sidmoro.pythonanywhere.com.server.log

### Erreurs typiques dans les logs
```
ImportError: No module named 'flask_cors'
→ Solution: pip3.10 install --user flask-cors

UnicodeDecodeError: 'ascii' codec
→ Solution: Ajouter encoding='utf-8'

PermissionError: [Errno 13]
→ Solution: chmod 755 sur dossiers
```

## ✅ FICHIER CORRIGÉ PRÊT

**Utiliser:** `flask_app_fixed.py`

**Corrections apportées:**
- ✅ Suppression render_template_string
- ✅ HTML intégré directement
- ✅ Encodage UTF-8 correct
- ✅ Chemins PythonAnywhere
- ✅ Gestion erreurs simplifiée

## 🚀 DÉPLOIEMENT RAPIDE

1. **Copier** le contenu de `flask_app_fixed.py`
2. **Coller** dans `/home/sidmoro/mysite/flask_app.py`
3. **Reload** application Web tab

**Résultat:** Application fonctionnelle sans erreurs

## 📞 SUPPORT

Si problème persiste:
- **Email:** liveusercare@pythonanywhere.com
- **Forums:** PythonAnywhere community
- **Feedback:** Lien "Send feedback" sur le site