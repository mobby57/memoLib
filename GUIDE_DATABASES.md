# 🗄️ BASES DE DONNÉES MULTI-TYPES - IA POSTE MANAGER

## 🎯 TYPES DE BASES DE DONNÉES SUPPORTÉES

### **1. SQLite** (Par défaut - Développement)
- ✅ Fichier local simple
- ✅ Pas de serveur requis
- ✅ Parfait pour MVP et tests
- ✅ Jusqu'à 1000 dossiers

### **2. PostgreSQL** (Production)
- ✅ Base relationnelle robuste
- ✅ Transactions ACID
- ✅ Scaling vertical
- ✅ 10,000+ dossiers

### **3. MongoDB** (Big Data)
- ✅ Base NoSQL flexible
- ✅ Documents JSON natifs
- ✅ Scaling horizontal
- ✅ Millions de dossiers

---

## 🔧 CONFIGURATION PAR TYPE

### **SQLite (Défaut)**
```bash
DATABASE_TYPE=sqlite
# Fichier automatique: ./data/clients/{CLIENT_ID}/{CLIENT_ID}.db
```

### **PostgreSQL**
```bash
DATABASE_TYPE=postgresql
POSTGRESQL_URL=postgresql://user:pass@localhost/client_dupont
```

### **MongoDB**
```bash
DATABASE_TYPE=mongodb
MONGODB_URL=mongodb://localhost:27017/
```

---

## 📊 SCHÉMA DE DONNÉES UNIFIÉ

### **Tables/Collections Créées**

#### **users** - Utilisateurs du cabinet
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP
);
```

#### **ceseda_analyses** - Analyses IA CESEDA
```sql
CREATE TABLE ceseda_analyses (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    case_text TEXT,
    success_rate REAL,
    urgency TEXT,
    positive_factors INTEGER,
    created_at TIMESTAMP
);
```

#### **invoices** - Factures générées
```sql
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY,
    numero TEXT UNIQUE,
    client_name TEXT,
    montant_ht REAL,
    montant_ttc REAL,
    status TEXT DEFAULT 'generated',
    created_at TIMESTAMP
);
```

#### **deadlines** - Délais juridiques
```sql
CREATE TABLE deadlines (
    id INTEGER PRIMARY KEY,
    type TEXT,
    description TEXT,
    deadline_date DATE,
    urgency TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP
);
```

#### **monthly_usage** - Usage mensuel
```sql
CREATE TABLE monthly_usage (
    id INTEGER PRIMARY KEY,
    month TEXT,
    analyses_count INTEGER DEFAULT 0,
    users_active INTEGER DEFAULT 0,
    created_at TIMESTAMP
);
```

---

## 🚀 UTILISATION

### **Démarrage avec SQLite**
```bash
# Variables d'environnement
set CLIENT_ID=cabinet-demo
set CLIENT_NAME=Cabinet Demo
set DATABASE_TYPE=sqlite

# Lancement
python flask_app_database.py
```

### **Démarrage avec PostgreSQL**
```bash
# Installation
pip install psycopg2-binary

# Configuration
set DATABASE_TYPE=postgresql
set POSTGRESQL_URL=postgresql://user:pass@localhost/cabinet_demo

# Lancement
python flask_app_database.py
```

### **Démarrage avec MongoDB**
```bash
# Installation
pip install pymongo

# Configuration
set DATABASE_TYPE=mongodb
set MONGODB_URL=mongodb://localhost:27017/

# Lancement
python flask_app_database.py
```

---

## 📈 RECOMMANDATIONS PAR USAGE

### **SQLite** - Petits Cabinets
- 👥 1-5 utilisateurs
- 📁 < 1,000 dossiers
- 💰 Plan STARTER
- 🔧 Maintenance minimale

### **PostgreSQL** - Cabinets Moyens/Grands
- 👥 5-50 utilisateurs
- 📁 1,000-100,000 dossiers
- 💰 Plan PROFESSIONAL/ENTERPRISE
- 🔧 Administration DB requise

### **MongoDB** - Très Gros Cabinets
- 👥 50+ utilisateurs
- 📁 100,000+ dossiers
- 💰 Plan ENTERPRISE+
- 🔧 Expertise NoSQL requise

---

## 🔄 MIGRATION ENTRE TYPES

### **SQLite → PostgreSQL**
```python
# Script de migration automatique
python migrate_sqlite_to_postgresql.py
```

### **PostgreSQL → MongoDB**
```python
# Script de migration automatique
python migrate_postgresql_to_mongodb.py
```

---

## 📊 FONCTIONNALITÉS BASE DE DONNÉES

### **Sauvegarde Automatique**
- ✅ Analyses IA avec ID unique
- ✅ Factures avec numérotation
- ✅ Délais avec dates calculées
- ✅ Usage mensuel trackés

### **Statistiques Temps Réel**
- ✅ Nombre d'utilisateurs
- ✅ Analyses effectuées
- ✅ Factures générées
- ✅ Type de DB utilisé

### **Isolation par Client**
- ✅ Base séparée par CLIENT_ID
- ✅ Données complètement isolées
- ✅ Pas de fuite entre clients

---

## 🎯 AVANTAGES COMMERCIAUX

### **Flexibilité Technique**
- Adapter la DB selon la taille client
- Migration transparente si croissance
- Coûts optimisés par usage

### **Pricing Différencié**
- STARTER (SQLite) = 99€/mois
- PROFESSIONAL (PostgreSQL) = 299€/mois
- ENTERPRISE (MongoDB) = 599€/mois

### **Évolutivité**
- Commencer petit (SQLite)
- Grandir progressivement
- Pas de refonte complète

---

## 🔧 INSTALLATION DÉPENDANCES

### **Minimale (SQLite)**
```bash
pip install flask flask-cors python-dateutil
```

### **PostgreSQL**
```bash
pip install flask flask-cors python-dateutil psycopg2-binary
```

### **MongoDB**
```bash
pip install flask flask-cors python-dateutil pymongo
```

---

**🏆 Système de base de données multi-types prêt pour tous types de cabinets !**