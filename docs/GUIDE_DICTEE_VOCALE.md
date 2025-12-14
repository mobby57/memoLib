# Mode Dictée Vocale avec Prévisualisation et Amélioration IA

## 🎤 Fonctionnalités

Le nouveau mode de dictée vocale permet de :

1. **Parler et voir la transcription en temps réel**
   - Utilise Web Speech API (Chrome, Edge, Safari)
   - Affiche les résultats temporaires pendant que vous parlez
   - Transcription finale mise à jour automatiquement

2. **Éditer le texte avant validation**
   - Zone de texte éditable pour corriger la transcription
   - Possibilité de modifier pendant ou après la dictée
   - Bouton pour effacer et recommencer

3. **Améliorer avec l'IA**
   - Cliquez sur "Améliorer" pour que l'IA reformule le texte
   - Comparaison côte à côte : original vs amélioré
   - Acceptez ou refusez les suggestions

4. **Valider quand satisfait**
   - Le texte validé est inséré dans l'email
   - Possibilité d'annuler à tout moment

## 📁 Fichiers créés

### Frontend
- **`src/frontend/src/hooks/useVoiceInput.js`**
  - Hook React personnalisé pour la reconnaissance vocale
  - Gestion du microphone et des permissions
  - Support Web Speech API avec fallback

- **`src/frontend/src/components/VoiceToTextEditor.jsx`**
  - Composant principal de dictée vocale
  - Interface avec prévisualisation et contrôles
  - Intégration de l'amélioration IA

- **`src/frontend/src/components/VoiceToTextEditor.css`**
  - Styles modernes et responsive
  - Animations fluides
  - Indicateurs visuels d'état

### Backend
- **`src/backend/app.py`** (modifié)
  - Nouveau endpoint : `/api/ai/improve-text` (POST)
  - Améliore le texte avec OpenAI GPT-3.5
  - Fallback basique si pas de clé API

### API
- **`src/frontend/src/services/api.js`** (modifié)
  - Ajout de `aiAPI.improveText(text, options)`
  - Gestion des requêtes d'amélioration

### Pages
- **`src/frontend/src/pages/EmailComposer.jsx`** (modifié)
  - Bouton "🎤 Dicter avec validation"
  - Bascule entre saisie manuelle et dictée vocale

## 🚀 Utilisation

### 1. Dans EmailComposer

```jsx
// Le bouton apparaît au-dessus du champ Message
[🎤 Dicter avec validation]

// Cliquez dessus pour activer le mode dictée
```

### 2. Mode Dictée Vocale

```
┌─────────────────────────────────────────┐
│ 🎤 Dictée Vocale                        │
│                     [🟢 Écoute en cours] │
├─────────────────────────────────────────┤
│                                         │
│  [Zone de texte éditable]               │
│                                         │
│  En cours: "Je voudrais demander..."    │
│                                         │
├─────────────────────────────────────────┤
│ [🎤 Parler] [✨ Améliorer] [🗑️ Effacer] │
│                    [Annuler] [✓ Valider]│
└─────────────────────────────────────────┘
```

### 3. Amélioration IA

Après avoir dicté, cliquez sur "✨ Améliorer" :

```
┌─────────────────────────────────────────┐
│ ✨ Texte amélioré par l'IA              │
│                    [✓ Accepter] [✗ Refuser]│
├─────────────────────────────────────────┤
│ Original:                               │
│ je veux demander infos sur mon dossier  │
│                                         │
│ Amélioré:                               │
│ Je souhaiterais obtenir des informations│
│ concernant mon dossier.                 │
└─────────────────────────────────────────┘
```

## 🔧 Configuration

### Permissions Navigateur

Le navigateur demandera l'autorisation d'accès au microphone :

```
🎤 https://localhost:3001 souhaite utiliser votre microphone
                                    [Bloquer] [Autoriser]
```

Cliquez sur **Autoriser** pour activer la dictée.

### Navigateurs Supportés

✅ **Chrome/Chromium** (recommandé)
✅ **Microsoft Edge**
✅ **Safari** (macOS/iOS)
❌ Firefox (pas de Web Speech API)

### Backend OpenAI (optionnel)

Si vous avez une clé OpenAI configurée :
- L'amélioration utilise GPT-3.5-turbo
- Meilleure qualité de reformulation

Sans clé OpenAI :
- Amélioration basique (majuscules, ponctuation)
- Fonctionne toujours !

## 📝 Exemple de Workflow

1. **Composer un email**
   ```
   À: destinataire@example.com
   Sujet: Demande d'information
   Message: [Cliquez sur 🎤 Dicter avec validation]
   ```

2. **Activer la dictée**
   - Cliquez sur le bouton microphone 🎤
   - Autorisez l'accès si demandé
   - Parlez clairement : "Je souhaite obtenir des informations sur mon dossier postal..."

3. **Voir la transcription**
   ```
   Texte: "je souhaite obtenir des informations sur mon dossier postal"
   En cours: "merci de me recontacter..."
   ```

4. **Éditer si nécessaire**
   - Cliquez dans la zone de texte
   - Corrigez les erreurs de transcription
   - Ajoutez ou supprimez du texte

5. **Améliorer avec IA** (optionnel)
   - Cliquez sur "✨ Améliorer"
   - Attendez la suggestion (2-3 secondes)
   - Comparez original vs amélioré
   - Acceptez ou refusez

6. **Valider**
   - Cliquez sur "✓ Valider"
   - Le texte est inséré dans le champ Message
   - Vous pouvez encore le modifier manuellement

7. **Envoyer l'email**
   - Complétez les autres champs si nécessaire
   - Cliquez sur "📤 Envoyer"

## 🎯 Avantages

- **Plus rapide** : Parler est plus rapide que taper
- **Accessible** : Idéal pour les personnes à mobilité réduite
- **Contrôle total** : Validation avant envoi
- **Amélioration IA** : Texte professionnel automatiquement
- **Flexible** : Édition manuelle possible à tout moment

## 🐛 Dépannage

### "Reconnaissance vocale non supportée"
→ Utilisez Chrome, Edge ou Safari

### "Permission microphone refusée"
→ Autorisez dans les paramètres du navigateur
→ Chrome: chrome://settings/content/microphone

### "Aucune voix détectée"
→ Vérifiez que votre microphone fonctionne
→ Parlez plus fort ou plus près du micro
→ Vérifiez le volume d'entrée dans les paramètres système

### "Erreur amélioration IA"
→ Vérifiez que le backend est démarré
→ Si pas de clé OpenAI : amélioration basique utilisée
→ Le texte original est conservé en cas d'erreur

## 🔄 Redémarrage du Serveur

Pour que le nouveau endpoint `/api/ai/improve-text` soit disponible :

```powershell
# Arrêter le backend actuel
Get-Process python* | Where-Object { (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 5000 } | Stop-Process -Force

# Redémarrer
.\start-backend.ps1

# Ou redémarrer tout
.\start-all.ps1
```

Le frontend se recharge automatiquement (Hot Module Replacement).

## 📊 API Endpoint

### POST /api/ai/improve-text

**Request:**
```json
{
  "text": "je veux demander des infos",
  "tone": "professional",
  "context": "email",
  "language": "fr"
}
```

**Response:**
```json
{
  "success": true,
  "content": "Je souhaiterais obtenir des informations.",
  "text": "Je souhaiterais obtenir des informations.",
  "source": "openai",
  "original_length": 27,
  "improved_length": 45
}
```

## 🎨 Interface

L'interface utilise :
- Gradients modernes (violet/bleu)
- Animations fluides
- Indicateurs visuels clairs
- Design responsive (mobile-friendly)
- Aide contextuelle intégrée
