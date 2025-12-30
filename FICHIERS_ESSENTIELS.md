# 📦 FICHIERS ESSENTIELS POUR DÉPLOIEMENT

## ✅ GARDER (< 1 MB total):
- src/ (dossier complet)
- requirements.txt
- wsgi_pythonanywhere.py
- .env.production
- app.py (backup Flask)

## ❌ SUPPRIMER (économiser 99 MB):

### Documentation (30+ MB)
- Tous les .md (sauf README.md)
- docs/ (dossier complet)

### Tests & Dev (20+ MB)
- tests/ (dossier complet)
- .coverage, .coveragerc
- test_*.py, *_test.py

### Déploiement alternatif (15+ MB)
- docker-compose*.yml, Dockerfile*
- deploy_*.py, deploy_*.sh
- Procfile, railway.json, render.yaml
- vercel.json, .vercelignore

### Logs & Cache (10+ MB)
- logs/ (dossier complet)
- .backend.pid, .frontend.pid
- data/ (sauf structure)

### Config redondant (5+ MB)
- .env.* (sauf .env.production)
- config/ (dossier complet)
- *_config.py

### Scripts inutiles (10+ MB)
- scripts/ (dossier complet)
- *.bat, *.ps1
- install_*, start_*, fix_*

### Frontend (5+ MB)
- frontend/ (dossier complet)
- package.json, package-lock.json
- node_modules/ (si présent)

### Autres (5+ MB)
- migrations/ (créer sur serveur)
- backups/, examples/
- *.zip, *.tar.gz existants

## 🚀 COMMANDE NETTOYAGE:
```bash
# Supprimer tout sauf essentiels
# Garder: src/, requirements.txt, wsgi_pythonanywhere.py, .env.production, app.py
```

**RÉSULTAT: < 1 MB au lieu de 100+ MB**