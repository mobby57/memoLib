# 🚀 DÉPLOIEMENT FINAL

## 📦 ARCHIVE PRÊTE
`iapostemanager_clean.zip` (5 MB)

## 🎯 ÉTAPES
1. https://www.pythonanywhere.com → Compte gratuit
2. Files → Upload → iapostemanager_clean.zip
3. Console: `unzip iapostemanager_clean.zip`
4. Web → Add web app → Manual → Python 3.10
5. WSGI file → Copier wsgi_pythonanywhere.py (changer username ligne 10)
6. Console:
```bash
mkvirtualenv iapostemanager --python=python3.10
cd ~/iapostemanager
pip install -r requirements.txt
pip install asgiref
cp .env.production .env
mkdir -p data
```
7. Web → Virtualenv: `/home/USERNAME/.virtualenvs/iapostemanager`
8. Reload → Test: https://USERNAME.pythonanywhere.com/health

## ✅ SUCCÈS
```json
{"app": "IAPosteManager", "status": "running"}
```

**15 minutes total**