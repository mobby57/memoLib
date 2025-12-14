# 🌟 Fonctionnalités d'Accessibilité Universelle

## Vue d'ensemble

IAPosteManager intègre un système complet d'accessibilité conçu pour être utilisable par **tous**, quelle que soit leur situation de handicap. Le système prend en charge :

- 👁️ **Personnes aveugles** : Synthèse vocale (TTS), descriptions audio, navigation clavier
- 👂 **Personnes sourdes** : Transcriptions visuelles en temps réel, notifications visuelles
- 🗣️ **Personnes muettes** : Alternatives textuelles, templates pré-définis
- ⌨️ **Mobilité réduite** : Raccourcis clavier complets, grandes zones cliquables

---

## 📁 Architecture Backend

### Service Principal : `universal_access.py`

```
src/accessibility/universal_access.py
```

**Classes principales :**
- `UniversalAccessibilityService` : Service singleton pour toutes les fonctionnalités

**Fonctionnalités :**
```python
# Synthèse vocale (pour aveugles)
accessibility_service.speak(text, priority='normal')

# Transcription visuelle (pour sourds)
accessibility_service.add_visual_transcript(text, type='system')

# Annonce universelle (audio + visuel)
accessibility_service.announce_action(action, details, speak=True, show=True)

# Descriptions d'écran
accessibility_service.generate_audio_description(context)

# Profils personnalisés
profile = accessibility_service.create_accessibility_profile(['blind', 'deaf'])

# Raccourcis clavier
shortcuts = accessibility_service.get_keyboard_shortcuts()
```

---

## 🔌 API Routes (Flask)

Toutes les routes d'accessibilité sont dans `src/web/app.py` :

### 1. Synthèse Vocale (TTS)
```http
POST /api/accessibility/speak
Content-Type: application/json

{
  "text": "Enregistrement démarré",
  "priority": "high"  // normal, high, urgent
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Texte prononcé",
  "text": "Enregistrement démarré"
}
```

---

### 2. Transcriptions Visuelles
```http
GET /api/accessibility/transcripts?limit=50
```

**Réponse :**
```json
{
  "success": true,
  "transcripts": [
    {
      "timestamp": "2025-12-11T14:30:00",
      "text": "Enregistrement démarré",
      "type": "system"
    }
  ],
  "count": 1
}
```

---

### 3. Annonces Universelles
```http
POST /api/accessibility/announce
Content-Type: application/json

{
  "action": "Enregistrement",
  "details": "Démarrage de l'enregistrement vocal",
  "speak": true,   // Prononcé pour aveugles
  "show": true     // Affiché pour sourds
}
```

**Réponse :**
```json
{
  "success": true,
  "result": {
    "audio": "spoken",
    "visual": "displayed",
    "timestamp": "2025-12-11T14:30:00"
  }
}
```

---

### 4. Raccourcis Clavier
```http
GET /api/accessibility/keyboard-shortcuts
```

**Réponse :**
```json
{
  "success": true,
  "shortcuts": {
    "record": "Ctrl+R",
    "tts_toggle": "Ctrl+T",
    "high_contrast": "Ctrl+H",
    "zoom_in": "Ctrl++",
    "zoom_out": "Ctrl+-",
    "describe_screen": "Ctrl+D"
  }
}
```

---

### 5. Paramètres d'Accessibilité
```http
GET /api/accessibility/settings

POST /api/accessibility/settings
Content-Type: application/json

{
  "tts_rate": 150,         // mots par minute
  "tts_volume": 1.0,       // 0.0 à 1.0
  "font_size": "large",    // small, medium, large, x-large
  "toggle_contrast": true, // activer/désactiver
  "toggle_tts": true       // activer/désactiver
}
```

**Réponse :**
```json
{
  "success": true,
  "settings": {
    "tts_enabled": true,
    "tts_rate": 150,
    "tts_volume": 1.0,
    "font_size": "large",
    "high_contrast": false
  }
}
```

---

### 6. Profils Personnalisés
```http
POST /api/accessibility/profile
Content-Type: application/json

{
  "needs": ["blind", "motor_impaired"]
}
```

**Réponse :**
```json
{
  "success": true,
  "profile": {
    "name": "Profil aveugle + mobilité réduite",
    "description": "Synthèse vocale active + navigation clavier complète",
    "settings": {
      "tts_enabled": true,
      "tts_rate": 150,
      "font_size": "x-large",
      "high_contrast": true
    },
    "features": [
      "Synthèse vocale pour tout le contenu",
      "Navigation complète au clavier",
      "Grandes zones cliquables"
    ]
  }
}
```

---

### 7. Description d'Écran
```http
POST /api/accessibility/describe-screen
Content-Type: application/json

{
  "context": {
    "page": "send-email",
    "elements_visible": ["recipient_field", "subject_field", "send_button"],
    "focus": "recipient_field"
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "description": "Vous êtes sur la page d'envoi d'email. Le curseur est dans le champ destinataire. Il y a aussi un champ sujet et un bouton envoyer disponibles."
}
```

---

## 🎨 Composants React

### 1. `AccessibilityPanel.jsx`

Composant principal pour les paramètres d'accessibilité.

**Import :**
```jsx
import AccessibilityPanel from '../components/AccessibilityPanel';
```

**Utilisation :**
```jsx
<AccessibilityPanel />
```

**Fonctionnalités :**
- Profils rapides (aveugle, sourd, muet, mobilité réduite)
- Paramètres TTS (vitesse, volume)
- Taille de police
- Haut contraste
- Transcriptions visuelles
- Raccourcis clavier

---

### 2. Page `Accessibility.jsx`

Page complète dédiée à l'accessibilité.

**Route :** `/accessibility`

**Contenu :**
- Bannière d'information sur les fonctionnalités
- Panel de configuration
- Guide d'utilisation
- Support

---

## 🔧 Intégration dans VoiceTranscription

La page `VoiceTranscription.jsx` intègre maintenant l'accessibilité :

### Fonctionnalités ajoutées :

#### 1. Annonces vocales + visuelles
```jsx
const announceAction = async (action, details, speak = true) => {
  await axios.post('/api/accessibility/announce', {
    action,
    details,
    speak: speak && accessibilitySettings.tts_enabled,
    show: true
  });
};

// Exemples d'utilisation
await announceAction('Enregistrement', 'Démarrage de l\'enregistrement vocal');
await announceAction('Connexion', 'Connexion établie - Parlez maintenant');
await announceAction('Transcription', 'Transcription terminée avec succès');
await announceAction('Erreur', error.message);
```

#### 2. Transcription visuelle en temps réel
```jsx
const [visualTranscripts, setVisualTranscripts] = useState([]);

// Ajout de transcription
socket.on('transcription_update', (data) => {
  const newTranscript = {
    timestamp: new Date().toLocaleTimeString(),
    text: data.text,
    type: 'transcription',
    is_final: data.is_final
  };
  setVisualTranscripts(prev => [...prev, newTranscript]);
});
```

#### 3. Paramètres d'accessibilité intégrés
```jsx
<div className="grid grid-cols-2 gap-4">
  {/* TTS Toggle */}
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
    <span>Réponse vocale (TTS)</span>
    <input type="checkbox" checked={accessibilitySettings.tts_enabled} />
  </div>
  
  {/* Haut contraste */}
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
    <span>Haut contraste</span>
    <input type="checkbox" checked={accessibilitySettings.high_contrast} />
  </div>
</div>
```

---

## ⌨️ Raccourcis Clavier Complets

| Raccourci | Action | Description |
|-----------|--------|-------------|
| `Ctrl+R` | Enregistrer | Démarre/arrête l'enregistrement vocal |
| `Ctrl+T` | TTS Toggle | Active/désactive la synthèse vocale |
| `Ctrl+H` | Haut contraste | Active/désactive le mode haut contraste |
| `Ctrl++` | Zoom+ | Augmente la taille du texte |
| `Ctrl+-` | Zoom- | Diminue la taille du texte |
| `Ctrl+D` | Décrire | Décrit l'écran courant (pour aveugles) |
| `Tab` | Navigation | Navigue entre les éléments |
| `Enter` | Activer | Active l'élément sélectionné |
| `Esc` | Annuler | Ferme les modales |

---

## 🎯 Guide d'Utilisation par Handicap

### 👁️ Pour les Personnes Aveugles

**Configuration initiale :**
1. Aller sur `/accessibility`
2. Cliquer sur le profil "Aveugle"
3. Le système active automatiquement :
   - Synthèse vocale (TTS)
   - Navigation clavier
   - Descriptions audio

**Navigation au quotidien :**
- Utiliser `Tab` pour naviguer entre les éléments
- Utiliser `Ctrl+D` pour obtenir une description de l'écran
- Toutes les actions importantes sont prononcées automatiquement
- Compatible avec les lecteurs d'écran (NVDA, JAWS)

---

### 👂 Pour les Personnes Sourdes

**Configuration initiale :**
1. Aller sur `/accessibility`
2. Cliquer sur le profil "Sourd"
3. Le système active automatiquement :
   - Transcriptions visuelles
   - Notifications visuelles
   - Indicateurs d'état

**Utilisation de l'enregistrement vocal :**
1. Aller sur `/voice-transcription`
2. Cliquer sur "Démarrer l'enregistrement"
3. La transcription apparaît en temps réel dans la zone visuelle
4. Toutes les annonces sont affichées visuellement (fond bleu)

---

### 🗣️ Pour les Personnes Muettes

**Alternatives disponibles :**
1. **Templates** : Utiliser des modèles pré-définis (`/templates`)
2. **Saisie texte** : Tous les champs acceptent la saisie clavier
3. **Assistant IA** : Générer des emails par texte (`/ai-multimodal`)
4. **Documents** : Analyser des documents et générer des réponses

**Pas besoin de vocal** - Toutes les fonctionnalités sont accessibles par texte.

---

### ⌨️ Pour Mobilité Réduite

**Configuration initiale :**
1. Aller sur `/accessibility`
2. Cliquer sur le profil "Moteur"
3. Le système active automatiquement :
   - Raccourcis clavier complets
   - Grandes zones cliquables
   - Pas de double-clic requis

**Raccourcis essentiels :**
- `Ctrl+R` : Enregistrer
- `Tab` : Naviguer
- `Enter` : Valider
- `Esc` : Annuler

---

## 🧪 Tests

### Test TTS
```bash
# Dans Python
from src.accessibility.universal_access import accessibility_service

accessibility_service.speak("Ceci est un test")
accessibility_service.announce_action("Test", "Annonce de test")
```

### Test API
```bash
# Synthèse vocale
curl -X POST http://localhost:5000/api/accessibility/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "Test de synthèse vocale"}'

# Annonce
curl -X POST http://localhost:5000/api/accessibility/announce \
  -H "Content-Type: application/json" \
  -d '{"action": "Test", "details": "Détails du test"}'

# Paramètres
curl http://localhost:5000/api/accessibility/settings
```

---

## 📦 Dépendances

### Backend
- `pyttsx3` : Synthèse vocale (TTS)
- `threading` : Gestion asynchrone
- `datetime` : Horodatage

### Frontend
- `axios` : Requêtes HTTP
- `framer-motion` : Animations
- `lucide-react` : Icônes

---

## 🚀 Déploiement

### Installation
```bash
# Backend
pip install pyttsx3

# Frontend
npm install axios framer-motion lucide-react
```

### Démarrage
```bash
# Backend
python src/web/app.py

# Frontend
cd frontend-react
npm run dev
```

---

## 📝 Checklist Accessibilité

- ✅ Synthèse vocale (TTS) fonctionnelle
- ✅ Transcriptions visuelles en temps réel
- ✅ Raccourcis clavier complets
- ✅ Navigation Tab optimisée
- ✅ Mode haut contraste
- ✅ Tailles de police ajustables
- ✅ Profils personnalisés
- ✅ Annonces universelles (audio + visuel)
- ✅ Descriptions d'écran pour aveugles
- ✅ Alternatives textuelles pour muets
- ✅ Grandes zones cliquables
- ✅ Compatible lecteurs d'écran
- ✅ ARIA labels et roles
- ✅ Documentation complète

---

## 🆘 Support

Si vous rencontrez des problèmes avec l'accessibilité :

1. Vérifier la [documentation complète](./GUIDE_ACCESSIBILITE.md)
2. Consulter les [raccourcis clavier](./SHORTCUTS.md)
3. Tester les fonctionnalités dans `/accessibility`
4. Contacter le support

---

## 📚 Ressources Additionnelles

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)

---

**Version :** 1.0.0  
**Dernière mise à jour :** 11 décembre 2025  
**Auteur :** IAPosteManager Team
