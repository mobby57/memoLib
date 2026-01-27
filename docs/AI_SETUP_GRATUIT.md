# Configuration IA Gratuite avec Ollama 🆓

## Vue d'ensemble

Votre application utilise un système IA **multi-tier** qui privilégie les solutions gratuites:

```
Tier 1: Ollama (GRATUIT, local)
   ⬇ fallback si indisponible
Tier 2: Azure OpenAI GPT-5.1 (PREMIUM payant)
   ⬇ fallback si non configuré
Tier 3: OpenAI public API (PAYANT)
```

## 🎯 Solution 100% GRATUITE : Ollama

### Installation Ollama

#### Sur Linux/Mac:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Sur Windows:
Télécharger depuis [ollama.com](https://ollama.com/download)

#### Vérification:
```bash
ollama --version
```

### Configuration

1. **Démarrer Ollama** (automatique après installation)
```bash
# Si besoin de démarrer manuellement:
ollama serve
```

2. **Télécharger un modèle gratuit**:
```bash
# Modèle recommandé (léger, performant)
ollama pull llama3.2:latest

# Alternatives:
ollama pull mistral:latest       # Excellent pour le français
ollama pull mixtral:latest       # Plus puissant
ollama pull codellama:latest     # Spécialisé code
```

3. **Variables d'environnement**:
```bash
# Dans .env ou .env.local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
```

4. **Test de connexion**:
```bash
curl http://localhost:11434/api/tags
```

### Utilisation

L'application **utilise automatiquement Ollama** si `OLLAMA_BASE_URL` est défini.

**Aucune autre configuration requise !** 🎉

## 💎 Configuration Premium (optionnelle)

### Azure OpenAI GPT-5.1

Pour les clients premium ou pour GPT-5.1:

```bash
AZURE_OPENAI_ENDPOINT=https://votre-ressource.openai.azure.com/
AZURE_OPENAI_API_KEY=votre-cle-azure
AZURE_OPENAI_DEPLOYMENT=gpt-5.1-preview
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

> **Note**: GPT-5.1 n'est disponible que via Azure OpenAI, pas l'API publique.

### Fallback OpenAI Public

Si Ollama et Azure sont indisponibles:

```bash
OPENAI_API_KEY=sk-proj-votre-cle-openai
```

## 🔄 Stratégie de Fallback

L'application essaie dans l'ordre:

1. **Ollama** → Si `OLLAMA_BASE_URL` configuré
   - Gratuit ✅
   - Local (rapide) ✅
   - Pas de limite de quota ✅
   - Fonctionne offline ✅

2. **Azure OpenAI** → Si credentials Azure complets
   - GPT-5.1 disponible ✅
   - Meilleure qualité ✅
   - Payant ❌
   - Nécessite internet ❌

3. **OpenAI Public** → Si `OPENAI_API_KEY` configuré
   - Bonne qualité ✅
   - Payant ❌
   - Limites de quota ❌
   - GPT-5.1 non disponible ❌

## 📊 Comparaison Modèles

| Modèle | Coût | Qualité | Vitesse | GPT-5.1 | Offline |
|--------|------|---------|---------|---------|---------|
| Ollama llama3.2 | **Gratuit** | ⭐⭐⭐⭐ | Rapide | ❌ | ✅ |
| Ollama mistral | **Gratuit** | ⭐⭐⭐⭐ | Rapide | ❌ | ✅ |
| Azure GPT-5.1 | ~$0.03/1k tokens | ⭐⭐⭐⭐⭐ | Moyen | ✅ | ❌ |
| OpenAI GPT-4 | ~$0.01/1k tokens | ⭐⭐⭐⭐⭐ | Moyen | ❌ | ❌ |

## 🚀 Démarrage Rapide (100% Gratuit)

```bash
# 1. Installer Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Télécharger modèle
ollama pull llama3.2:latest

# 3. Configurer .env
echo "OLLAMA_BASE_URL=http://localhost:11434" >> .env.local
echo "OLLAMA_MODEL=llama3.2:latest" >> .env.local

# 4. Démarrer l'application
npm run dev
```

**C'est tout !** L'IA fonctionne en local, gratuitement, sans limite. 🎉

## 🔧 Dépannage

### Ollama ne répond pas
```bash
# Redémarrer le service
killall ollama
ollama serve &
```

### Port déjà utilisé
```bash
# Changer le port dans .env
OLLAMA_BASE_URL=http://localhost:11435
```

### Modèle introuvable
```bash
# Lister les modèles installés
ollama list

# Télécharger si manquant
ollama pull llama3.2:latest
```

## 📝 Notes

- **Ollama** est open-source, gratuit, sans limite de quota
- Fonctionne 100% en local (pas de données envoyées à l'extérieur)
- Consomme ~4-8GB RAM selon le modèle
- Recommandé pour **95% des cas d'usage**
- Azure/OpenAI recommandés uniquement pour GPT-5.1 ou analyse très complexe

## 🔗 Ressources

- [Ollama Documentation](https://ollama.com/docs)
- [Modèles disponibles](https://ollama.com/library)
- [Azure OpenAI](https://azure.microsoft.com/fr-fr/products/ai-services/openai-service)
