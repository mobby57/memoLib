# 🎤 Audio API - Guide Complet

## Text-to-Speech (TTS) Avancé

### Voix Disponibles

**Voix Standard:**
- `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

**Nouvelles Voix HD:**
- `ash`, `ballad`, `coral`, `sage`, `verse`, `marin`, `cedar`

### Utilisation Simple

```javascript
import { voiceAPI } from './services/api';

// Génération audio basique
const audio = await voiceAPI.createSpeech(
  "Bonjour, ceci est un test de synthèse vocale.",
  {
    model: 'gpt-4o-mini-tts',
    voice: 'alloy',
    speed: 1.0
  }
);

// Jouer l'audio
await voiceAPI.speak("Votre email a été envoyé avec succès !");
```

### Streaming TTS en Temps Réel

```javascript
// Streaming avec SSE
const audioChunks = [];

await voiceAPI.streamSpeech(
  "Ceci est un long texte qui sera généré en streaming...",
  { 
    model: 'gpt-4o-mini-tts',
    voice: 'nova',
    stream_format: 'sse'
  },
  (audioBase64) => {
    // Recevoir et jouer chaque chunk
    audioChunks.push(audioBase64);
    voiceAPI.utils.playBase64Audio(audioBase64);
  }
);
```

### Instructions Vocales Personnalisées

```javascript
// Contrôler le style de la voix
await voiceAPI.createSpeech(
  "Bienvenue dans notre application !",
  {
    model: 'gpt-4o-mini-tts',
    voice: 'shimmer',
    instructions: "Parlez avec enthousiasme et énergie, comme un présentateur radio",
    speed: 1.1
  }
);
```

## Speech-to-Text (STT) Avancé

### Transcription Simple

```javascript
// Transcription avec nouveau modèle
const audioFile = document.getElementById('audio-input').files[0];

const result = await voiceAPI.transcribe(audioFile, {
  model: 'gpt-4o-transcribe',
  language: 'fr',
  response_format: 'json'
});

console.log('Transcription:', result.text);
console.log('Usage:', result.usage);
```

### Transcription avec Diarisation (Identification des Locuteurs)

```javascript
// Identifier qui parle dans une conversation
const result = await voiceAPI.transcribeWithDiarization(audioFile, {
  known_speaker_names: ['agent', 'customer'],
  response_format: 'diarized_json'
});

// Afficher les segments par locuteur
result.segments.forEach(segment => {
  console.log(`${segment.speaker}: ${segment.text}`);
  console.log(`  [${segment.start}s - ${segment.end}s]`);
});
```

### Streaming Transcription

```javascript
// Transcription en temps réel
await voiceAPI.streamTranscribe(
  audioFile,
  { 
    model: 'gpt-4o-transcribe',
    language: 'fr',
    include: ['logprobs']
  },
  {
    onDelta: ({ delta, fullText }) => {
      // Mise à jour progressive
      document.getElementById('transcript').textContent = fullText;
    },
    
    onSegment: (segment) => {
      // Nouveau segment avec locuteur
      console.log(`${segment.speaker}: ${segment.text}`);
    },
    
    onComplete: ({ text, usage }) => {
      console.log('Transcription terminée:', text);
      console.log('Tokens utilisés:', usage.total_tokens);
    }
  }
);
```

## Voix Personnalisées

### Créer un Consentement Vocal

```javascript
// 1. Enregistrer le consentement
const consentFile = await voiceAPI.utils.recordAudio(5000); // 5 secondes

const consent = await voiceAPI.voices.createConsent(
  'John Doe',
  'fr-FR',
  consentFile
);

console.log('Consent ID:', consent.id);
```

### Créer une Voix Personnalisée

```javascript
// 2. Créer la voix avec un échantillon
const voiceSample = document.getElementById('voice-sample').files[0];

const customVoice = await voiceAPI.voices.create(
  'Ma Voix Personnalisée',
  consent.id,
  voiceSample
);

// 3. Utiliser la voix personnalisée
await voiceAPI.createSpeech(
  "Ceci est ma voix personnalisée !",
  {
    model: 'gpt-4o-mini-tts',
    voice: { id: customVoice.id }
  }
);
```

## Traduction Audio

```javascript
// Traduire audio vers anglais
const germanAudio = document.getElementById('german-audio').files[0];

const translation = await voiceAPI.translate(germanAudio, {
  model: 'whisper-1',
  response_format: 'json'
});

console.log('Translation:', translation.text);
```

## Exemple Complet - Dictée Vocale pour Email

```javascript
// Composant React pour dictée vocale
import { useState } from 'react';
import { voiceAPI } from '../services/api';

function VoiceEmailComposer() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const startDictation = async () => {
    setIsRecording(true);
    
    try {
      // Enregistrer 30 secondes
      const audioBlob = await voiceAPI.utils.recordAudio(30000);
      
      setIsRecording(false);
      setIsProcessing(true);
      
      // Transcrire avec streaming
      await voiceAPI.streamTranscribe(
        audioBlob,
        { 
          model: 'gpt-4o-transcribe',
          language: 'fr',
          prompt: 'Email professionnel'
        },
        {
          onDelta: ({ fullText }) => {
            setTranscript(fullText);
          },
          onComplete: ({ text }) => {
            setTranscript(text);
            setIsProcessing(false);
            
            // Améliorer le texte avec IA
            improveText(text);
          }
        }
      );
    } catch (error) {
      console.error('Erreur de dictée:', error);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const improveText = async (text) => {
    const improved = await aiAPI.improveText(text, {
      tone: 'professional',
      context: 'email',
      language: 'fr'
    });
    
    setTranscript(improved.text);
  };

  const readAloud = async () => {
    await voiceAPI.speak(transcript, {
      voice: 'nova',
      speed: 1.0
    });
  };

  return (
    <div>
      <button 
        onClick={startDictation}
        disabled={isRecording || isProcessing}
      >
        {isRecording ? '🎤 Enregistrement...' : 
         isProcessing ? '⏳ Traitement...' : 
         '🎤 Dicter Email'}
      </button>
      
      <button onClick={readAloud} disabled={!transcript}>
        🔊 Écouter
      </button>
      
      <textarea 
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={10}
        placeholder="Votre email dicté apparaîtra ici..."
      />
    </div>
  );
}
```

## Formats Audio Supportés

### Entrée (Transcription)
- `flac`, `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `ogg`, `wav`, `webm`

### Sortie (TTS)
- `mp3` (défaut), `opus`, `aac`, `flac`, `wav`, `pcm`

## Modèles Disponibles

### TTS
- `tts-1` - Rapide, qualité standard
- `tts-1-hd` - Haute qualité
- `gpt-4o-mini-tts` - Nouveau, avec instructions
- `gpt-4o-mini-tts-2025-12-15` - Dernière version

### STT
- `whisper-1` - Modèle Whisper V2
- `gpt-4o-transcribe` - Nouveau, plus précis
- `gpt-4o-mini-transcribe` - Rapide et économique
- `gpt-4o-transcribe-diarize` - Avec identification des locuteurs

## Optimisations

```javascript
// Cache des audios générés
const audioCache = new Map();

const getCachedSpeech = async (text, options) => {
  const cacheKey = `${text}_${JSON.stringify(options)}`;
  
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }
  
  const audio = await voiceAPI.createSpeech(text, options);
  audioCache.set(cacheKey, audio);
  
  return audio;
};
```

## Événements Personnalisés

```javascript
// Écouter les événements audio
window.addEventListener('audio-transcription-complete', (event) => {
  const { text, duration } = event.detail;
  console.log(`Transcription terminée: ${text} (${duration}s)`);
});

window.addEventListener('audio-speech-generated', (event) => {
  const { audioUrl, text } = event.detail;
  console.log('Audio généré:', audioUrl);
});
```

## Accessibilité

```javascript
// Support pour utilisateurs malentendants
const transcribeAndDisplay = async (audioFile) => {
  const result = await voiceAPI.transcribe(audioFile, {
    model: 'gpt-4o-transcribe',
    include: ['logprobs'],
    response_format: 'verbose_json'
  });
  
  // Afficher avec timestamps
  result.segments.forEach(segment => {
    displaySubtitle(segment.text, segment.start, segment.end);
  });
};

// Support pour utilisateurs aveugles
const readEmailAloud = async (emailText) => {
  await voiceAPI.speak(emailText, {
    voice: 'nova',
    speed: 1.2, // Vitesse augmentée pour lecture rapide
    instructions: "Lire de manière claire et articulée"
  });
};
```

---

**Version** : 2.2  
**Statut** : ✅ Production Ready
