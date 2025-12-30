# 🏛️ NETTOYAGE CABINET AVOCAT - CESEDA

## ✅ GARDER (Gestion autonome emails)
- `src/` - Code backend FastAPI
- `templates/` - Interface web avocat
- `static/` - CSS/JS interface
- `app.py` - Application Flask backup
- `requirements.txt` - Dépendances
- `wsgi_pythonanywhere.py` - Config serveur
- `.env.production` - Variables
- `README.md` - Documentation

## 🗑️ SUPPRIMER (Tout le reste)
```powershell
# Supprimer dossiers inutiles
Remove-Item -Recurse -Force models, mobile-app, public, ssl, scripts_personnalises
Remove-Item -Recurse -Force .github, config, frontend-react, nginx, scripts
Remove-Item -Recurse -Force services, tests, venv, generated_code, examples
Remove-Item -Recurse -Force logs, security, monitoring, prisma, frontend
Remove-Item -Recurse -Force docker, deploy, backups, .cursor, node_modules
Remove-Item -Recurse -Force migrations, credentials, dist, .pytest_cache

# Supprimer fichiers redondants
Remove-Item *.zip, *.tar.gz, *.md (sauf README.md)
Remove-Item *.py (sauf app.py, wsgi_pythonanywhere.py)
Remove-Item *.json, *.yml, *.yaml, *.sh, *.bat, *.ps1
```

## 🎯 RÉSULTAT
**Cabinet avocat CESEDA** - Gestion autonome emails
- Interface web moderne
- Templates juridiques
- Génération IA
- Envoi automatique
- Base clients

**Taille finale: < 2 MB**