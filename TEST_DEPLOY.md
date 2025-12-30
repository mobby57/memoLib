# 🧪 TEST DÉPLOIEMENT - 5 MB

## ✅ ARCHIVE TESTÉE: iapostemanager_test.zip (5 MB)

### 🔍 VÉRIFICATIONS:
- ✅ Import FastAPI fonctionne
- ✅ Structure src/ complète
- ✅ WSGI configuré
- ✅ Variables d'environnement

### 🚀 DÉPLOIEMENT MAINTENANT:

1. **PythonAnywhere**: https://www.pythonanywhere.com
2. **Upload**: iapostemanager_test.zip
3. **Console**: `unzip iapostemanager_test.zip`
4. **Web App**: Manual → Python 3.10
5. **WSGI**: Copier wsgi_pythonanywhere.py
6. **Install**:
```bash
mkvirtualenv iapostemanager --python=python3.10
pip install -r requirements.txt
pip install asgiref
cp .env.production .env
mkdir -p data
```

### ⚡ TEMPS: 15 minutes
### 📊 TAILLE: 5 MB (rapide upload)

**PRÊT POUR TEST !**