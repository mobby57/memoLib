// 🎵 OpenAI Audio API Service - IAPosteManager
// Comprehensive audio capabilities: TTS, transcription, streaming, custom voices

const OPENAI_API_BASE = 'https://api.openai.com/v1';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Audio-specific request handler
const audioRequest = async (endpoint, options = {}) => {
  if (!OPENAI_API_KEY) {
    throw new Error('Clé API OpenAI manquante');
  }
  
  const url = `${OPENAI_API_BASE}${endpoint}`;
  const requestId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const fetchOptions = {
    ...options,
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'X-Client-Request-Id': requestId,
      ...options.headers
    }
  };
  
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Audio API Error: ${errorData.error?.message || response.statusText}`);
  }
  
  return response;
};

// Service Audio OpenAI complet
export const openaiAudioService = {
  // Text-to-Speech avec nouvelles voix
  speech: {
    create: async (text, options = {}) => {
      const {
        model = 'gpt-4o-mini-tts',
        voice = 'alloy',
        response_format = 'mp3',
        speed = 1.0,
        instructions = null
      } = options;
      
      const response = await audioRequest('/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          response_format,
          speed,
          instructions
        })
      });
      
      return response.arrayBuffer();
    },
    
    // Streaming TTS avec SSE
    createStream: async (text, options = {}, callbacks = {}) => {
      const {
        onStart = () => {},
        onAudioChunk = () => {},
        onComplete = () => {},
        onError = () => {}
      } = callbacks;
      
      try {
        const response = await audioRequest('/audio/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini-tts',
            input: text,
            voice: options.voice || 'alloy',
            stream_format: 'sse',
            ...options
          })
        });
        
        if (!response.body) {
          throw new Error('Streaming not supported');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        onStart();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }
            
            try {
              const event = JSON.parse(data);
              
              switch (event.type) {
                case 'speech.audio.delta':
                  onAudioChunk(event.audio);
                  break;
                case 'speech.audio.done':
                  onComplete(event.usage);
                  break;
              }
            } catch (parseError) {
              console.warn('Failed to parse audio SSE event:', data);
            }
          }
        }
      } catch (error) {
        onError(error);
        throw error;
      }
    }
  },
  
  // Transcription avancée
  transcriptions: {
    create: async (audioFile, options = {}) => {
      const {
        model = 'gpt-4o-transcribe',
        language = 'fr',
        response_format = 'json',
        temperature = 0,
        prompt = null,
        include = [],
        stream = false
      } = options;
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', model);
      formData.append('language', language);
      formData.append('response_format', response_format);
      formData.append('temperature', temperature.toString());
      
      if (prompt) formData.append('prompt', prompt);
      if (include.length) {
        include.forEach(inc => formData.append('include', inc));
      }
      formData.append('stream', stream.toString());
      
      const response = await audioRequest('/audio/transcriptions', {
        method: 'POST',
        body: formData
      });
      
      return response.json();
    },
    
    // Transcription avec diarisation (identification des locuteurs)
    createWithDiarization: async (audioFile, options = {}) => {
      const {
        known_speaker_names = [],
        known_speaker_references = [],
        chunking_strategy = 'auto'
      } = options;
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'gpt-4o-transcribe-diarize');
      formData.append('response_format', 'diarized_json');
      formData.append('language', 'fr');
      
      if (chunking_strategy !== 'auto') {
        formData.append('chunking_strategy', JSON.stringify(chunking_strategy));
      }
      
      known_speaker_names.forEach(name => {
        formData.append('known_speaker_names', name);
      });
      
      known_speaker_references.forEach(ref => {
        formData.append('known_speaker_references', ref);
      });
      
      const response = await audioRequest('/audio/transcriptions', {
        method: 'POST',
        body: formData
      });
      
      return response.json();
    },
    
    // Streaming transcription
    createStream: async (audioFile, options = {}, callbacks = {}) => {
      const {
        onStart = () => {},
        onTextDelta = () => {},
        onSegment = () => {},
        onComplete = () => {},
        onError = () => {}
      } = callbacks;
      
      try {
        const transcribeOptions = {
          ...options,
          stream: true
        };
        
        const response = await openaiAudioService.transcriptions.create(audioFile, transcribeOptions);
        
        if (!response.body) {
          throw new Error('Streaming not supported');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        
        onStart();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete({ text: fullText });
              return fullText;
            }
            
            try {
              const event = JSON.parse(data);
              
              switch (event.type) {
                case 'transcript.text.delta':
                  fullText += event.delta;
                  onTextDelta({ delta: event.delta, fullText, event });
                  break;
                case 'transcript.text.segment':
                  onSegment(event);
                  break;
                case 'transcript.text.done':
                  fullText = event.text;
                  onComplete({ text: fullText, usage: event.usage });
                  break;
              }
            } catch (parseError) {
              console.warn('Failed to parse transcription SSE event:', data);
            }
          }
        }
        
        return fullText;
      } catch (error) {
        onError(error);
        throw error;
      }
    }
  },
  
  // Translation (audio vers anglais)
  translations: {
    create: async (audioFile, options = {}) => {
      const {
        model = 'whisper-1',
        prompt = null,
        response_format = 'json',
        temperature = 0
      } = options;
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', model);
      if (prompt) formData.append('prompt', prompt);
      formData.append('response_format', response_format);
      formData.append('temperature', temperature.toString());
      
      const response = await audioRequest('/audio/translations', {
        method: 'POST',
        body: formData
      });
      
      return response.json();
    }
  },
  
  // Custom voices (fonctionnalité avancée)
  voices: {
    create: async (audioSample, consentId, name) => {
      const formData = new FormData();
      formData.append('audio_sample', audioSample);
      formData.append('consent', consentId);
      formData.append('name', name);
      
      const response = await audioRequest('/audio/voices', {
        method: 'POST',
        body: formData
      });
      
      return response.json();
    }
  },
  
  // Voice consent management
  voiceConsents: {
    create: async (recording, name, language = 'fr-FR') => {
      const formData = new FormData();
      formData.append('recording', recording);
      formData.append('name', name);
      formData.append('language', language);
      
      const response = await audioRequest('/audio/voice_consents', {
        method: 'POST',
        body: formData
      });
      
      return response.json();
    },
    
    list: async (options = {}) => {
      const { after, limit = 20 } = options;
      const params = new URLSearchParams();
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      
      const response = await audioRequest(`/audio/voice_consents?${params}`, {
        method: 'GET'
      });
      
      return response.json();
    },
    
    get: async (consentId) => {
      const response = await audioRequest(`/audio/voice_consents/${consentId}`, {
        method: 'GET'
      });
      
      return response.json();
    },
    
    update: async (consentId, name) => {
      const response = await audioRequest(`/audio/voice_consents/${consentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      return response.json();
    },
    
    delete: async (consentId) => {
      const response = await audioRequest(`/audio/voice_consents/${consentId}`, {
        method: 'DELETE'
      });
      
      return response.json();
    }
  }
};

// Helpers pour IAPosteManager
export const audioHelpers = {
  // Convertir texte en audio jouable
  textToSpeech: async (text, voice = 'alloy', options = {}) => {
    try {
      const audioBuffer = await openaiAudioService.speech.create(text, {
        voice,
        model: 'gpt-4o-mini-tts',
        response_format: 'mp3',
        speed: 1.0,
        ...options
      });
      
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return { audioBlob, audioUrl };
    } catch (error) {
      console.error('TTS Error:', error);
      throw error;
    }
  },
  
  // Transcrire et améliorer le texte pour emails
  transcribeForEmail: async (audioFile, context = 'email') => {
    try {
      const transcription = await openaiAudioService.transcriptions.create(audioFile, {
        model: 'gpt-4o-transcribe',
        language: 'fr',
        response_format: 'json',
        include: ['logprobs']
      });
      
      // Améliorer le texte transcrit
      const improvedText = await improveTranscribedText(transcription.text, context);
      
      return {
        original: transcription.text,
        improved: improvedText,
        confidence: calculateConfidence(transcription.logprobs),
        usage: transcription.usage
      };
    } catch (error) {
      console.error('Transcription Error:', error);
      throw error;
    }
  },
  
  // Transcrire avec identification des locuteurs
  transcribeWithSpeakers: async (audioFile, speakerNames = []) => {
    try {
      return await openaiAudioService.transcriptions.createWithDiarization(audioFile, {
        known_speaker_names: speakerNames,
        language: 'fr'
      });
    } catch (error) {
      console.error('Diarization Error:', error);
      throw error;
    }
  },
  
  // Jouer audio avec contrôles
  playAudio: async (audioUrl, options = {}) => {
    const {
      volume = 1.0,
      playbackRate = 1.0,
      onPlay = () => {},
      onPause = () => {},
      onEnd = () => {},
      onError = () => {}
    } = options;
    
    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    
    try {
      await audio.play();
      return audio;
    } catch (error) {
      onError(error);
      throw error;
    }
  },
  
  // Enregistrer audio depuis le microphone
  recordAudio: async (duration = 30000) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      
      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          stream.getTracks().forEach(track => track.stop());
          resolve(audioBlob);
        };
        
        mediaRecorder.onerror = reject;
        
        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), duration);
      });
    } catch (error) {
      console.error('Recording Error:', error);
      throw error;
    }
  }
};

// Utilitaires internes
function improveTranscribedText(text, context) {
  // Corrections basiques pour le texte transcrit
  let improved = text.trim();
  
  // Capitaliser la première lettre
  if (improved) {
    improved = improved[0].toUpperCase() + improved.slice(1);
  }
  
  // Ajouter ponctuation finale si manquante
  if (improved && !improved.match(/[.!?]$/)) {
    improved += '.';
  }
  
  // Corrections spécifiques au contexte email
  if (context === 'email') {
    improved = improved.replace(/\bbonjour\b/gi, 'Bonjour');
    improved = improved.replace(/\bcordialement\b/gi, 'Cordialement');
  }
  
  return improved;
}

function calculateConfidence(logprobs) {
  if (!logprobs || !logprobs.length) return 1.0;
  
  const avgLogprob = logprobs.reduce((sum, token) => sum + token.logprob, 0) / logprobs.length;
  return Math.exp(avgLogprob);
}

export default openaiAudioService;