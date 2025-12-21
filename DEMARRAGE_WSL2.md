# 🚀 DEMARRAGE QUOTIDIEN - WSL2

## ✅ Configuration terminée !

La migration PostgreSQL est **RÉUSSIE** via WSL2 Ubuntu !

---

## 📋 Démarrage Rapide (3 commandes)

### 1. Démarrer PostgreSQL (Docker Windows)

```powershell
# Terminal Windows PowerShell
docker-compose -f docker-compose.production.yml up -d postgres
```

### 2. Lancer Backend (WSL2 Linux)

```powershell
# Terminal Windows - Ouvrir WSL2
wsl

# Dans WSL2:
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate
cd src/backend
python app.py
```

**Résultat:** Backend sur http://127.0.0.1:5000

---

### 3. Lancer Frontend (Windows)

```powershell
# Terminal Windows PowerShell (nouveau terminal)
cd C:\Users\moros\Desktop\iaPostemanage\src\frontend
npm run dev
```

**Résultat:** Frontend sur http://localhost:3003

---

## 🔄 Workflow de Développement

### Configuration WSL2 (1 seule fois)

```bash
# Dans WSL2
cd /mnt/c/Users/moros/Desktop/iaPostemanage

# Si venv-linux n'existe pas:
python3 -m venv venv-linux
source venv-linux/bin/activate
pip install -r requirements.txt
pip install alembic==1.17.2
```

---

### Développement Backend (quotidien)

**Option A: Avec PostgreSQL**
```bash
# Terminal WSL2
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate

# Exporter variables
export DATABASE_URL=postgresql://iaposte:changeme@localhost:5432/iapostemanager
export OPENAI_API_KEY=your-key-here

# Lancer app
cd src/backend
python app.py
```

**Option B: Avec SQLite (plus simple)**
```bash
# Terminal WSL2
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate
cd src/backend
python app.py
```

---

### Tests Backend (WSL2)

```bash
# Terminal WSL2
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate

# Tests unitaires
pytest src/backend/tests/

# Tests avec coverage
pytest --cov=src/backend src/backend/tests/

# Linter
flake8 src/backend/
```

---

## 🗄️ Gestion PostgreSQL

### Créer une migration (après modification models.py)

```bash
# Terminal WSL2
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate
export DATABASE_URL_POSTGRES=postgresql://iaposte:changeme@localhost:5432/iapostemanager

# Créer migration automatique
alembic revision --autogenerate -m "Description des changements"

# Appliquer migration
alembic upgrade head
```

---

### Accéder à PostgreSQL (SQL direct)

**Depuis Windows:**
```powershell
docker exec -it iaposte_postgres psql -U iaposte -d iapostemanager
```

**Depuis WSL2:**
```bash
psql -h localhost -U iaposte -d iapostemanager -p 5432
# Password: changeme
```

**Commandes SQL utiles:**
```sql
-- Lister tables
\dt

-- Voir structure table
\d users

-- Requêtes
SELECT * FROM users;
SELECT COUNT(*) FROM emails;

-- Quitter
\q
```

---

### Backup/Restore

**Backup:**
```bash
# Terminal WSL2
docker exec iaposte_postgres pg_dump -U iaposte iapostemanager > backup_$(date +%Y%m%d).sql
```

**Restore:**
```bash
# Terminal WSL2
docker exec -i iaposte_postgres psql -U iaposte -d iapostemanager < backup_20241221.sql
```

---

## 🛠️ Commandes Utiles

### Vérifier statuts

```bash
# PostgreSQL (Windows PowerShell)
docker ps | grep postgres

# Backend (WSL2)
curl http://127.0.0.1:5000/api/health

# Frontend (Windows PowerShell)
curl http://localhost:3003
```

---

### Logs

**PostgreSQL:**
```powershell
docker logs -f iaposte_postgres
```

**Backend (si lancé en background):**
```bash
tail -f ./logs/app.log
```

---

### Redémarrage complet

```powershell
# Arrêter tout
docker-compose -f docker-compose.production.yml down
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# Redémarrer
docker-compose -f docker-compose.production.yml up -d postgres

# Puis relancer backend (WSL2) et frontend (Windows)
```

---

## 🎯 Raccourcis VS Code

### Ouvrir terminal WSL2 dans VS Code

1. **Ctrl + `** (ouvrir terminal)
2. Cliquer sur **+** dropdown → "Ubuntu (WSL)"
3. Ou dans terminal: `wsl` pour passer en Linux

---

### Profils de lancement (.vscode/launch.json)

**Pour backend WSL2:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend (WSL2)",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/src/backend/app.py",
      "console": "integratedTerminal",
      "env": {
        "DATABASE_URL": "postgresql://iaposte:changeme@localhost:5432/iapostemanager",
        "FLASK_ENV": "development"
      },
      "subProcess": true
    }
  ]
}
```

---

## 📊 Structure du projet

```
iaPostemanage/
├── venv-linux/              # Python virtualenv Linux (WSL2)
├── src/
│   ├── backend/             # Backend Python Flask
│   │   ├── app.py          # Point d'entrée
│   │   ├── models.py       # SQLAlchemy models
│   │   └── tests/          # Tests unitaires
│   └── frontend/            # Frontend React
│       └── package.json
├── migrations/              # Alembic migrations
│   └── versions/
│       └── e07d5ae2eb41_initial_schema.py
├── docker-compose.production.yml
├── .env                     # Configuration (NE PAS COMMIT)
├── .env.template            # Template configuration
└── migrate_database.py      # Outil de migration
```

---

## 🔐 Variables d'environnement importantes

**Dans .env:**
```bash
# SQLite (développement simple)
DATABASE_URL=sqlite:///iapostemanager.db

# PostgreSQL (production-ready)
DATABASE_URL_POSTGRES=postgresql://iaposte:changeme@localhost:5432/iapostemanager

# OpenAI (OBLIGATOIRE)
OPENAI_API_KEY=sk-proj-...

# Flask
SECRET_KEY=changez-moi-en-production
FLASK_ENV=development
```

---

## ✅ Checklist Quotidienne

**Matin - Démarrage:**
- [ ] PostgreSQL Docker lancé (`docker ps | grep postgres`)
- [ ] Terminal WSL2 ouvert dans VS Code
- [ ] venv-linux activé (`source venv-linux/bin/activate`)
- [ ] Backend lancé dans WSL2 (`python src/backend/app.py`)
- [ ] Frontend lancé dans Windows (`npm run dev`)

**Pendant dev:**
- [ ] Tests passent (`pytest`)
- [ ] Pas d'erreurs dans logs
- [ ] Migrations créées si models modifiés

**Soir - Arrêt:**
- [ ] Commit + push sur GitHub
- [ ] Backup PostgreSQL si données importantes
- [ ] `docker-compose down` (optionnel, peut rester actif)

---

## 🚨 Dépannage

### Erreur: "cannot connect to Docker daemon"

**Solution:**
```powershell
# Démarrer Docker Desktop
# Attendre que Docker soit "Running"
docker ps
```

---

### Erreur: "Module not found" dans WSL2

**Solution:**
```bash
# Réinstaller dépendances
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate
pip install -r requirements.txt
```

---

### Erreur: "psycopg2 connection refused"

**Solution:**
```bash
# Vérifier PostgreSQL tourne
docker ps | grep postgres

# Tester connexion
psql -h localhost -U iaposte -d iapostemanager -p 5432
```

---

### Erreur: "alembic command not found"

**Solution:**
```bash
source venv-linux/bin/activate
pip install alembic==1.17.2
```

---

### Performance lente sur /mnt/c/

**Solution (optionnelle):**
```bash
# Copier projet dans home WSL2 (plus rapide)
cp -r /mnt/c/Users/moros/Desktop/iaPostemanage ~/iapostemanage
cd ~/iapostemanage

# Puis développer dans ~/iapostemanage
```

**⚠️ Attention:** Synchroniser avec Windows après

---

## 🎓 Comprendre WSL2

**WSL2 = Linux complet sur Windows**
- `/mnt/c/` = Windows `C:\`
- `~/` = Home Linux (`/home/moros/`)
- Partage réseau: `localhost` accessible des 2 côtés
- Fichiers Windows accessibles depuis Linux (et inversement)

**Quand utiliser quoi:**
- ✅ **Python backend → WSL2** (psycopg2 fonctionne)
- ✅ **Node.js frontend → Windows** (npm plus rapide)
- ✅ **PostgreSQL → Docker Windows** (partagé)
- ✅ **Tests → WSL2** (pytest)
- ✅ **Git → Windows ou WSL2** (les deux fonctionnent)

---

## 📚 Ressources

**Documentation:**
- [WSL2](https://docs.microsoft.com/windows/wsl/)
- [Alembic](https://alembic.sqlalchemy.org/)
- [PostgreSQL](https://www.postgresql.org/docs/)

**Guides projet:**
- [UTILISER_WSL2.md](./UTILISER_WSL2.md) - Installation WSL2
- [NETTOYAGE_RESUME.md](./NETTOYAGE_RESUME.md) - Cleanup summary
- [DEPLOIEMENT_PRODUCTION.md](./DEPLOIEMENT_PRODUCTION.md) - Production

**Commandes rapides:**
```bash
# Backend WSL2
wsl -e bash -c "cd /mnt/c/Users/moros/Desktop/iaPostemanage && source venv-linux/bin/activate && python src/backend/app.py"

# Frontend Windows
npm --prefix src/frontend run dev

# PostgreSQL
docker-compose -f docker-compose.production.yml up -d postgres
```

---

**Date:** 21 décembre 2024  
**Configuration:** WSL2 Ubuntu + PostgreSQL Docker + React Frontend  
**Status:** ✅ Prêt pour développement quotidien
