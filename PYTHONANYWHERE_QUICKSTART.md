# ⚡ Guide Rapide PythonAnywhere

## 🎯 Déploiement en 10 Minutes

### Étape 1: Créer Compte (2 min)
1. https://www.pythonanywhere.com
2. Sign up → Beginner (gratuit)
3. Confirmer email

### Étape 2: Upload Fichiers (3 min)
**Files → Upload**
```
Sélectionner tous les fichiers du projet:
- run_server.py
- requirements_pythonanywhere.txt
- .env_pythonanywhere
- wsgi_pythonanywhere.py
- backend/ (dossier complet)
- templates/ (si utilisé)
- static/ (si utilisé)
```

### Étape 3: Web App (2 min)
**Web → Add new web app**
- Framework: **Manual configuration**
- Python: **3.10**
- Source code: `/home/yourusername/iapostemanage`

### Étape 4: WSGI Configuration (2 min)
**Web → WSGI configuration file** (cliquer sur le lien)

Remplacer TOUT le contenu par:
```python
#!/usr/bin/python3.10
import sys
import os

# ⚠️ REMPLACER yourusername par VOTRE nom d'utilisateur
path = '/home/yourusername/iapostemanage'
if path not in sys.path:
    sys.path.insert(0, path)

from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

from run_server import app as application
```

### Étape 5: Console Bash (1 min)
**Consoles → Bash**
```bash
cd iapostemanage
pip3.10 install --user -r requirements_pythonanywhere.txt
```

### Étape 6: Configuration .env (1 min)
**Files → iapostemanage → .env_pythonanywhere**

Renommer en `.env` et éditer:
```bash
SECRET_KEY=changez-cette-cle-secrete-ici
DATABASE_URL=postgresql://user:pass@host/db
OPENAI_API_KEY=sk-proj-votre-cle
```

### Étape 7: Reload (30 sec)
**Web → Reload yourusername.pythonanywhere.com**

## ✅ Test
Ouvrir: `https://yourusername.pythonanywhere.com`

## 🐛 Dépannage Express

### Erreur 500
```bash
# Console Bash
tail -20 /var/log/yourusername.pythonanywhere.com.error.log
```

### Import Error
```bash
# Réinstaller dépendances
cd ~/iapostemanage
pip3.10 install --user -r requirements_pythonanywhere.txt --upgrade
```

### Database Error
Utiliser PostgreSQL externe:
- **ElephantSQL** (gratuit 20MB): https://www.elephantsql.com
- **Supabase** (gratuit 500MB): https://supabase.com

## 📊 Limites Gratuit
- ✅ CPU: 100 secondes/jour
- ✅ Stockage: 512MB
- ✅ Trafic: Illimité
- ✅ HTTPS gratuit
- ❌ Base de données incluse (utiliser externe)

## 🎉 Résultat
**URL finale:** https://yourusername.pythonanywhere.com

**Temps total:** 10 minutes

**Coût:** 0€/mois
