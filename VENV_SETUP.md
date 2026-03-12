# 🐍 Configuration Environnement Virtuel Python - MemoLib

## 📋 Vue d'ensemble

Ce guide configure un environnement virtuel Python isolé pour toutes les dépendances Python du projet, incluant celles nécessitant compilation native (node-gyp, etc.).

## ✅ Avantages du venv

- ✅ **Isolation complète** - Pas de conflit avec Python système
- ✅ **Reproductibilité** - Versions exactes des packages
- ✅ **Pas de pollution globale** - Environnement propre
- ✅ **Compilation native** - Support complet node-gyp sans Visual Studio Build Tools
- ✅ **Gestion simplifiée** - Un seul environnement pour tout

## 🚀 Installation Rapide

### Méthode 1: Script automatique (Recommandé)

```powershell
# Double-cliquer sur:
setup-venv.bat
```

### Méthode 2: Manuelle

```powershell
# 1. Créer l'environnement virtuel
python -m venv venv

# 2. Activer l'environnement
.\venv\Scripts\Activate.ps1

# 3. Mettre à jour pip
python -m pip install --upgrade pip setuptools wheel

# 4. Installer les dépendances
pip install -r ai-service\requirements.txt
```

## 🔧 Utilisation Quotidienne

### Activer l'environnement

```powershell
# Option 1: Script batch
activate-venv.bat

# Option 2: PowerShell
.\venv\Scripts\Activate.ps1

# Option 3: CMD
venv\Scripts\activate.bat
```

### Vérifier l'activation

```powershell
# Vous devriez voir (venv) dans votre prompt
(venv) PS C:\Users\moros\Desktop\memolib\MemoLib.Api>

# Vérifier Python
python --version
which python  # Doit pointer vers venv\Scripts\python.exe
```

### Désactiver l'environnement

```powershell
deactivate
```

## 📦 Gestion des Packages

### Installer un nouveau package

```powershell
# Activer venv d'abord
.\venv\Scripts\Activate.ps1

# Installer
pip install nom-du-package

# Mettre à jour requirements.txt
pip freeze > ai-service\requirements.txt
```

### Mettre à jour les packages

```powershell
# Activer venv
.\venv\Scripts\Activate.ps1

# Mettre à jour tous les packages
pip install --upgrade -r ai-service\requirements.txt

# Ou un package spécifique
pip install --upgrade nom-du-package
```

### Lister les packages installés

```powershell
pip list
pip freeze
```

## 🏗️ Structure

```
MemoLib.Api/
├── venv/                          # Environnement virtuel (ignoré par git)
│   ├── Scripts/
│   │   ├── python.exe            # Python isolé
│   │   ├── pip.exe               # Pip isolé
│   │   └── activate.bat          # Script d'activation
│   ├── Lib/                      # Bibliothèques Python
│   └── Include/                  # Headers C/C++
├── ai-service/
│   └── requirements.txt          # Dépendances Python
├── setup-venv.ps1               # Script de configuration
├── setup-venv.bat               # Wrapper batch
└── activate-venv.bat            # Activation rapide
```

## 🔍 Dépendances Installées

### Core Framework
- `fastapi` - Framework web moderne
- `uvicorn` - Serveur ASGI
- `python-multipart` - Upload de fichiers

### AI/ML
- `openai` - API OpenAI
- `tiktoken` - Tokenization
- `langchain` - Framework LLM
- `langchain-openai` - Intégration OpenAI

### OCR & Documents
- `pytesseract` - OCR
- `pdf2image` - Conversion PDF
- `PyPDF2` - Manipulation PDF
- `python-docx` - Documents Word

### NLP
- `spacy` - Traitement du langage
- `nltk` - Natural Language Toolkit

### Data Processing
- `pandas` - Analyse de données
- `numpy` - Calcul numérique
- `pydantic` - Validation de données

### Database
- `prisma` - ORM moderne
- `asyncpg` - PostgreSQL async

### HTTP
- `httpx` - Client HTTP async
- `aiohttp` - Client HTTP async

### Security
- `python-jose` - JWT
- `passlib` - Hashing de mots de passe

### Monitoring
- `prometheus-fastapi-instrumentator` - Métriques
- `structlog` - Logging structuré

### Testing
- `pytest` - Framework de tests
- `pytest-asyncio` - Tests async
- `pytest-cov` - Couverture de code

## 🛠️ Dépannage

### Erreur "Execution Policy"

```powershell
# Autoriser l'exécution de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Python non trouvé

```powershell
# Vérifier l'installation Python
python --version

# Si non installé, télécharger depuis:
# https://www.python.org/downloads/
```

### Erreur de compilation native

```powershell
# Installer Visual C++ Build Tools (si nécessaire)
# https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Ou utiliser des wheels pré-compilés
pip install --only-binary :all: nom-du-package
```

### Venv corrompu

```powershell
# Supprimer et recréer
Remove-Item -Recurse -Force venv
.\setup-venv.bat
```

## 🔄 Workflow Complet

```powershell
# 1. Configuration initiale (une seule fois)
.\setup-venv.bat

# 2. Activer l'environnement (chaque session)
.\activate-venv.bat

# 3. Travailler normalement
python ai-service/app/main.py
pytest tests/

# 4. Désactiver quand terminé
deactivate
```

## 📊 Comparaison avec Installation Globale

| Aspect | Global | venv |
|--------|--------|------|
| Isolation | ❌ Non | ✅ Oui |
| Conflits | ⚠️ Possibles | ✅ Aucun |
| Reproductibilité | ❌ Difficile | ✅ Facile |
| Nettoyage | ❌ Complexe | ✅ Simple (supprimer dossier) |
| Multi-projets | ❌ Problématique | ✅ Parfait |
| Permissions | ⚠️ Admin parfois | ✅ Utilisateur |

## 🎯 Bonnes Pratiques

1. **Toujours activer venv** avant d'installer des packages
2. **Mettre à jour requirements.txt** après chaque installation
3. **Ne jamais commiter venv/** dans git (déjà dans .gitignore)
4. **Recréer venv** sur un nouveau PC avec `setup-venv.bat`
5. **Tester régulièrement** avec `pip check`

## 📚 Ressources

- [Documentation Python venv](https://docs.python.org/3/library/venv.html)
- [Guide pip](https://pip.pypa.io/en/stable/)
- [Best Practices](https://docs.python-guide.org/dev/virtualenvs/)

## ✅ Checklist de Vérification

- [ ] Python 3.9+ installé
- [ ] venv créé avec `setup-venv.bat`
- [ ] Environnement activé (voir `(venv)` dans prompt)
- [ ] Dépendances installées (`pip list`)
- [ ] Tests passent (`pytest`)
- [ ] `.gitignore` contient `venv/`

## 🆘 Support

En cas de problème:
1. Vérifier les logs d'installation
2. Consulter la section Dépannage ci-dessus
3. Recréer le venv depuis zéro
4. Ouvrir une issue sur GitHub

---

**✨ Environnement virtuel configuré avec succès !**
