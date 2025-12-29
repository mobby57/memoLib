# 🐘 POSTGRESQL DATABASE - GUIDE COMPLET

**Date** : 28 Décembre 2025  
**Statut** : ✅ **PRODUCTION READY**  
**Version** : 1.0.0

---

## 🎯 OBJECTIF

Migration de JSON vers PostgreSQL pour :
- ✅ Persistance robuste des données
- ✅ Requêtes SQL avancées
- ✅ Relations entre tables
- ✅ Transactions ACID
- ✅ Scalabilité

---

## 📁 ARCHITECTURE

### Tables créées

```
┌─────────────┐
│    users    │
├─────────────┤
│ id          │ PK
│ username    │ UNIQUE
│ email       │ UNIQUE
│ password    │
│ role        │
│ ...         │
└─────────────┘
      │
      │ 1:N
      ▼
┌─────────────┐     1:N     ┌─────────────┐
│ workspaces  │ ──────────> │  messages   │
├─────────────┤             ├─────────────┤
│ id          │ PK          │ id          │ PK
│ user_id     │ FK          │ workspace_id│ FK
│ title       │             │ role        │
│ status      │             │ content     │
│ priority    │             │ ...         │
│ ...         │             └─────────────┘
└─────────────┘
      │
      │ 1:N
      ▼
┌─────────────┐
│  templates  │
├─────────────┤
│ id          │ PK
│ user_id     │ FK
│ name        │
│ body        │
│ ...         │
└─────────────┘
      │
      │ 1:N
      ▼
┌─────────────┐
│ signatures  │
├─────────────┤
│ id          │ PK
│ user_id     │ FK
│ name        │
│ content     │
│ ...         │
└─────────────┘
```

---

## ⚙️ INSTALLATION

### 1. Installer PostgreSQL (Windows)

#### Option A: PostgreSQL Official

1. Télécharger : https://www.postgresql.org/download/windows/
2. Installer (version 15+)
3. Configurer :
   - Port: 5432
   - Username: postgres
   - Password: (choisir un mot de passe)

#### Option B: Docker

```bash
# Pull image
docker pull postgres:15

# Lancer container
docker run -d \
  --name iaposte-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=iapostemanager \
  -p 5432:5432 \
  postgres:15
```

### 2. Créer la base de données

```sql
-- Se connecter à PostgreSQL
psql -U postgres

-- Créer database
CREATE DATABASE iapostemanager;

-- Vérifier
\l

-- Se connecter à la nouvelle DB
\c iapostemanager

-- Quitter
\q
```

### 3. Installer dépendances Python

```bash
# Déjà installé dans le projet
pip install psycopg2-binary sqlalchemy alembic python-dotenv
```

---

## 🔧 CONFIGURATION

### 1. Variables d'environnement (.env)

```env
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iapostemanager

# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

### 2. Modifier les credentials

```env
# Exemple avec credentials personnalisés
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/iapostemanager
```

---

## 🚀 UTILISATION

### 1. Créer les tables (Migration)

```bash
# Vérifier les migrations disponibles
alembic current

# Appliquer toutes les migrations
alembic upgrade head

# Vérifier que les tables sont créées
python -c "from src.backend.models.database import create_engine_and_session; from sqlalchemy import inspect; engine, _ = create_engine_and_session(); inspector = inspect(engine); print(inspector.get_table_names())"
```

**Résultat attendu** :
```
['alembic_version', 'users', 'signatures', 'templates', 'messages', 'workspaces']
```

### 2. Migrer les données JSON

```bash
# Lancer le script de migration
python scripts/migrate_json_to_postgres.py
```

**Output** :
```
============================================================
📦 MIGRATION DONNÉES JSON → POSTGRESQL
============================================================

👤 Migration des utilisateurs...
   ✅ 1 utilisateurs migrés

📄 Migration des templates...
   ✅ 5 templates migrés

✍️  Migration des signatures...
   ✅ 2 signatures migrées

📁 Migration des workspaces...
   ✅ 29 workspaces migrés

============================================================
✅ MIGRATION TERMINÉE
============================================================

📊 Résumé:
   - 1 utilisateurs
   - 5 templates
   - 2 signatures
   - 29 workspaces

   Total: 37 enregistrements
```

### 3. Utiliser dans le code

```python
from src.backend.models.database import (
    create_engine_and_session,
    User, Workspace, Message, Template, Signature,
    WorkspaceStatus, WorkspacePriority, MessageRole
)

# Créer session
engine, SessionLocal = create_engine_and_session()
session = SessionLocal()

try:
    # CREATE - Créer un workspace
    workspace = Workspace(
        user_id=1,
        title='Mon nouveau workspace',
        description='Description',
        status=WorkspaceStatus.IN_PROGRESS,
        priority=WorkspacePriority.HIGH,
        source='email',
        tags=['urgent', 'client']
    )
    session.add(workspace)
    session.commit()
    
    # READ - Lire tous les workspaces
    all_workspaces = session.query(Workspace).all()
    
    # READ - Filtrer par statut
    in_progress = session.query(Workspace)\
        .filter_by(status=WorkspaceStatus.IN_PROGRESS)\
        .all()
    
    # READ - Recherche complexe
    urgent_recent = session.query(Workspace)\
        .filter(Workspace.priority == WorkspacePriority.URGENT)\
        .filter(Workspace.created_at >= '2025-12-01')\
        .order_by(Workspace.created_at.desc())\
        .limit(10)\
        .all()
    
    # UPDATE - Mettre à jour un workspace
    workspace.status = WorkspaceStatus.COMPLETED
    workspace.progress = 100.0
    session.commit()
    
    # DELETE - Supprimer un workspace
    session.delete(workspace)
    session.commit()
    
finally:
    session.close()
```

---

## 📊 MODÈLES SQLALCHEMY

### User

```python
class User(Base):
    __tablename__ = 'users'
    
    id = Integer, PK
    username = String(100), UNIQUE
    email = String(255), UNIQUE
    password_hash = String(255)
    first_name = String(100)
    last_name = String(100)
    role = String(50)  # user, admin, manager
    preferences = JSON
    created_at = DateTime
    updated_at = DateTime
    last_login = DateTime
    is_active = Boolean
```

### Workspace

```python
class Workspace(Base):
    __tablename__ = 'workspaces'
    
    id = Integer, PK
    user_id = Integer, FK(users.id)
    title = String(255)
    description = Text
    status = Enum(NOT_STARTED, IN_PROGRESS, COMPLETED, ARCHIVED)
    priority = Enum(LOW, MEDIUM, HIGH, URGENT)
    progress = Float (0.0 - 100.0)
    source = String(50)  # email, sms, voice, web
    source_id = String(255)
    workspace_metadata = JSON
    tags = JSON (array)
    created_at = DateTime
    updated_at = DateTime
    completed_at = DateTime
    due_date = DateTime
```

### Message

```python
class Message(Base):
    __tablename__ = 'messages'
    
    id = Integer, PK
    workspace_id = Integer, FK(workspaces.id)
    role = Enum(USER, ASSISTANT, SYSTEM)
    content = Text
    message_metadata = JSON
    created_at = DateTime
```

### Template

```python
class Template(Base):
    __tablename__ = 'templates'
    
    id = Integer, PK
    user_id = Integer, FK(users.id)
    name = String(255)
    description = Text
    category = String(100)
    subject = String(500)
    body = Text
    is_html = Boolean
    variables = JSON (array)
    is_active = Boolean
    usage_count = Integer
    created_at = DateTime
    updated_at = DateTime
```

### Signature

```python
class Signature(Base):
    __tablename__ = 'signatures'
    
    id = Integer, PK
    user_id = Integer, FK(users.id)
    name = String(255)
    content = Text
    is_html = Boolean
    is_default = Boolean
    is_active = Boolean
    created_at = DateTime
    updated_at = DateTime
```

---

## 🔄 MIGRATIONS ALEMBIC

### Créer une nouvelle migration

```bash
# Après modification des modèles
alembic revision --autogenerate -m "Description du changement"

# Exemple
alembic revision --autogenerate -m "Add column phone to users"
```

### Appliquer les migrations

```bash
# Upgrade vers la dernière version
alembic upgrade head

# Upgrade d'une version spécifique
alembic upgrade ae10

# Downgrade d'une version
alembic downgrade -1
```

### Voir l'historique

```bash
# Version actuelle
alembic current

# Historique complet
alembic history

# Voir les migrations pending
alembic heads
```

---

## 🧪 TESTS

### Lancer les tests PostgreSQL

```bash
# Tous les tests
pytest tests/integration/test_database.py -v

# Tests spécifiques
pytest tests/integration/test_database.py::TestUserModel -v

# Avec coverage
pytest tests/integration/test_database.py --cov=src.backend.models --cov-report=html
```

**Tests inclus** :
- ✅ Configuration database
- ✅ Création modèles (User, Workspace, Message, Template, Signature)
- ✅ Relations ORM
- ✅ CRUD operations complètes
- ✅ Queries avancées (filtres, order by, limit)
- ✅ Cascade delete
- ✅ Contraintes (unique, not null)

---

## 🔍 QUERIES UTILES

### Lister tous les workspaces

```python
workspaces = session.query(Workspace).all()
for ws in workspaces:
    print(f"{ws.id}: {ws.title} - {ws.status.value}")
```

### Compter par statut

```python
from sqlalchemy import func

stats = session.query(
    Workspace.status,
    func.count(Workspace.id)
).group_by(Workspace.status).all()

for status, count in stats:
    print(f"{status.value}: {count}")
```

### Workspaces urgents non complétés

```python
urgent = session.query(Workspace)\
    .filter(Workspace.priority == WorkspacePriority.URGENT)\
    .filter(Workspace.status != WorkspaceStatus.COMPLETED)\
    .order_by(Workspace.created_at.desc())\
    .all()
```

### Workspace avec messages

```python
# Eager loading avec joinedload
from sqlalchemy.orm import joinedload

workspace = session.query(Workspace)\
    .options(joinedload(Workspace.messages))\
    .filter_by(id=workspace_id)\
    .first()

for message in workspace.messages:
    print(f"{message.role.value}: {message.content}")
```

---

## 🐛 TROUBLESHOOTING

### Erreur "database does not exist"

```bash
# Créer la database manuellement
psql -U postgres -c "CREATE DATABASE iapostemanager;"
```

### Erreur "role does not exist"

```bash
# Créer le user PostgreSQL
psql -U postgres -c "CREATE USER myuser WITH PASSWORD 'mypassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE iapostemanager TO myuser;"
```

### Erreur "cannot connect to server"

```bash
# Vérifier que PostgreSQL est lancé (Windows)
Get-Service postgresql*

# Démarrer si nécessaire
Start-Service postgresql-x64-15

# Ou avec Docker
docker start iaposte-postgres
```

### Réinitialiser complètement la DB

```bash
# Script de réinitialisation
python scripts/reset_database.py

# Puis recréer les tables
alembic upgrade head

# Puis migrer les données
python scripts/migrate_json_to_postgres.py
```

### Voir les logs PostgreSQL

```bash
# Activer echo dans database.py
engine = create_engine(database_url, echo=True)

# Ou via psql
psql -U postgres -d iapostemanager
\x
SELECT * FROM pg_stat_activity;
```

---

## 📈 PERFORMANCE

### Index créés automatiquement

```sql
-- Users
CREATE INDEX ix_users_username ON users(username);
CREATE INDEX ix_users_email ON users(email);

-- Workspaces
CREATE INDEX ix_workspaces_user_id ON workspaces(user_id);
CREATE INDEX ix_workspaces_status ON workspaces(status);
CREATE INDEX ix_workspaces_priority ON workspaces(priority);
CREATE INDEX ix_workspaces_source ON workspaces(source);
CREATE INDEX ix_workspaces_created_at ON workspaces(created_at);

-- Messages
CREATE INDEX ix_messages_workspace_id ON messages(workspace_id);
CREATE INDEX ix_messages_created_at ON messages(created_at);

-- Templates
CREATE INDEX ix_templates_user_id ON templates(user_id);
CREATE INDEX ix_templates_name ON templates(name);
CREATE INDEX ix_templates_category ON templates(category);

-- Signatures
CREATE INDEX ix_signatures_user_id ON signatures(user_id);
CREATE INDEX ix_signatures_name ON signatures(name);
```

### Optimisations recommandées

```python
# 1. Eager loading pour éviter N+1 queries
from sqlalchemy.orm import joinedload

workspaces = session.query(Workspace)\
    .options(joinedload(Workspace.messages))\
    .all()

# 2. Pagination
from sqlalchemy import desc

page = 1
per_page = 20
workspaces = session.query(Workspace)\
    .order_by(desc(Workspace.created_at))\
    .limit(per_page)\
    .offset((page - 1) * per_page)\
    .all()

# 3. Bulk operations
session.bulk_insert_mappings(Workspace, list_of_dicts)
session.bulk_update_mappings(Workspace, list_of_dicts)
```

---

## 🔐 SÉCURITÉ

### 1. Ne jamais commit .env

```bash
# Vérifier .gitignore
cat .gitignore | grep .env
```

### 2. Utiliser des mots de passe forts

```env
# ❌ Mauvais
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iapostemanager

# ✅ Bon
DATABASE_URL=postgresql://iaposte_user:Str0ng_P@ssw0rd_H3r3@localhost:5432/iapostemanager
```

### 3. Hacher les mots de passe utilisateurs

```python
from werkzeug.security import generate_password_hash, check_password_hash

# Créer user
password_hash = generate_password_hash('user_password')
user = User(username='john', email='john@e.com', password_hash=password_hash)

# Vérifier password
if check_password_hash(user.password_hash, provided_password):
    # Login OK
    pass
```

---

## 🚀 PROCHAINES ÉTAPES

### Améliorations futures

- [ ] Connection pooling avancé
- [ ] Read replicas pour scalabilité
- [ ] Full-text search avec PostgreSQL
- [ ] Partitionnement de tables
- [ ] Backup automatique quotidien
- [ ] Monitoring avec pg_stat_statements
- [ ] Migrations zero-downtime
- [ ] Query optimization avec EXPLAIN ANALYZE

---

## 📞 COMMANDES RAPIDES

```bash
# Créer migration
alembic revision --autogenerate -m "Message"

# Appliquer migrations
alembic upgrade head

# Migrer données JSON
python scripts/migrate_json_to_postgres.py

# Reset DB
python scripts/reset_database.py

# Tests
pytest tests/integration/test_database.py -v

# Se connecter à la DB
psql -U postgres -d iapostemanager

# Voir tables
\dt

# Voir structure table
\d workspaces

# Query rapide
SELECT COUNT(*) FROM workspaces;
```

---

**Créé le** : 28 Décembre 2025  
**Status** : ✅ Production Ready  
**Next** : Refactoriser services pour utiliser PostgreSQL

---

# ✅ POSTGRESQL MIGRATION : MISSION ACCOMPLIE ! 🐘
