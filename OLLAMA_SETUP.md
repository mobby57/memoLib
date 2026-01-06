# 🤖 Installation Ollama - IA Locale

## Pourquoi Ollama ?

- ✅ **Gratuit** : Aucun coût d'API
- ✅ **Privé** : Données 100% locales, aucune fuite
- ✅ **Performant** : Modèles optimisés (Llama 3, Mistral)
- ✅ **Offline** : Fonctionne sans internet

---

## 🚀 Installation (5 minutes)

### 1. Télécharger Ollama

**Windows** :
```powershell
# Téléchargez depuis:
https://ollama.com/download/windows

# Ou utilisez winget:
winget install Ollama.Ollama
```

### 2. Vérifier l'installation

```powershell
ollama --version
```

### 3. Télécharger un modèle

**Recommandé : Llama 3.2 (3B)** - Rapide, excellent pour l'extraction d'informations :
```powershell
ollama pull llama3.2:3b
```

**Alternative : Mistral (7B)** - Plus puissant, plus lent :
```powershell
ollama pull mistral:7b
```

**Alternative : Llama 3.1 (8B)** - Équilibré :
```powershell
ollama pull llama3.1:8b
```

### 4. Tester

```powershell
ollama run llama3.2:3b "Bonjour, résume le droit CESEDA"
```

---

## ⚙️ Configuration

### Démarrer le serveur Ollama (automatique)

Ollama démarre automatiquement au démarrage de Windows.

**Vérifier si actif** :
```powershell
curl http://localhost:11434
```

**Résultat attendu** : `Ollama is running`

### Arrêter/Redémarrer

```powershell
# Arrêter
Stop-Process -Name ollama -Force

# Redémarrer (ouvre automatiquement)
ollama serve
```

---

## 🎯 Utilisation dans IA Poste Manager

### 1. Variables d'environnement

Ajoutez dans `.env.local` :
```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

### 2. Tester l'intégration

```powershell
npm run ai:test
```

---

## 📊 Modèles Recommandés

| Modèle | Taille | RAM | Vitesse | Usage |
|--------|--------|-----|---------|-------|
| **llama3.2:3b** | 2 GB | 8 GB | ⚡⚡⚡ | Extraction rapide |
| **llama3.1:8b** | 4.7 GB | 16 GB | ⚡⚡ | Équilibré |
| **mistral:7b** | 4.1 GB | 16 GB | ⚡⚡ | Analyse juridique |
| **llama3:70b** | 40 GB | 64 GB | ⚡ | Maximum qualité |

### Changement de modèle

```powershell
# Télécharger
ollama pull mistral:7b

# Changer dans .env.local
OLLAMA_MODEL=mistral:7b
```

---

## 🔍 Fonctionnalités IA Locale

**Extraction automatique** :
- 📋 Type de demande CESEDA (titre de séjour, visa, naturalisation, etc.)
- 📅 Dates et délais importants
- 📝 Documents nécessaires
- ⚠️ Risques juridiques
- 🎯 Actions recommandées
- 📊 Niveau d'urgence

**Analyse avancée** :
- Détection des situations OQTF
- Identification des recours possibles
- Suggestion de procédures
- Extraction des informations personnelles

---

## 🆘 Dépannage

### Ollama ne démarre pas

```powershell
# Vérifier les logs
Get-EventLog -LogName Application -Source Ollama -Newest 10

# Réinstaller
winget uninstall Ollama.Ollama
winget install Ollama.Ollama
```

### Le modèle est trop lent

Utilisez un modèle plus petit :
```powershell
ollama pull llama3.2:3b
```

### Erreur de mémoire

Fermez d'autres applications ou utilisez un modèle plus petit.

---

## 📚 Ressources

- [Ollama Documentation](https://ollama.com/docs)
- [Liste des modèles](https://ollama.com/library)
- [Llama 3 Guide](https://ollama.com/library/llama3)
