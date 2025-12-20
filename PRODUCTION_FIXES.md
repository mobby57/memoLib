# 🔧 Corrections Production Critiques

## 1. PostgreSQL sur Render (5 min)

### Créer la base
1. Dashboard Render → "New +" → "PostgreSQL"
2. Name: `iapostemanager-db`
3. Plan: Free
4. Créer

### Récupérer l'URL
```bash
# Render vous donne automatiquement :
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Mettre à jour app.py
```python
import os
from sqlalchemy import create_engine

# Remplacer SQLite par PostgreSQL
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///app.db')
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

engine = create_engine(DATABASE_URL)
```

## 2. Variables d'Environnement Render

Dans Render → Environment :
```
DATABASE_URL=postgresql://...
SECRET_KEY=your-super-secret-key-here
FLASK_ENV=production
OPENAI_API_KEY=sk-...
```

## 3. Health Check Endpoint

Ajouter dans app.py :
```python
@app.route('/health')
def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.2.0'
    }
```

## 4. Gestion d'Erreurs Globale

```python
@app.errorhandler(500)
def internal_error(error):
    return {'error': 'Internal server error'}, 500

@app.errorhandler(404)
def not_found(error):
    return {'error': 'Not found'}, 404
```

## 5. Logging Production

```python
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
```

## 6. Requirements.txt Mise à Jour

Ajouter :
```
psycopg2-binary==2.9.7
flask-limiter==3.5.0
flask-cors==4.0.0
gunicorn==21.2.0
```

## 7. Script de Migration

```python
# migrate_to_postgres.py
import sqlite3
import psycopg2
import os

def migrate_sqlite_to_postgres():
    # Code de migration SQLite → PostgreSQL
    pass
```

## ✅ Checklist Production

- [ ] PostgreSQL configuré
- [ ] Variables d'environnement définies
- [ ] Health check endpoint
- [ ] Gestion d'erreurs globale
- [ ] Logging configuré
- [ ] Requirements.txt mis à jour
- [ ] Migration données effectuée

**Temps total : 30 minutes**