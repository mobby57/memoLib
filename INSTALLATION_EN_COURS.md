# 🚀 INSTALLATION RAPIDE - GUIDE PAS-À-PAS

## Situation Actuelle
Miniconda est en cours d'installation automatique (2-3 minutes).

## Étapes à Suivre (après l'installation)

### Étape 1 : Fermer et Rouvrir PowerShell
Une fois l'installation terminée, **fermez ce terminal** et ouvrez-en un nouveau.

### Étape 2 : Initialiser Conda pour PowerShell
Dans le nouveau terminal, exécutez :
```powershell
conda init powershell
```

### Étape 3 : Redémarrer le Terminal
Fermez et rouvrez à nouveau PowerShell pour que les changements prennent effet.

### Étape 4 : Créer l'Environnement
```powershell
cd C:\Users\moros\Desktop\iaPostemanage
.\install-conda-simple.ps1
```

Cette commande va :
- ✅ Créer l'environnement `iapostemanager`
- ✅ Installer Python 3.11
- ✅ Installer 60+ packages (FastAPI, NumPy, Flask, Ollama, etc.)
- ⏱️ Durée : 5-10 minutes

### Étape 5 : Activer l'Environnement
```powershell
conda activate iapostemanager
```

### Étape 6 : Vérifier l'Installation
```powershell
python --version
python -c "import fastapi, numpy, flask; print('OK - Tous les packages importes!')"
```

### Étape 7 : Lancer le Backend
```powershell
.\start-python-backend.ps1
```

Accédez à : http://localhost:8000/docs

### Étape 8 : Lancer le Frontend (dans un autre terminal)
```powershell
npm run dev
```

Accédez à : http://localhost:3000

## ⚡ Version Ultra-Rapide (résumé)

```powershell
# 1. Attendre fin installation Miniconda
# 2. Nouveau terminal
conda init powershell

# 3. Redémarrer terminal
# 4. Créer environnement
.\install-conda-simple.ps1

# 5. Utilisation quotidienne
conda activate iapostemanager
.\start-python-backend.ps1
```

## 🆘 Problèmes Fréquents

### "conda n'est pas reconnu"
➡️ Solution : Rouvrez un **nouveau** terminal après l'installation

### "conda init" ne fonctionne pas
➡️ Solution : Ajoutez Conda au PATH manuellement :
```powershell
$env:PATH += ";$env:USERPROFILE\Miniconda3\Scripts"
conda init powershell
```

### Installation très lente
➡️ Normal : 60+ packages à télécharger (~2-3 GB)
➡️ Patience : 5-10 minutes selon votre connexion

### "environment.yml not found"
➡️ Vérifiez que vous êtes dans le bon répertoire :
```powershell
cd C:\Users\moros\Desktop\iaPostemanage
```

## 📚 Documentation Complète
- **Guide détaillé** : [CONDA_SETUP.md](CONDA_SETUP.md)
- **Quickstart** : [CONDA_QUICKSTART.md](CONDA_QUICKSTART.md)
- **Analyse projet** : [ANALYSE_COMPLETE_PROJET.md](ANALYSE_COMPLETE_PROJET.md)
- **Index** : [INDEX_CONDA.md](INDEX_CONDA.md)

## ✅ Checklist Installation

- [ ] Miniconda installé (installation en cours...)
- [ ] Terminal redémarré
- [ ] `conda init powershell` exécuté
- [ ] Terminal redémarré à nouveau
- [ ] Environnement `iapostemanager` créé
- [ ] Python 3.11 installé
- [ ] Packages importés avec succès
- [ ] Backend démarre correctement
- [ ] Frontend accessible

**Prêt pour le développement !** 🎉
