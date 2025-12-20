# 🎵 OpenAI Audio API Integration - IAPosteManager

## 📋 Overview

IAPosteManager now includes comprehensive OpenAI Audio API integration with advanced TTS, transcription, streaming, diarization, and custom voice capabilities.

## 🔧 Features

### 1. Text-to-Speech (TTS)
- **Models**: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`
- **Voices**: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse, marin, cedar
- **Formats**: mp3, opus, aac, flac, wav, pcm
- **Streaming**: SSE support for real-time audio

### 2. Speech-to-Text (Transcription)
- **Models**: `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `whisper-1`
- **Diarization**: Speaker identification with `gpt-4o-transcribe-diarize`
- **Languages**: Auto-detection or specify (fr, en, etc.)
- **Streaming**: Real-time transcription with SSE

### 3. Audio Translation
- **Model**: `whisper-1`
- **Function**: Translate any language audio to English text

### 4. Custom Voices (Advanced)
- **Voice Creation**: Upload audio samples with consent
- **Voice Consent**: Manage consent recordings
- **Voice Management**: CRUD operations for custom voices

## 🚀 Usage Examples

### Basic Text-to-Speech

```javascript
import { audioHelpers } from './services/audio.js';

// Simple TTS
const { audioBlob, audioUrl } = await audioHelpers.textToSpeech(
  'Bonjour, ceci est un test de synthèse vocale.',
  'alloy'
);

// Play audio
const audio = new Audio(audioUrl);
await audio.play();
```

### Advanced TTS with Options

```javascript
import { openaiAudioService } from './services/audio.js';

// TTS with custom options
const audioBuffer = await openaiAudioService.speech.create(
  'Votre email a été envoyé avec succès.',
  {
    model: 'gpt-4o-mini-tts',
    voice: 'nova',
    response_format: 'mp3',
    speed: 1.2,
    instructions: 'Parlez avec un ton professionnel et confiant.'
  }
);
```

### Streaming TTS

```javascript
// Streaming TTS with real-time playback
await openaiAudioService.speech.createStream(
  'Ceci est un long texte qui sera lu en streaming...',
  { voice: 'alloy' },
  {
    onStart: () => console.log('🎵 TTS started'),
    onAudioChunk: (audioBase64) => {
      // Play audio chunk immediately
      const audioData = atob(audioBase64);
      // Process audio chunk...
    },
    onComplete: (usage) => console.log('✅ TTS completed:', usage),
    onError: (error) => console.error('❌ TTS error:', error)
  }
);
```

### Audio Transcription

```javascript
// Basic transcription
const transcription = await openaiAudioService.transcriptions.create(
  audioFile,
  {
    model: 'gpt-4o-transcribe',
    language: 'fr',
    response_format: 'json',
    include: ['logprobs']
  }
);

console.log('Transcribed text:', transcription.text);
console.log('Confidence:', transcription.logprobs);
```

### Transcription with Speaker Diarization

```javascript
// Identify different speakers
const diarizedTranscription = await openaiAudioService.transcriptions.createWithDiarization(
  audioFile,
  {
    known_speaker_names: ['client', 'agent'],
    language: 'fr'
  }
);

// Process segments with speaker info
diarizedTranscription.segments.forEach(segment => {
  console.log(`${segment.speaker}: ${segment.text}`);
  console.log(`Time: ${segment.start}s - ${segment.end}s`);
});
```

### Streaming Transcription

```javascript
// Real-time transcription
await openaiAudioService.transcriptions.createStream(
  audioFile,
  { model: 'gpt-4o-transcribe', language: 'fr' },
  {
    onStart: () => console.log('🎤 Transcription started'),
    onTextDelta: ({ delta, fullText }) => {
      // Update UI with new text
      document.getElementById('transcript').textContent = fullText;
    },
    onSegment: (segment) => {
      console.log('New segment:', segment);
    },
    onComplete: ({ text, usage }) => {
      console.log('✅ Final transcript:', text);
      console.log('Usage:', usage);
    }
  }
);
```

### Email-Optimized Transcription

```javascript
// Transcribe and improve for email context
const result = await audioHelpers.transcribeForEmail(audioFile, 'email');

console.log('Original:', result.original);
console.log('Improved:', result.improved);
console.log('Confidence:', result.confidence);
console.log('Usage:', result.usage);
```

### Audio Recording

```javascript
// Record audio from microphone
const audioBlob = await audioHelpers.recordAudio(10000); // 10 seconds

// Transcribe recorded audio
const transcription = await audioHelpers.transcribeForEmail(audioBlob);
```

### Audio Translation

```javascript
// Translate foreign language audio to English
const translation = await openaiAudioService.translations.create(
  germanAudioFile,
  {
    model: 'whisper-1',
    response_format: 'json'
  }
);

console.log('English translation:', translation.text);
```

## 🎯 Integration with IAPosteManager

### Voice-Enabled Email Composition

```javascript
// Complete voice-to-email workflow
async function voiceToEmail() {
  try {
    // 1. Record audio
    console.log('🎤 Recording...');
    const audioBlob = await audioHelpers.recordAudio(30000);
    
    // 2. Transcribe and improve
    console.log('📝 Transcribing...');
    const result = await audioHelpers.transcribeForEmail(audioBlob, 'email');
    
    // 3. Generate email from improved text
    console.log('✨ Generating email...');
    const email = await apiService.ai.generateContent(result.improved, {
      tone: 'professional',
      type: 'email'
    });
    
    // 4. Read email back to user
    console.log('🔊 Reading email...');
    const { audioUrl } = await audioHelpers.textToSpeech(
      `Voici votre email: ${email.subject}. ${email.body}`,
      'nova'
    );
    
    await audioHelpers.playAudio(audioUrl);
    
    return { original: result.original, improved: result.improved, email };
    
  } catch (error) {
    console.error('Voice-to-email workflow failed:', error);
    throw error;
  }
}
```

### Accessibility Features

```javascript
// TTS for accessibility
async function speakEmailContent(emailText) {
  const { audioUrl } = await audioHelpers.textToSpeech(
    emailText,
    'alloy',
    {
      speed: 0.9, // Slower for better comprehension
      instructions: 'Parlez clairement et distinctement pour l\'accessibilité.'
    }
  );
  
  return audioHelpers.playAudio(audioUrl, {
    volume: 1.0,
    onPlay: () => console.log('🔊 Reading email aloud'),
    onEnd: () => console.log('✅ Finished reading')
  });
}

// Voice commands for navigation
async function processVoiceCommand(audioBlob) {
  const transcription = await openaiAudioService.transcriptions.create(
    audioBlob,
    {
      model: 'gpt-4o-transcribe',
      language: 'fr',
      prompt: 'Commandes vocales: ouvrir, fermer, envoyer, composer, lire'
    }
  );
  
  const command = transcription.text.toLowerCase();
  
  if (command.includes('composer')) {
    // Navigate to compose page
    window.location.href = '/compose.html';
  } else if (command.includes('lire')) {
    // Read current email
    const emailText = document.querySelector('.email-content')?.textContent;
    if (emailText) {
      await speakEmailContent(emailText);
    }
  }
  
  return command;
}
```

### Custom Voice Setup (Advanced)

```javascript
// Create custom voice for organization
async function setupCustomVoice() {
  try {
    // 1. Upload consent recording
    const consentBlob = await audioHelpers.recordAudio(15000); // 15s consent
    const consent = await openaiAudioService.voiceConsents.create(
      consentBlob,
      'CEO Voice',
      'fr-FR'
    );
    
    // 2. Upload voice sample
    const voiceSample = await audioHelpers.recordAudio(30000); // 30s sample
    const customVoice = await openaiAudioService.voices.create(
      voiceSample,
      consent.id,
      'Company CEO Voice'
    );
    
    // 3. Use custom voice
    const { audioUrl } = await audioHelpers.textToSpeech(
      'Bienvenue dans notre entreprise.',
      { id: customVoice.id } // Custom voice object
    );
    
    return { consent, customVoice, audioUrl };
    
  } catch (error) {
    console.error('Custom voice setup failed:', error);
    throw error;
  }
}
```

## 🔧 Backend Integration

Add these endpoints to your Flask backend:

```python
@app.route('/api/voice/transcribe-openai', methods=['POST'])
def transcribe_with_openai():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400
    
    audio_file = request.files['audio']
    
    # Use OpenAI transcription
    response = openai.audio.transcriptions.create(
        file=audio_file,
        model="gpt-4o-transcribe",
        language="fr",
        response_format="json"
    )
    
    return jsonify({
        'success': True,
        'text': response.text,
        'usage': response.usage
    })

@app.route('/api/voice/speak-openai', methods=['POST'])
def speak_with_openai():
    data = request.get_json()
    text = data.get('text', '')
    voice = data.get('voice', 'alloy')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    # Use OpenAI TTS
    response = openai.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice=voice,
        input=text,
        response_format="mp3"
    )
    
    # Return audio as base64
    audio_base64 = base64.b64encode(response.content).decode()
    
    return jsonify({
        'success': True,
        'audio': audio_base64,
        'format': 'mp3'
    })
```

## 📊 Performance & Cost Optimization

### Token Usage Tracking

```javascript
// Track audio API usage
const audioUsageTracker = {
  tts: { requests: 0, characters: 0, cost: 0 },
  transcription: { requests: 0, minutes: 0, cost: 0 },
  
  trackTTS: (text) => {
    audioUsageTracker.tts.requests++;
    audioUsageTracker.tts.characters += text.length;
    audioUsageTracker.tts.cost += text.length * 0.000015; // $15/1M chars
  },
  
  trackTranscription: (durationMinutes) => {
    audioUsageTracker.transcription.requests++;
    audioUsageTracker.transcription.minutes += durationMinutes;
    audioUsageTracker.transcription.cost += durationMinutes * 0.006; // $0.006/minute
  },
  
  getStats: () => audioUsageTracker
};
```

### Caching Strategy

```javascript
// Cache audio files to reduce API calls
const audioCache = new Map();

async function cachedTTS(text, voice = 'alloy') {
  const cacheKey = `tts_${text}_${voice}`;
  
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }
  
  const result = await audioHelpers.textToSpeech(text, voice);
  audioCache.set(cacheKey, result);
  
  return result;
}
```

## 🛡️ Security & Best Practices

1. **API Key Security**: Never expose OpenAI API key in frontend
2. **File Size Limits**: Max 25MB for audio files
3. **Rate Limiting**: Implement proper rate limiting
4. **Content Moderation**: Use moderation API for user-generated content
5. **Error Handling**: Graceful fallbacks for API failures

## 🎉 Ready for Production!

Your IAPosteManager now has enterprise-grade audio capabilities with OpenAI's latest models and features!