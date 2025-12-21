# 🐧 UTILISER WSL2 POUR POSTGRESQL

## ✅ Solution au problème Windows/psycopg2

**Problème:** psycopg2 sur Windows ne peut pas se connecter à PostgreSQL  
**Solution:** Utiliser WSL2 (Linux sur Windows) pour le développement

---

## 🚀 Installation WSL2 (2 minutes)

### Étape 1: Installer WSL2

```powershell
# Dans PowerShell ADMINISTRATEUR:
wsl --install -d Ubuntu
```

**Ou si WSL est déjà installé:**
```powershell
wsl --install -d Ubuntu-22.04
```

**Redémarrer si demandé**

---

### Étape 2: Configuration initiale Ubuntu

**1. Créer utilisateur:**
- Username: `moros` (ou autre)
- Password: [choisir un mot de passe]

**2. Mettre à jour Ubuntu:**
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 🔧 Installation Python + PostgreSQL

### Dans WSL2 Ubuntu:

```bash
# Installer Python 3.11 + pip
sudo apt install -y python3.11 python3.11-venv python3-pip

# Installer PostgreSQL client
sudo apt install -y postgresql-client libpq-dev

# Installer build tools (pour psycopg2)
sudo apt install -y build-essential python3.11-dev
```

---

## 📁 Accéder au projet Windows depuis WSL2

### Le projet est automatiquement accessible:

```bash
# Aller dans le projet (depuis WSL2)
cd /mnt/c/Users/moros/Desktop/iaPostemanage

# Vérifier
ls -la
```

**Explication:**
- Windows `C:\` = WSL2 `/mnt/c/`
- Windows `C:\Users\moros\Desktop\iaPostemanage` = WSL2 `/mnt/c/Users/moros/Desktop/iaPostemanage`

---

## 🐍 Créer environnement virtuel Python

```bash
# Aller dans le projet
cd /mnt/c/Users/moros/Desktop/iaPostemanage

# Créer virtualenv
python3.11 -m venv venv-linux

# Activer
source venv-linux/bin/activate

# Installer dépendances
pip install --upgrade pip
pip install -r requirements.txt

# Installer psycopg2 (version Linux)
pip install psycopg2-binary
```

---

## 🔗 Connecter à PostgreSQL (Docker Windows)

### PostgreSQL tourne sur Windows, accessible depuis WSL2:

**1. Trouver l'IP Windows depuis WSL2:**
```bash
# IP de l'hôte Windows
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
```

**Exemple de résultat:** `172.24.176.1`

**2. Tester connexion PostgreSQL:**
```bash
# Avec l'IP trouvée ci-dessus (remplacer 172.24.176.1)
psql -h 172.24.176.1 -U iaposte -d iapostemanager -p 5432
# Password: changeme
```

**Ou avec localhost (devrait fonctionner):**
```bash
psql -h localhost -U iaposte -d iapostemanager -p 5432
```

---

## ✅ Lancer la migration PostgreSQL

### Option 1: Migration complète automatique

```bash
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate

# Tout en une fois (init Alembic + migrate data)
python migrate_database.py -o 5
```

---

### Option 2: Migration étape par étape

```bash
# 1. Initialiser Alembic
python migrate_database.py -o 1

# 2. Créer migration automatique
python migrate_database.py -o 2

# 3. Appliquer migrations
python migrate_database.py -o 3

# 4. Migrer données SQLite → PostgreSQL
python migrate_database.py -o 4
```

---

## 🎯 Développement quotidien avec WSL2

### Workflow recommandé:

**1. Backend Python (dans WSL2):**
```bash
# Terminal WSL2
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate
cd src/backend
python app.py
```

**2. Frontend React (dans Windows PowerShell):**
```powershell
# Terminal Windows PowerShell
cd C:\Users\moros\Desktop\iaPostemanage\src\frontend
npm run dev
```

**3. PostgreSQL (Docker dans Windows):**
```powershell
# Terminal Windows PowerShell
docker-compose -f docker-compose.production.yml up -d postgres
```

---

## 🔍 Vérifier que tout fonctionne

### Test connexion PostgreSQL depuis WSL2:

```bash
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate

python -c "
from sqlalchemy import create_engine, text
url = 'postgresql://iaposte:changeme@localhost:5432/iapostemanager'
engine = create_engine(url)
conn = engine.connect()
result = conn.execute(text('SELECT 1'))
print('✅ PostgreSQL OK!')
conn.close()
"
```

**Devrait afficher:** `✅ PostgreSQL OK!`

---

## 🚨 Problèmes courants

### Erreur: "command not found: python3.11"

**Solution:**
```bash
sudo apt update
sudo apt install -y python3.11
```

---

### Erreur: "psql: could not connect"

**Solution 1: Vérifier PostgreSQL Docker tourne:**
```powershell
# Dans Windows PowerShell
docker ps | grep postgres
```

**Solution 2: Utiliser IP Windows:**
```bash
# Dans WSL2
export WINDOWS_IP=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
psql -h $WINDOWS_IP -U iaposte -d iapostemanager -p 5432
```

---

### Erreur: "Permission denied" sur fichiers

**Solution:**
```bash
# Ne PAS changer permissions sur /mnt/c/
# Copier projet dans WSL2 home:
cp -r /mnt/c/Users/moros/Desktop/iaPostemanage ~/iapostemanage
cd ~/iapostemanage
```

---

## 🎉 Avantages WSL2

**✅ Même environnement que production (Linux)**
- Pas de différences Windows/Linux
- psycopg2 fonctionne parfaitement
- Compatibilité Docker native

**✅ Performances:**
- I/O disque plus rapide pour Python
- Pas de conversion encodage

**✅ Développement:**
- Utiliser VS Code avec extension "Remote - WSL"
- Éditer dans Windows, exécuter dans Linux
- Meilleur des deux mondes

---

## 📝 Commandes rapides

### Démarrer WSL2:
```powershell
# Dans PowerShell Windows
wsl
```

### Arrêter WSL2:
```bash
# Dans WSL2
exit
```

### Redémarrer WSL2:
```powershell
# Dans PowerShell Windows
wsl --shutdown
wsl
```

### Vérifier version WSL:
```powershell
wsl --list --verbose
```

---

## 🔄 Migration MAINTENANT

**1. Installer WSL2:**
```powershell
wsl --install -d Ubuntu
```

**2. Configurer Ubuntu + Python**

**3. Aller dans projet:**
```bash
cd /mnt/c/Users/moros/Desktop/iaPostemanage
```

**4. Créer venv + installer deps:**
```bash
python3.11 -m venv venv-linux
source venv-linux/bin/activate
pip install -r requirements.txt
```

**5. Migrer PostgreSQL:**
```bash
python migrate_database.py -o 5
```

**6. ✅ TERMINÉ!**

---

**Date:** 21 décembre 2024  
**Solution:** WSL2 Ubuntu pour développement PostgreSQL  
**Temps:** ~10 minutes installation + 2 minutes migration
