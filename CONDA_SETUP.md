# 🐍 GUIDE DE CONFIGURATION CONDA - IA POSTE MANAGER

**Date:** 19 janvier 2026  
**Version:** 1.0  
**Environnement:** Windows 11

---

## 📋 TABLE DES MATIÈRES

1. [Installation Conda](#1-installation-conda)
2. [Création Environnement](#2-création-environnement)
3. [Activation & Utilisation](#3-activation--utilisation)
4. [Scripts PowerShell](#4-scripts-powershell)
5. [Intégration VS Code](#5-intégration-vs-code)
6. [Dépendances Détaillées](#6-dépendances-détaillées)
7. [Troubleshooting](#7-troubleshooting)

---

## 1️⃣ INSTALLATION CONDA

### Option A: Miniconda (Recommandé - Léger)

```powershell
# Télécharger Miniconda
Invoke-WebRequest -Uri "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe" -OutFile "$env:TEMP\Miniconda3-Installer.exe"

# Installer (mode silencieux)
Start-Process -FilePath "$env:TEMP\Miniconda3-Installer.exe" -ArgumentList "/S", "/InstallationType=JustMe", "/AddToPath=1", "/RegisterPython=1" -Wait

# Vérifier installation
conda --version
```

### Option B: Anaconda (Complet - Interface GUI)

1. Télécharger : https://www.anaconda.com/download
2. Installer avec options par défaut
3. Cocher "Add to PATH" (important)

### Vérification

```powershell
# Version Conda
conda --version
# Devrait afficher: conda 23.x.x ou supérieur

# Canaux configurés
conda config --show channels

# Informations système
conda info
```

---

## 2️⃣ CRÉATION ENVIRONNEMENT

### Méthode 1: Depuis environment.yml (Recommandé)

```powershell
# Se placer dans le répertoire du projet
cd C:\Users\moros\Desktop\iaPostemanage

# Créer environnement depuis YAML
conda env create -f environment.yml

# Durée estimée: 5-10 minutes
```

### Méthode 2: Manuel (Alternative)

```powershell
# Créer environnement Python 3.11
conda create -n iapostemanager python=3.11 -y

# Activer
conda activate iapostemanager

# Installer dépendances depuis requirements
pip install -r requirements-python.txt
```

### Vérification Installation

```powershell
# Activer environnement
conda activate iapostemanager

# Lister packages installés
conda list

# Vérifier imports critiques
python -c "import fastapi, numpy, flask; print('✅ Imports OK')"

# Version Python
python --version
# Devrait afficher: Python 3.11.x
```

---

## 3️⃣ ACTIVATION & UTILISATION

### Activation Quotidienne

```powershell
# Activer environnement
conda activate iapostemanager

# Votre prompt devrait afficher: (iapostemanager) C:\...

# Désactiver
conda deactivate
```

### Lancer Backend Python

```powershell
# Activer environnement
conda activate iapostemanager

# Lancer FastAPI principal
cd src/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Ou Flask simple
cd backend-python
python app.py

# Ou avec Gunicorn (production)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Tester IA Prédictive

```powershell
conda activate iapostemanager

# Test service prédictif
python -c "
from src.backend.services.predictive_ai import PredictiveLegalAI
ai = PredictiveLegalAI()
print('✅ Predictive AI loaded successfully')
"
```

---

## 4️⃣ SCRIPTS POWERSHELL

### Script 1: Setup Automatique

Créer `setup-conda.ps1` :

```powershell
# Setup Conda pour IA Poste Manager
Write-Host "🐍 Configuration Conda - IA Poste Manager" -ForegroundColor Cyan

# Vérifier Conda installé
try {
    $condaVersion = conda --version
    Write-Host "✅ Conda installé: $condaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Conda non installé. Veuillez l'installer d'abord." -ForegroundColor Red
    exit 1
}

# Créer environnement
Write-Host "`n📦 Création environnement iapostemanager..." -ForegroundColor Yellow
conda env create -f environment.yml -y

# Activation
Write-Host "`n✅ Environnement créé!" -ForegroundColor Green
Write-Host "`n💡 Pour activer:" -ForegroundColor Cyan
Write-Host "   conda activate iapostemanager" -ForegroundColor White

# Installer modèle Spacy (si nécessaire)
Write-Host "`n📥 Installation modèle Spacy français..." -ForegroundColor Yellow
conda activate iapostemanager
python -m spacy download fr_core_news_sm

Write-Host "`n🎉 Configuration terminée!" -ForegroundColor Green
```

### Script 2: Démarrage Backend

Créer `start-python-backend.ps1` :

```powershell
# Démarrer backend Python FastAPI
Write-Host "🚀 Démarrage Backend Python - IA Poste Manager" -ForegroundColor Cyan

# Activer environnement
conda activate iapostemanager

# Vérifier activation
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur activation environnement" -ForegroundColor Red
    Write-Host "💡 Exécutez d'abord: conda activate iapostemanager" -ForegroundColor Yellow
    exit 1
}

# Aller dans répertoire backend
Set-Location -Path "src\backend"

# Lancer FastAPI avec reload
Write-Host "`n🔥 Lancement FastAPI sur http://localhost:8000" -ForegroundColor Green
Write-Host "📚 Documentation API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "🔄 Mode reload activé (modifications auto-rechargées)" -ForegroundColor Yellow

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Script 3: Tests Python

Créer `test-python-backend.ps1` :

```powershell
# Tests backend Python
Write-Host "🧪 Tests Backend Python" -ForegroundColor Cyan

conda activate iapostemanager

# Tests unitaires
Write-Host "`n📝 Lancement tests unitaires..." -ForegroundColor Yellow
pytest src/backend/tests -v --cov=src/backend --cov-report=html

# Test imports critiques
Write-Host "`n🔍 Vérification imports..." -ForegroundColor Yellow
python -c "
import fastapi
import numpy
import flask
import ollama
print('✅ Tous les imports critiques OK')
"

# Test API (si serveur lancé)
Write-Host "`n🌐 Test endpoint API..." -ForegroundColor Yellow
curl http://localhost:8000/health

Write-Host "`n✅ Tests terminés!" -ForegroundColor Green
Write-Host "📊 Rapport coverage: htmlcov/index.html" -ForegroundColor Cyan
```

---

## 5️⃣ INTÉGRATION VS CODE

### Configuration Python Interpreter

1. **Ouvrir Command Palette** : `Ctrl+Shift+P`
2. **Sélectionner** : `Python: Select Interpreter`
3. **Choisir** : `iapostemanager (conda)`
4. **Ou chemin manuel** : `C:\Users\moros\miniconda3\envs\iapostemanager\python.exe`

### settings.json (VS Code)

Ajouter à `.vscode/settings.json` :

```json
{
  "python.defaultInterpreterPath": "${env:CONDA_PREFIX}\\python.exe",
  "python.condaPath": "C:\\Users\\moros\\miniconda3\\Scripts\\conda.exe",
  "python.terminal.activateEnvironment": true,
  "python.terminal.activateEnvInCurrentTerminal": true,
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "python.testing.pytestEnabled": true,
  "python.testing.unittestEnabled": false,
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  }
}
```

### Extensions Recommandées

Installer dans VS Code :

- `ms-python.python` (Python)
- `ms-python.vscode-pylance` (Pylance)
- `ms-python.black-formatter` (Black)
- `ms-python.flake8` (Flake8)
- `njpwerner.autodocstring` (Docstrings auto)

---

## 6️⃣ DÉPENDANCES DÉTAILLÉES

### Packages Principaux

| Package | Version | Utilisation |
|---------|---------|-------------|
| **fastapi** | 0.109+ | API backend principal |
| **uvicorn** | 0.27+ | Serveur ASGI |
| **numpy** | 1.26+ | Prédictions juridiques (predictive_ai.py) |
| **flask** | 3.0.3 | API secondaire |
| **ollama** | 0.1+ | Client IA locale (llama3.2) |
| **spacy** | 3.7+ | NLP pour analyse texte |
| **sqlalchemy** | 2.0+ | ORM base de données |
| **pytest** | 7.4+ | Tests unitaires |

### Packages par Fonctionnalité

#### IA & Machine Learning
```
numpy>=1.26.0         # Calculs numériques
pandas>=2.1.0         # Manipulation données
scikit-learn>=1.4.0   # ML classique
spacy>=3.7.0          # NLP
ollama>=0.1.0         # IA locale Ollama
```

#### API & Web
```
fastapi>=0.109.0      # Framework API moderne
uvicorn>=0.27.0       # Serveur ASGI
flask>=3.0.3          # Framework alternatif
gunicorn>=21.2.0      # Serveur production
```

#### Documents & Email
```
reportlab>=4.0.0      # Génération PDF
weasyprint>=60.0      # PDF avancé (HTML→PDF)
google-api-python-client>=2.110.0  # Gmail API
```

#### Database
```
sqlalchemy>=2.0.0     # ORM
psycopg2-binary>=2.9.0  # PostgreSQL
redis>=5.0.0          # Cache
```

### Taille Totale Environnement

- **Espace disque requis:** ~2-3 GB
- **Temps installation:** 5-10 minutes
- **Packages installés:** 60-80

---

## 7️⃣ TROUBLESHOOTING

### Problème 1: Conda non reconnu

**Symptôme:**
```powershell
conda : Le terme 'conda' n'est pas reconnu...
```

**Solution:**
```powershell
# Ajouter Conda au PATH manuellement
$env:Path += ";C:\Users\moros\miniconda3\Scripts"
$env:Path += ";C:\Users\moros\miniconda3"

# Ou redémarrer terminal après installation
```

### Problème 2: Environnement pas créé

**Symptôme:**
```
CondaEnvironmentError: environment not found
```

**Solution:**
```powershell
# Lister environnements existants
conda env list

# Recréer si nécessaire
conda env remove -n iapostemanager
conda env create -f environment.yml
```

### Problème 3: Conflit de packages

**Symptôme:**
```
Solving environment: failed with initial frozen solve
```

**Solution:**
```powershell
# Méthode 1: Forcer résolution
conda env create -f environment.yml --force

# Méthode 2: Installation séquentielle
conda create -n iapostemanager python=3.11 -y
conda activate iapostemanager
conda install -c conda-forge fastapi uvicorn numpy pandas -y
pip install -r requirements-python.txt
```

### Problème 4: Import errors

**Symptôme:**
```python
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```powershell
# Vérifier environnement activé
conda activate iapostemanager

# Réinstaller package manquant
pip install fastapi

# Vérifier chemin Python
python -c "import sys; print(sys.executable)"
# Doit pointer vers: ...\miniconda3\envs\iapostemanager\python.exe
```

### Problème 5: Ollama client error

**Symptôme:**
```
Error: Ollama server not running
```

**Solution:**
```powershell
# Vérifier Ollama installé
ollama --version

# Lancer serveur Ollama
ollama serve

# Dans autre terminal, tester
ollama run llama3.2:3b

# Vérifier connexion
curl http://localhost:11434
```

---

## 📊 COMMANDES UTILES

### Gestion Environnement

```powershell
# Lister tous les environnements
conda env list

# Créer environnement
conda create -n nom_env python=3.11

# Cloner environnement
conda create --name nouveau --clone iapostemanager

# Supprimer environnement
conda env remove -n nom_env

# Exporter environnement
conda env export > environment-backup.yml

# Mettre à jour Conda
conda update conda
```

### Gestion Packages

```powershell
# Installer package
conda install package_name
pip install package_name

# Mettre à jour package
conda update package_name
pip install --upgrade package_name

# Désinstaller package
conda remove package_name
pip uninstall package_name

# Lister packages installés
conda list
pip list

# Rechercher package
conda search package_name
```

### Nettoyage

```powershell
# Nettoyer cache Conda
conda clean --all

# Nettoyer pip cache
pip cache purge

# Supprimer packages non utilisés
conda clean --packages

# Vérifier espace disque
conda clean --dry-run --all
```

---

## ✅ CHECKLIST INSTALLATION

- [ ] Conda installé et dans PATH
- [ ] Environnement `iapostemanager` créé
- [ ] Tous les packages installés (vérifier avec `conda list`)
- [ ] Imports critiques testés (`fastapi`, `numpy`, `ollama`)
- [ ] VS Code configuré (interpreter Python)
- [ ] Scripts PowerShell créés (`setup-conda.ps1`, `start-python-backend.ps1`)
- [ ] Ollama installé et fonctionnel
- [ ] Modèle Spacy FR téléchargé (`fr_core_news_sm`)
- [ ] Backend FastAPI démarre correctement (`http://localhost:8000/docs`)
- [ ] Tests passent (`pytest`)

---

## 🎯 PROCHAINES ÉTAPES

### 1. Configuration Initiale (Maintenant)
```powershell
# Exécuter setup automatique
.\setup-conda.ps1
```

### 2. Test Backend (Après setup)
```powershell
# Lancer backend
.\start-python-backend.ps1

# Tester API
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

### 3. Développement (Quotidien)
```powershell
# Activer environnement
conda activate iapostemanager

# Développer...
code .

# Tester
pytest
```

---

## 📞 SUPPORT & RESSOURCES

### Documentation Officielle
- **Conda:** https://docs.conda.io/
- **FastAPI:** https://fastapi.tiangolo.com/
- **Ollama:** https://ollama.ai/
- **Spacy:** https://spacy.io/

### Fichiers Projet
- `environment.yml` - Configuration Conda complète
- `requirements-python.txt` - Dépendances pip
- `ANALYSE_COMPLETE_PROJET.md` - Analyse projet
- `README.md` - Documentation principale

### Commandes Rapides
```powershell
# Informations environnement
conda info --envs

# Aide Conda
conda --help

# Aide package
pip show package_name
```

---

**Créé le:** 19 janvier 2026  
**Dernière mise à jour:** 19 janvier 2026  
**Version:** 1.0  
**Auteur:** GitHub Copilot
