# 🚀 DÉMARRAGE RAPIDE - ENVIRONNEMENT CONDA

**IA Poste Manager - Backend Python**  
**Version:** 1.0 | **Date:** 19 janvier 2026

---

## ⚡ INSTALLATION EN 3 ÉTAPES

### 1️⃣ Setup Automatique (5-10 min)

```powershell
# Installer Conda + Créer environnement + Télécharger packages
.\setup-conda.ps1
```

**Ce script fait automatiquement :**
- ✅ Vérifie/Installe Miniconda (si absent)
- ✅ Crée environnement `iapostemanager` 
- ✅ Installe 60+ packages Python
- ✅ Configure Spacy NLP français
- ✅ Vérifie imports critiques

**Durée:** 5-10 minutes  
**Espace disque:** ~2-3 GB

---

### 2️⃣ Démarrer Backend (Instantané)

```powershell
# Lancer FastAPI sur http://localhost:8000
.\start-python-backend.ps1
```

**Options disponibles :**
1. FastAPI Principal (recommandé) → Port 8000
2. Flask Simple → Port 5000
3. FastAPI Simple → Port 8000
4. Production (Gunicorn) → Port 8000

**Accès :**
- 📡 API: http://localhost:8000
- 📚 Documentation: http://localhost:8000/docs
- 🔄 Auto-reload activé

---

### 3️⃣ Tester Installation (30 sec)

```powershell
# Vérifier que tout fonctionne
.\test-python-backend.ps1
```

**Tests effectués :**
- ✅ Imports critiques (FastAPI, NumPy, Flask, Ollama)
- ✅ Services IA (Predictive AI)
- ✅ Tests unitaires (si disponibles)
- ✅ Endpoints API (si serveur lancé)

---

## 📋 COMMANDES QUOTIDIENNES

### Activer Environnement

```powershell
conda activate iapostemanager
```

### Lancer Backend

```powershell
# Méthode 1: Script automatique (recommandé)
.\start-python-backend.ps1

# Méthode 2: Manuel
cd src\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Développement

```powershell
# Activer environnement
conda activate iapostemanager

# Ouvrir VS Code
code .

# Tests
pytest

# Linter
flake8 src/backend

# Formater code
black src/backend
```

---

## 🔧 CONFIGURATION VS CODE

### 1. Sélectionner Interpréteur Python

1. `Ctrl+Shift+P`
2. "Python: Select Interpreter"
3. Choisir: `iapostemanager (conda)`

### 2. Extensions Recommandées

- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- Black Formatter (ms-python.black-formatter)

### 3. Settings (.vscode/settings.json)

```json
{
  "python.defaultInterpreterPath": "${env:CONDA_PREFIX}\\python.exe",
  "python.terminal.activateEnvironment": true,
  "python.formatting.provider": "black",
  "python.linting.flake8Enabled": true
}
```

---

## 🐛 PROBLÈMES FRÉQUENTS

### ❌ "conda: command not found"

**Solution :**
```powershell
# Redémarrer terminal après installation Conda
# Ou ajouter au PATH manuellement:
$env:Path += ";C:\Users\moros\miniconda3\Scripts"
```

### ❌ "Environment not found"

**Solution :**
```powershell
# Recréer environnement
conda env remove -n iapostemanager
.\setup-conda.ps1
```

### ❌ "ModuleNotFoundError"

**Solution :**
```powershell
# Vérifier environnement activé
conda activate iapostemanager

# Réinstaller packages
pip install -r requirements-python.txt
```

### ❌ "Ollama server not running"

**Solution :**
```powershell
# Lancer Ollama (optionnel)
ollama serve

# Tester
ollama run llama3.2:3b
```

---

## 📚 RESSOURCES

### Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `environment.yml` | Configuration Conda complète |
| `requirements-python.txt` | Dépendances pip centralisées |
| `setup-conda.ps1` | Script installation automatique |
| `start-python-backend.ps1` | Lancer backend FastAPI/Flask |
| `test-python-backend.ps1` | Tests complets |
| `CONDA_SETUP.md` | Documentation détaillée |
| `ANALYSE_COMPLETE_PROJET.md` | Analyse complète projet |

### Documentation

- **Guide Complet:** [CONDA_SETUP.md](CONDA_SETUP.md)
- **Analyse Projet:** [ANALYSE_COMPLETE_PROJET.md](ANALYSE_COMPLETE_PROJET.md)
- **README Principal:** [README.md](README.md)

### Commandes Utiles

```powershell
# Lister environnements
conda env list

# Packages installés
conda list

# Mettre à jour Conda
conda update conda

# Nettoyer cache
conda clean --all

# Export environnement
conda env export > env-backup.yml
```

---

## ✅ CHECKLIST POST-INSTALLATION

- [ ] Conda installé (vérifier: `conda --version`)
- [ ] Environnement `iapostemanager` créé
- [ ] Packages installés (60+)
- [ ] Imports testés (FastAPI, NumPy, etc.)
- [ ] VS Code configuré (interpréteur Python)
- [ ] Backend démarre correctement
- [ ] API accessible (http://localhost:8000/docs)
- [ ] Ollama configuré (optionnel)

---

## 🎯 WORKFLOW DÉVELOPPEMENT

```powershell
# 1. Activer environnement (début journée)
conda activate iapostemanager

# 2. Lancer backend
.\start-python-backend.ps1

# 3. Dans autre terminal: Lancer Next.js
npm run dev

# 4. Développer...
code .

# 5. Tests
pytest
npm test

# 6. Commit & Push
git add .
git commit -m "feat: nouvelle fonctionnalité IA"
git push
```

---

## 📊 STRUCTURE BACKEND PYTHON

```
Backend Python:
├── src/backend/
│   ├── main.py ⭐              # FastAPI principal
│   ├── services/
│   │   ├── predictive_ai.py   # Prédictions juridiques (NumPy)
│   │   ├── pdf_generator.py   # Génération PDF
│   │   └── email_service.py   # Service email
│   ├── api/                   # Endpoints API
│   └── models.py              # Modèles Pydantic
│
├── backend-python/
│   └── app.py                 # Flask simple (alternatif)
│
└── requirements-python.txt    # Dépendances centralisées
```

---

## 💡 PROCHAINES ÉTAPES

### Immédiat
1. ✅ Exécuter `.\setup-conda.ps1`
2. ✅ Tester avec `.\test-python-backend.ps1`
3. ✅ Lancer backend `.\start-python-backend.ps1`

### Court Terme
- [ ] Créer tests unitaires (`src/backend/tests/`)
- [ ] Documenter API Python (docstrings)
- [ ] Intégrer Ollama pour prédictions IA
- [ ] Configurer CI/CD pour tests Python

### Moyen Terme
- [ ] Migration PostgreSQL (production)
- [ ] Cache Redis
- [ ] Monitoring Prometheus
- [ ] Déploiement Docker

---

## 🆘 SUPPORT

### Erreurs Communes

**ImportError:** Vérifier `conda activate iapostemanager`  
**Port occupé:** Changer port dans script  
**Ollama error:** Service optionnel, pas critique

### Commandes Debug

```powershell
# Vérifier Python utilisé
python -c "import sys; print(sys.executable)"

# Lister packages
pip list

# Infos environnement
conda info

# Logs détaillés
uvicorn main:app --log-level debug
```

### Contact

- 📧 Voir documentation principale
- 📚 [CONDA_SETUP.md](CONDA_SETUP.md)
- 🐛 [GitHub Issues](https://github.com/...)

---

**Dernière mise à jour:** 19 janvier 2026  
**Version:** 1.0  
**Prêt pour production** ✅
