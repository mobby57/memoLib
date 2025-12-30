# 🚀 DÉPLOIEMENT PYTHONANYWHERE - INSTRUCTIONS EXACTES

## ✅ ARCHIVE PRÊTE: iapostemanage_final.zip (149 MB)

## 📋 ÉTAPES À SUIVRE MAINTENANT:

### 1. CRÉER COMPTE PYTHONANYWHERE
- Aller sur: https://www.pythonanywhere.com
- Cliquer: "Create a Beginner account"
- Remplir formulaire et confirmer email

### 2. UPLOAD FICHIERS
- Dashboard → Files
- Cliquer "Upload a file"
- Sélectionner: iapostemanage_final.zip
- Attendre upload complet

### 3. EXTRAIRE ARCHIVE
- Ouvrir Console Bash
- Taper: `unzip iapostemanage_final.zip`
- Vérifier: `ls -la` (doit voir dossier src/)

### 4. CRÉER WEB APP
- Dashboard → Web
- "Add a new web app"
- "Manual configuration"
- "Python 3.10"
- Cliquer "Next"

### 5. CONFIGURER WSGI
- Cliquer sur le lien WSGI configuration file
- SUPPRIMER tout le contenu
- COPIER-COLLER le contenu de wsgi_pythonanywhere.py
- CHANGER ligne 10: yourusername → VOTRE_USERNAME
- Save

### 6. CRÉER VIRTUALENV
Console Bash:
```bash
mkvirtualenv iapostemanage --python=python3.10
cd ~/iapostemanage
pip install -r requirements.txt
pip install asgiref
```

### 7. CONFIGURER ENVIRONNEMENT
```bash
cp .env.production .env
mkdir -p data
python -c "from src.backend.database import init_db; init_db()"
```

### 8. CONFIGURER VIRTUALENV DANS WEB APP
- Web → Section Virtualenv
- Entrer: /home/VOTRE_USERNAME/.virtualenvs/iapostemanage

### 9. RELOAD ET TEST
- Cliquer "Reload" (bouton vert)
- Attendre 30 secondes
- Tester: https://VOTRE_USERNAME.pythonanywhere.com/health

## 🆘 EN CAS DE PROBLÈME:
```bash
tail -n 50 /var/log/VOTRE_USERNAME.pythonanywhere.com.error.log
```

## ✅ SUCCÈS SI VOUS VOYEZ:
```json
{
  "app": "IAPosteManager",
  "version": "4.0.0", 
  "status": "running"
}
```

**TEMPS TOTAL: ~20 minutes**
**COÛT: 0€**