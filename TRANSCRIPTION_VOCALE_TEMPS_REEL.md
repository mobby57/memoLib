# 🎤 Transcription Vocale en Temps Réel

## Vue d'ensemble

Le système de **transcription vocale en temps réel** permet d'enregistrer votre voix et de voir le texte transcrit apparaître **instantanément** pendant que vous parlez. Plus besoin de taper : parlez et le texte s'affiche automatiquement !

---

## ✨ Fonctionnalités Clés

### 1. **Transcription en Direct**
- **Affichage texte pendant l'enregistrement** (délai ~2 secondes)
- Deux zones d'affichage :
  - **Transcription complète** : Texte complet accumulé
  - **Flux temps réel** : Phrases individuelles avec horodatage
- Détection automatique de la parole (français)
- Synchronisation audio ↔ texte parfaite

### 2. **Technologie WebSocket**
- Connexion temps réel bidirectionnelle
- Streaming des données audio
- Mise à jour instantanée du frontend
- Indicateur de connexion (vert = connecté)

### 3. **Enregistrement Audio**
- Qualité : 16 kHz, mono, 16-bit
- Format : WAV
- Sauvegarde automatique
- Téléchargement disponible après enregistrement

### 4. **Actions Post-Transcription**
- **Copier** le texte dans le presse-papiers
- **Télécharger** l'audio enregistré
- **Utiliser dans Email** : Pré-remplit le corps d'email
- **Effacer** et recommencer

### 5. **Statistiques en Direct**
- Nombre de mots
- Nombre de caractères
- Durée d'enregistrement (timer en direct)

### 6. **Sélection Microphone**
- Détection automatique de tous les micros disponibles
- Choix du périphérique audio dans les paramètres
- Affichage des caractéristiques (canaux, fréquence)

---

## 🎯 Cas d'Usage

### Scénario 1 : Rédaction Email Rapide
```
1. Ouvrir "Transcription vocale"
2. Cliquer sur le micro (bouton bleu/violet)
3. Dicter votre email : "Bonjour, je vous contacte pour..."
4. Voir le texte apparaître en temps réel
5. Cliquer sur "Stop" (bouton rouge)
6. Cliquer "Utiliser dans Email"
7. → Redirection vers page d'envoi avec texte pré-rempli
```

### Scénario 2 : Notes Vocales
```
1. Activer l'enregistrement
2. Parler librement pendant votre réunion
3. Texte transcrit automatiquement
4. Copier dans presse-papiers
5. Coller dans document Word/Notes
```

### Scénario 3 : Accessibilité
```
Utilisateur avec difficultés de frappe :
- Dicte au lieu de taper
- Texte précis et rapide
- Aucune manipulation complexe
- Utilisation immédiate dans emails
```

---

## 🛠️ Architecture Technique

### Stack Technologique

**Backend :**
- Python 3.x
- Flask-SocketIO (WebSocket)
- PyAudio (capture audio)
- SpeechRecognition (Google Speech API)
- Threading (traitement asynchrone)

**Frontend :**
- React 18
- Socket.io-client (WebSocket)
- Framer Motion (animations)
- Lucide React (icônes)

### Flux de Données

```
┌──────────────┐
│ Microphone   │ → Audio brut (PyAudio)
└──────────────┘
       ↓
┌──────────────┐
│ Audio Queue  │ → Chunks de 2 secondes
└──────────────┘
       ↓
┌──────────────┐
│ Google API   │ → Transcription (SpeechRecognition)
└──────────────┘
       ↓
┌──────────────┐
│ WebSocket    │ → Emit 'transcription_update'
└──────────────┘
       ↓
┌──────────────┐
│ React State  │ → Mise à jour UI instantanée
└──────────────┘
```

### Architecture Modulaire

#### Backend : `realtime_transcription.py` (500+ lignes)

**Classes principales :**

```python
class RealtimeTranscription:
    """Gestion enregistrement + transcription base"""
    
    # Configuration
    CHUNK = 1024
    RATE = 16000
    RECORD_SECONDS_CHUNK = 2
    
    # Méthodes publiques
    def list_microphones() -> List[Dict]
    def start_recording(callback, device_index) -> Dict
    def stop_recording(output_file) -> Dict
    
    # Threads internes
    def _record_audio()        # Thread enregistrement
    def _transcribe_audio()    # Thread transcription
    
    # Utilitaires
    def _save_audio(filename)
    def get_current_transcript() -> str
```

```python
class RealtimeTranscriptionWebSocket:
    """Wrapper WebSocket pour streaming"""
    
    def __init__(self, socketio)
    
    def start_session(device_index) -> Dict
    def stop_session(output_file) -> Dict
    def get_devices() -> List[Dict]
    
    # Callback interne
    def emit_text(text):
        socketio.emit('transcription_update', {
            'text': text,
            'timestamp': datetime.now().isoformat()
        })
```

#### Frontend : `VoiceTranscription.jsx` (600+ lignes)

**Composant React principal :**

```javascript
export default function VoiceTranscription() {
    // États
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [realtimeText, setRealtimeText] = useState([])
    const [audioDevices, setAudioDevices] = useState([])
    const [duration, setDuration] = useState(0)
    
    // WebSocket
    const socketRef = useRef(null)
    
    // Événements Socket
    socketRef.current.on('transcription_update', (data) => {
        setRealtimeText(prev => [...prev, data])
        setTranscript(prev => prev + ' ' + data.text)
    })
    
    // Contrôles
    const startRecording = async () => { ... }
    const stopRecording = async () => { ... }
    const copyTranscript = () => { ... }
    const downloadAudio = () => { ... }
    const useInEmail = () => { ... }
}
```

### Routes API Backend

#### Dans `src/web/app.py`

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/voice/devices` | GET | Liste micros disponibles |
| `/api/voice/start` | POST | Démarre enregistrement |
| `/api/voice/stop` | POST | Arrête et sauvegarde |
| `/api/voice/download/<file>` | GET | Télécharge audio |

**Événements WebSocket :**
- `transcription_update` : Nouveau texte transcrit
- `transcription_complete` : Fin d'enregistrement

### Intégration Flask-SocketIO

```python
# Dans app.py
from flask_socketio import SocketIO, emit

socketio = SocketIO(app, cors_allowed_origins="*")

realtime_transcription = RealtimeTranscriptionWebSocket(socketio)

# Lancement
if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000)
```

---

## 📊 Structure des Données

### Événement `transcription_update`

```json
{
  "text": "Bonjour je vous contacte pour",
  "timestamp": "2025-12-10T15:30:45.123456"
}
```

### Réponse `/api/voice/start`

```json
{
  "success": true,
  "message": "Enregistrement démarré",
  "temp_file": "temp_recording_20251210_153045.wav"
}
```

### Réponse `/api/voice/stop`

```json
{
  "success": true,
  "transcript": "Bonjour je vous contacte pour discuter de...",
  "audio_file": "voice_20251210_153045.wav",
  "duration": 45.2
}
```

### Format Périphérique Audio

```json
{
  "index": 0,
  "name": "Microphone (Realtek High Definition Audio)",
  "channels": 2,
  "sample_rate": 48000
}
```

---

## 🚀 Installation

### 1. Dépendances Backend

```bash
# Installer les paquets Python
pip install flask-socketio python-socketio pyaudio SpeechRecognition

# OU utiliser le fichier requirements
pip install -r requirements_voice.txt
```

**⚠️ Note pour PyAudio sous Windows :**

Si l'installation échoue :
```bash
# Télécharger le wheel depuis:
# https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio

# Exemple Python 3.11 64-bit:
pip install pyaudio‑0.2.14‑cp311‑cp311‑win_amd64.whl
```

### 2. Dépendances Frontend

```bash
cd frontend-react
npm install socket.io-client
```

Ou déjà ajouté dans `package.json` :
```json
"socket.io-client": "^4.7.2"
```

### 3. Vérification Installation

**Backend :**
```python
# Tester dans Python
import pyaudio
import speech_recognition as sr
from flask_socketio import SocketIO

print("✅ Toutes les dépendances installées")
```

**Frontend :**
```bash
npm list socket.io-client
# Devrait afficher: socket.io-client@4.7.2
```

---

## 💡 Utilisation

### Démarrage

```bash
# Terminal 1 : Backend
cd iaPostemanage
python src/web/app.py

# Terminal 2 : Frontend
cd frontend-react
npm run dev
```

### Interface

1. **Ouvrir** : http://localhost:3000/voice-transcription
2. **Vérifier connexion** : Badge vert "Connecté"
3. **Cliquer micro** : Bouton bleu/violet géant
4. **Parler** : Voir texte apparaître en 2s
5. **Stop** : Bouton rouge
6. **Actions** : Copier / Télécharger / Utiliser

### Paramètres (optionnel)

1. Cliquer icône ⚙️ (engrenage)
2. Sélectionner microphone dans liste déroulante
3. Voir caractéristiques (canaux, fréquence)

---

## 🎨 Interface Utilisateur

### Vue Principale

```
┌────────────────────────────────────────────────────────┐
│  🎤 Transcription Vocale en Temps Réel                 │
│  Parlez et voyez le texte apparaître instantanément    │
│                                         [●] Connecté   │
├────────────────────────────────────────────────────────┤
│                                                         │
│                    ┌─────────┐                         │
│                    │    🎤   │  ← Cliquer ici          │
│                    │ 192px   │                         │
│                    └─────────┘                         │
│                                                         │
│              Prêt à enregistrer                        │
│              ⏱️ Durée: 00:00                            │
│                                                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│  📝 Transcription Complète   │  🔄 Flux Temps Réel    │
│  ─────────────────────────   │  ────────────────────  │
│                               │                        │
│  Bonjour je vous contacte    │  ┌──────────────────┐  │
│  pour discuter de notre      │  │ Bonjour je vous  │  │
│  projet commun. Je souhaite  │  │ 15:30:12         │  │
│  organiser une réunion...    │  └──────────────────┘  │
│                               │  ┌──────────────────┐  │
│  ────────────────────────     │  │ contacte pour    │  │
│  Words: 24  Chars: 156       │  │ 15:30:14         │  │
│  Duration: 00:45              │  └──────────────────┘  │
│                               │                        │
└────────────────────────────────────────────────────────┘
```

### États du Bouton Micro

**Mode Inactif (bleu/violet) :**
```
┌─────────┐
│    🎤   │
│  PULSANT│  (effet hover scale 1.05)
└─────────┘
```

**Mode Enregistrement (rouge) :**
```
┌─────────┐
│    ⏹️    │
│ ANIMÉ   │  (cercle pulsant rouge)
└─────────┘
```

**Mode Désactivé (gris) :**
```
┌─────────┐
│    🎤   │
│ opacity │  (50%, cursor not-allowed)
└─────────┘
```

### Animations

- **Micro actif** : Cercle pulsant (scale 1 → 1.2 → 1, 1.5s loop)
- **Nouvelles phrases** : Slide-in gauche (x: -20 → 0, 0.3s)
- **Transitions** : AnimatePresence pour mount/unmount
- **Auto-scroll** : Vers dernière phrase automatiquement

---

## 🔧 Configuration Avancée

### Personnalisation Délai Transcription

```python
# Dans realtime_transcription.py
class RealtimeTranscription:
    RECORD_SECONDS_CHUNK = 2  # ← Modifier ici
    
    # 1 seconde = plus rapide mais moins précis
    # 3 secondes = plus lent mais plus précis
```

### Changer la Langue

```python
# Dans _transcribe_audio()
text = self.recognizer.recognize_google(
    audio_data, 
    language='fr-FR'  # ← en-US pour anglais
)
```

### Qualité Audio

```python
# Dans __init__()
self.RATE = 16000     # 16kHz (standard voix)
self.CHANNELS = 1     # Mono
self.FORMAT = pyaudio.paInt16  # 16-bit
```

---

## 📈 Performances

### Latence

| Étape | Temps | Cumul |
|-------|-------|-------|
| Capture audio (chunk) | 2.0s | 2.0s |
| Conversion WAV | 0.1s | 2.1s |
| API Google Speech | 0.5-1.0s | 2.6-3.1s |
| WebSocket emit | <0.1s | ~3s |

**Total : ~3 secondes** du moment où vous parlez à l'affichage

### Optimisations Possibles

1. **Réduire chunk size** : 1s au lieu de 2s (moins précis)
2. **API locale** : Vosk/Whisper (plus rapide, offline)
3. **Streaming audio** : Envoyer au fur et à mesure (complexe)

### Ressources Système

- **CPU** : 5-10% (transcription)
- **RAM** : ~100MB (buffers audio)
- **Réseau** : ~50KB/s (WebSocket)
- **Disque** : 1MB/min d'audio (WAV)

---

## 🔒 Sécurité et Confidentialité

### Données Audio

- **Stockage local** : `data/uploads/voice_*.wav`
- **Pas de cloud** : Sauf API Google (temporaire)
- **Suppression possible** : Fichiers accessibles

### API Google Speech

- ⚠️ Audio envoyé à Google pour transcription
- Traité et supprimé immédiatement (selon Google)
- Alternative : Installer Vosk (offline, local)

### WebSocket

- Connexion locale uniquement (127.0.0.1)
- Pas de chiffrement (localhost)
- Pour production : Ajouter SSL/TLS

---

## 🐛 Dépannage

### Problème : "Service non disponible"

**Cause** : Dépendances manquantes

**Solution :**
```bash
pip install flask-socketio pyaudio SpeechRecognition
```

### Problème : PyAudio installation fails

**Erreur** : `error: Microsoft Visual C++ 14.0 is required`

**Solution Windows :**
1. Télécharger wheel : https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio
2. `pip install pyaudio‑0.2.14‑cp311‑cp311‑win_amd64.whl`

**Solution Linux :**
```bash
sudo apt-get install portaudio19-dev python3-pyaudio
pip install pyaudio
```

### Problème : Aucun microphone détecté

**Vérifications :**
1. Micro branché et activé dans Windows
2. Permissions microphone accordées
3. Tester avec autre app (Dictaphone Windows)
4. Redémarrer application

### Problème : Transcription vide

**Causes possibles :**
1. Pas de connexion internet (API Google)
2. Parole inaudible / bruit de fond
3. Langue incorrecte (vérifier `language='fr-FR'`)
4. Micro muté

**Solution :**
- Parler plus fort et distinctement
- Réduire bruit ambiant
- Vérifier connexion internet

### Problème : WebSocket déconnecté

**Solution :**
1. Vérifier backend lancé : `python src/web/app.py`
2. Vérifier port 5000 libre
3. Actualiser page frontend (F5)
4. Vérifier console pour erreurs

---

## 🚀 Évolutions Futures

### Court terme
- [ ] Support multi-langues (sélection dans UI)
- [ ] Correction orthographique automatique
- [ ] Ponctuation intelligente
- [ ] Annulation/Reprise enregistrement

### Moyen terme
- [ ] API Whisper (OpenAI) - plus précise
- [ ] Vosk offline - sans internet
- [ ] Commandes vocales ("nouveau paragraphe", "stop")
- [ ] Export formats multiples (TXT, DOCX, PDF)

### Long terme
- [ ] Détection automatique de langue
- [ ] Transcription multi-locuteurs
- [ ] Analyse sentiment (ton, émotions)
- [ ] Résumé automatique IA

---

## 📚 Documentation Développeur

### Ajouter Nouvelle Action

**Backend :**
```python
@app.route('/api/voice/custom-action', methods=['POST'])
def custom_voice_action():
    # Votre logique
    return jsonify({'success': True})
```

**Frontend :**
```javascript
const customAction = async () => {
    const response = await fetch('http://127.0.0.1:5000/api/voice/custom-action', {
        method: 'POST',
        credentials: 'include'
    });
    const data = await response.json();
    // Traiter réponse
};
```

### Modifier UI Temps Réel

```javascript
// Dans VoiceTranscription.jsx
socketRef.current.on('transcription_update', (data) => {
    // Votre logique personnalisée
    console.log('Nouveau texte:', data.text);
    
    // Mise à jour state
    setRealtimeText(prev => [...prev, {
        ...data,
        customField: 'valeur'
    }]);
});
```

---

## 📞 Support

Pour questions ou problèmes :

1. **Documentation** : Ce fichier
2. **Code source** : `realtime_transcription.py`, `VoiceTranscription.jsx`
3. **Logs backend** : Console Python
4. **Logs frontend** : Console navigateur (F12)

---

## 📝 Résumé Technique

| Aspect | Détails |
|--------|---------|
| **Latence** | ~3 secondes |
| **Précision** | 85-95% (selon clarté) |
| **Langues** | Français par défaut (modifiable) |
| **Format audio** | WAV 16kHz mono |
| **Connexion** | WebSocket (temps réel) |
| **API** | Google Speech Recognition |
| **Offline** | Non (API externe requise) |
| **Stockage** | Local (`data/uploads/`) |

---

**🎉 Dictez vos emails au lieu de les taper - Gagnez 80% de temps !**
