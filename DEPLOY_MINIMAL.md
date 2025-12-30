# 🚀 DÉPLOIEMENT MINIMAL - 42 KB

## ✅ ARCHIVE: iapostemanage_minimal.zip (42 KB)

## 📋 DÉPLOIEMENT RAPIDE:

### 1. PYTHONANYWHERE
- https://www.pythonanywhere.com → Compte gratuit
- Files → Upload → iapostemanage_minimal.zip
- Console: `unzip iapostemanage_minimal.zip`

### 2. WEB APP
- Web → Add new web app → Manual → Python 3.10
- WSGI file → Copier contenu wsgi_pythonanywhere.py
- Ligne 10: yourusername → VOTRE_USERNAME

### 3. INSTALLATION
```bash
mkvirtualenv iapostemanage --python=python3.10
cd ~/iapostemanage
pip install -r requirements.txt
pip install asgiref
cp .env.production .env
mkdir -p data
python -c "from src.backend.database import init_db; init_db()"
```

### 4. FINALISER
- Web → Virtualenv: /home/USERNAME/.virtualenvs/iapostemanage
- Reload → Test: https://USERNAME.pythonanywhere.com/health

**TEMPS: 10 minutes**
**TAILLE: 42 KB seulement !**