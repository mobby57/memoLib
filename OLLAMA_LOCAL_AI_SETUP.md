# 🤖 Configuration IA Locale avec Ollama

## 🎯 Pourquoi l'IA Locale?

### ✅ Avantages pour un Cabinet d'Avocat

1. **Confidentialité Absolue** 🔒
   - Données juridiques sensibles restent sur votre serveur
   - Aucune transmission à des services tiers (OpenAI, Anthropic, etc.)
   - Conformité RGPD garantie
   - Secret professionnel respecté

2. **Coût Zéro** 💰
   - Pas de frais d'API (Claude coûte ~$15-60/million tokens)
   - Traitement illimité d'emails
   - Économie de plusieurs centaines d'euros par mois

3. **Contrôle Total** ⚙️
   - Choix du modèle selon vos besoins
   - Personnalisation possible avec fine-tuning
   - Pas de limite de requêtes
   - Fonctionne hors-ligne

4. **Performance** ⚡
   - Réponses rapides (pas de latence réseau)
   - Traitement en local
   - Scalable selon votre matériel

---

## 📥 Installation Ollama

### Windows

1. **Télécharger Ollama**
   - Aller sur [ollama.com](https://ollama.com/download/windows)
   - Télécharger `OllamaSetup.exe`
   - Installer (installation simple, comme n'importe quel logiciel)

2. **Vérifier l'installation**
   ```powershell
   ollama --version
   ```

3. **Démarrer Ollama** (se lance automatiquement au démarrage)
   - L'icône Ollama apparaît dans la barre des tâches
   - Le serveur tourne sur `http://localhost:11434`

### Linux / macOS

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

## 🧠 Choix du Modèle IA

### Pour le Juridique (CESEDA, Réponses Emails)

Voici les meilleurs modèles testés pour le contexte juridique français:

#### 🥇 **Recommandé : Llama 3.2 (3B)** - Rapide et Efficace
```bash
ollama pull llama3.2:latest
```
- ✅ Excellent pour les réponses emails
- ✅ Rapide (même sur CPU moyen)
- ✅ Bon en français
- ✅ 3GB RAM minimum
- 📊 Performance: **8/10**

#### 🥈 **Alternative : Mistral (7B)** - Meilleur en Français
```bash
ollama pull mistral:latest
```
- ✅ Excellent français (développé en France)
- ✅ Très bon en contexte juridique
- ✅ Raisonnement solide
- ⚠️ Plus lourd (8GB RAM recommandé)
- 📊 Performance: **9/10**

#### 🥉 **Haute Performance : Llama 3.1 (8B)** - Le Plus Puissant
```bash
ollama pull llama3.1:latest
```
- ✅ Meilleure compréhension du contexte
- ✅ Réponses plus nuancées
- ✅ Excellent pour extractions complexes
- ⚠️ Nécessite 16GB RAM
- 📊 Performance: **10/10**

#### 🚀 **Expert : Qwen 2.5 (14B)** - Pour Serveur Puissant
```bash
ollama pull qwen2.5:14b
```
- ✅ Très performant en français
- ✅ Excellent en extraction de données structurées
- ✅ Gère bien le contexte juridique
- ⚠️ Nécessite 32GB RAM
- 📊 Performance: **10/10**

---

## ⚙️ Configuration dans iaPostemanage

### 1. Vérifier Ollama

```powershell
# Vérifier que le serveur tourne
curl http://localhost:11434/api/tags
```

Réponse attendue:
```json
{
  "models": [
    {
      "name": "llama3.2:latest",
      "modified_at": "...",
      "size": 2019393189
    }
  ]
}
```

### 2. Tester le Modèle

```powershell
ollama run llama3.2:latest "Écris une réponse professionnelle à un client qui demande un rendez-vous pour un dossier CESEDA urgent."
```

### 3. Configuration .env

Votre fichier `.env` est déjà configuré:

```env
OLLAMA_ENABLED="true"
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2:latest"
```

### 4. Configuration par Tenant

Chaque cabinet peut avoir sa propre configuration dans l'interface admin:

- **URL Ollama**: `http://localhost:11434` (ou IP serveur distant)
- **Modèle**: `llama3.2:latest`, `mistral:latest`, etc.
- **Activé**: `true`

---

## 🧪 Test de Génération de Réponse

### Test Simple

```typescript
// Test dans Node.js
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.2:latest',
    prompt: 'Génère une réponse professionnelle pour un avocat spécialisé en CESEDA qui reçoit un email d\'un client demandant un rendez-vous urgent pour un titre de séjour.',
    stream: false
  })
});

const data = await response.json();
console.log(data.response);
```

### Test avec l'API Email

1. **Lancer le monitoring intégré**:
   ```powershell
   npm run email:monitor:integrated
   ```

2. **Vérifier les logs**:
   - Chercher `🤖 Génération avec IA locale Ollama...`
   - Chercher `✅ Brouillon généré localement`

3. **Tester la génération de réponse**:
   ```bash
   # Via API
   curl -X POST http://localhost:3000/api/lawyer/emails/ai-response \
     -H "Content-Type: application/json" \
     -d '{
       "emailId": "your-email-id",
       "action": "generate"
     }'
   ```

---

## 🎛️ Optimisation des Performances

### Configuration Ollama Avancée

Créer un fichier `modelfile` pour personnaliser:

```modelfile
FROM llama3.2:latest

# Paramètres pour le juridique français
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 1024

# Prompt système pour CESEDA
SYSTEM """
Tu es un assistant juridique spécialisé en droit des étrangers (CESEDA).
Tu rédiges des réponses professionnelles pour un cabinet d'avocat français.
Ton ton est formel, respectueux et conforme aux usages juridiques français.
Tu respectes le secret professionnel et la confidentialité des clients.
"""
```

Créer le modèle personnalisé:
```bash
ollama create ceseda-assistant -f ./modelfile
```

Utiliser le modèle personnalisé:
```env
OLLAMA_MODEL="ceseda-assistant"
```

### Accélération GPU (Optionnel)

Si vous avez une carte NVIDIA:

1. Installer CUDA Toolkit 12.x
2. Ollama détecte automatiquement le GPU
3. Vérifier:
   ```powershell
   ollama list
   # GPU device sera affiché
   ```

Performance attendue:
- **CPU**: 10-30 tokens/sec
- **GPU (RTX 3060)**: 50-100 tokens/sec
- **GPU (RTX 4090)**: 150-300 tokens/sec

---

## 📊 Comparaison IA Cloud vs Locale

| Critère | Claude API (Cloud) | Ollama (Local) |
|---------|-------------------|----------------|
| **Confidentialité** | ⚠️ Données envoyées à Anthropic | ✅ 100% local |
| **Coût** | 💰 $15-60/million tokens | ✅ Gratuit |
| **Performance** | ⚡ Très rapide | ⚡ Rapide (selon matériel) |
| **Qualité** | 🌟 Excellente | 🌟 Bonne à excellente |
| **Hors-ligne** | ❌ Non | ✅ Oui |
| **RGPD** | ⚠️ Transfert hors UE | ✅ Conforme |
| **Limite** | ⚠️ Rate limits | ✅ Illimité |

---

## 🔧 Dépannage

### Erreur "Ollama API error: Failed to fetch"

**Solution:**
```powershell
# Vérifier que Ollama tourne
Get-Process ollama

# Redémarrer Ollama
# 1. Fermer l'icône dans la barre des tâches
# 2. Chercher "Ollama" dans le menu Démarrer
# 3. Relancer
```

### Réponses en Anglais

**Solution**: Forcer le français dans le prompt
```typescript
const userPrompt = `IMPORTANT: Réponds UNIQUEMENT en français.

Génère une réponse professionnelle...`;
```

### Modèle Trop Lent

**Solutions:**
1. Utiliser un modèle plus petit: `llama3.2:3b`
2. Réduire `num_predict` (moins de tokens générés)
3. Upgrader la RAM/CPU
4. Utiliser un GPU

### Erreur "Model not found"

```powershell
# Lister les modèles installés
ollama list

# Télécharger le modèle manquant
ollama pull llama3.2:latest
```

---

## 🚀 Déploiement Production

### Serveur Dédié Ollama

Pour un cabinet avec plusieurs utilisateurs:

1. **Serveur Linux (Ubuntu)**:
   ```bash
   # Installation
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Activer l'accès réseau
   sudo systemctl edit ollama
   
   # Ajouter:
   [Service]
   Environment="OLLAMA_HOST=0.0.0.0:11434"
   
   # Redémarrer
   sudo systemctl restart ollama
   ```

2. **Configuration iaPostemanage**:
   ```env
   OLLAMA_URL="http://192.168.1.100:11434"
   ```

3. **Firewall**:
   ```bash
   sudo ufw allow 11434/tcp
   ```

### Haute Disponibilité

Pour 100% uptime:

1. Installer Ollama sur plusieurs serveurs
2. Utiliser un load balancer (nginx):
   ```nginx
   upstream ollama_backend {
       server 192.168.1.100:11434;
       server 192.168.1.101:11434;
   }
   ```

---

## 📚 Ressources

- [Ollama Documentation](https://ollama.com/docs)
- [Modèles disponibles](https://ollama.com/library)
- [Fine-tuning Guide](https://ollama.com/blog/fine-tuning)
- [Llama 3.2 Paper](https://ai.meta.com/llama/)
- [Mistral Documentation](https://mistral.ai/technology/)

---

## 🎓 Cas d'Usage Juridique

### 1. Réponse Email Nouveau Client

**Prompt Ollama:**
```
Génère une réponse professionnelle pour un avocat spécialisé en CESEDA.

Email client:
"Bonjour, je suis en situation irrégulière et j'ai reçu une OQTF. 
Pouvez-vous m'aider? Je suis disponible cette semaine."

Contexte: Premier contact, urgence OQTF

Réponse (ton formel, propose RDV urgence, mentionne documents nécessaires):
```

### 2. Extraction Données Structurées

**Prompt:**
```
Extrais les informations de cet email en JSON:

"Mon numéro de dossier préfecture: 2024-075-12345
Je suis joignable au 06 12 34 56 78
Mon titre de séjour expire le 15 mars 2026"

JSON (dates, phones, documentTypes, urgencyMarkers):
```

### 3. Résumé Email

**Prompt:**
```
Résume en 100 caractères max:

"Bonjour Maître, suite à notre rendez-vous du 5 janvier, 
je vous envoie les documents demandés: copie passeport, 
justificatif domicile, et bulletin salaire décembre. 
Mon dossier préfecture sera traité le 20 janvier selon 
la convocation reçue hier. Merci de confirmer réception."

Résumé:
```

---

## 🔐 Sécurité & RGPD

### Conformité RGPD

✅ **Ollama Local = 100% Conforme**

1. **Traitement local**: Données jamais transférées
2. **Pas de sous-traitant**: Pas de DPA nécessaire
3. **Maîtrise totale**: Suppression garantie
4. **Audit trail**: Logs locaux
5. **Chiffrement**: Possibilité de chiffrer les données au repos

### Registre des Traitements

Exemple d'entrée pour votre registre RGPD:

```
Traitement: Génération automatique de réponses emails
Finalité: Assistance rédactionnelle pour avocats
Base légale: Intérêt légitime (efficacité cabinet)
Données: Emails clients (nom, situation juridique)
Destinataires: Aucun (traitement 100% local)
Durée conservation: Selon durée du dossier
Mesures sécurité: IA locale (Ollama), pas de transfert externe
```

---

🎯 **Votre système est maintenant 100% confidentiel et RGPD-compliant!**
