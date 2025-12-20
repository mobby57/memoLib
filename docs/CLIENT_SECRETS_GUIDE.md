# 🔐 Client Secrets API - Guide Sécurisé Realtime

## Vue d'ensemble

L'API Client Secrets génère des tokens éphémères sécurisés pour l'accès client-side à l'API Realtime sans exposer votre clé API principale.

## Caractéristiques

- **Tokens éphémères**: Durée de vie configurable (TTL)
- **Sécurité renforcée**: Pas d'exposition de la clé API principale
- **Configuration session**: Paramètres prédéfinis pour les sessions
- **Multi-sessions**: Un secret peut créer plusieurs sessions
- **WebRTC compatible**: Optimisé pour les connexions temps réel

## API Service

### 1. Créer un Client Secret

```javascript
import { clientSecretsAPI } from '@/services/api';

const secret = await clientSecretsAPI.create({
  expires_after: {
    anchor: 'created_at',
    seconds: 600  // 10 minutes
  },
  session: {
    type: 'realtime',
    model: 'gpt-realtime',
    instructions: 'Vous êtes un assistant vocal professionnel.'
  }
});

console.log(secret.value); // ek_68af296e8e408191a1120ab6383263c2
console.log(secret.expires_at); // 1756310470
```

### 2. Secret pour Assistant Email Vocal

```javascript
// Créer un secret spécialisé pour les emails
const emailSecret = await clientSecretsAPI.createEmailAssistantSecret(1800); // 30 min

console.log('Secret pour assistant email:', emailSecret.value);
console.log('Session ID:', emailSecret.session.id);
```

### 3. Secret pour Transcription

```javascript
// Créer un secret pour la transcription uniquement
const transcriptionSecret = await clientSecretsAPI.createTranscriptionSecret(900); // 15 min

console.log('Secret transcription:', transcriptionSecret.value);
```

## Exemples d'Utilisation

### 1. Assistant Vocal Email Sécurisé

```javascript
class SecureVoiceEmailAssistant {
  constructor() {
    this.clientSecret = null;
    this.websocket = null;
    this.sessionId = null;
  }

  async initialize() {
    // Créer un client secret sécurisé
    const secretResponse = await clientSecretsAPI.createEmailAssistantSecret(3600); // 1h
    
    this.clientSecret = secretResponse.value;
    this.sessionId = secretResponse.session.id;
    
    console.log('Assistant vocal initialisé avec secret sécurisé');
    return secretResponse;
  }

  async connectToRealtime() {
    if (!this.clientSecret) {
      throw new Error('Client secret not initialized');
    }

    // Connexion WebSocket sécurisée avec le client secret
    const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-realtime`;
    
    this.websocket = new WebSocket(wsUrl, [], {
      headers: {
        'Authorization': `Bearer ${this.clientSecret}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    return new Promise((resolve, reject) => {
      this.websocket.onopen = () => {
        console.log('Connexion Realtime établie avec client secret');
        this.setupEventHandlers();
        resolve(this.websocket);
      };

      this.websocket.onerror = (error) => {
        console.error('Erreur connexion Realtime:', error);
        reject(error);
      };
    });
  }

  setupEventHandlers() {
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'session.created':
          console.log('Session Realtime créée:', data.session.id);
          break;
          
        case 'response.audio.delta':
          this.handleAudioDelta(data.delta);
          break;
          
        case 'response.text.delta':
          this.handleTextDelta(data.delta);
          break;
          
        case 'conversation.item.created':
          this.handleConversationItem(data.item);
          break;
      }
    };
  }

  async generateEmailVoice(prompt) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      await this.connectToRealtime();
    }

    // Envoyer la demande de génération d'email
    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: `Générez un email professionnel pour: ${prompt}`
        }]
      }
    };

    this.websocket.send(JSON.stringify(message));

    // Déclencher la réponse
    this.websocket.send(JSON.stringify({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: 'Répondez avec un email professionnel et lisez-le à voix haute.'
      }
    }));
  }

  handleAudioDelta(delta) {
    // Traiter l'audio en streaming
    const audioData = atob(delta);
    const audioArray = new Uint8Array(audioData.length);
    
    for (let i = 0; i < audioData.length; i++) {
      audioArray[i] = audioData.charCodeAt(i);
    }
    
    // Jouer l'audio (implémentation dépendante du navigateur)
    this.playAudioChunk(audioArray);
  }

  handleTextDelta(delta) {
    // Afficher le texte en streaming
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('email-text-delta', {
        detail: { delta, timestamp: Date.now() }
      }));
    }
  }

  async renewSecret() {
    // Renouveler le secret avant expiration
    const newSecret = await clientSecretsAPI.createEmailAssistantSecret(3600);
    this.clientSecret = newSecret.value;
    
    // Reconnecter avec le nouveau secret
    if (this.websocket) {
      this.websocket.close();
      await this.connectToRealtime();
    }
    
    return newSecret;
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.clientSecret = null;
  }
}

// Utilisation
const voiceAssistant = new SecureVoiceEmailAssistant();
await voiceAssistant.initialize();
await voiceAssistant.connectToRealtime();
await voiceAssistant.generateEmailVoice('Demande de rendez-vous client');
```

### 2. Gestionnaire de Secrets Multi-Utilisateurs

```javascript
class ClientSecretManager {
  constructor() {
    this.userSecrets = new Map();
    this.secretTimers = new Map();
  }

  async getSecretForUser(userId, purpose = 'email_assistant') {
    const existingSecret = this.userSecrets.get(userId);
    
    // Vérifier si le secret existe et n'est pas expiré
    if (existingSecret && existingSecret.expires_at > Date.now() / 1000) {
      return existingSecret;
    }

    // Créer un nouveau secret
    let newSecret;
    switch (purpose) {
      case 'email_assistant':
        newSecret = await clientSecretsAPI.createEmailAssistantSecret(3600);
        break;
      case 'transcription':
        newSecret = await clientSecretsAPI.createTranscriptionSecret(1800);
        break;
      default:
        newSecret = await clientSecretsAPI.create();
    }

    // Stocker le secret
    this.userSecrets.set(userId, newSecret);
    
    // Programmer le renouvellement automatique
    this.scheduleRenewal(userId, newSecret.expires_at, purpose);
    
    return newSecret;
  }

  scheduleRenewal(userId, expiresAt, purpose) {
    // Nettoyer l'ancien timer
    const existingTimer = this.secretTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Programmer le renouvellement 5 minutes avant expiration
    const renewTime = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000);
    
    if (renewTime > 0) {
      const timer = setTimeout(async () => {
        try {
          console.log(`Renouvellement automatique du secret pour ${userId}`);
          await this.getSecretForUser(userId, purpose);
        } catch (error) {
          console.error(`Échec renouvellement secret ${userId}:`, error);
        }
      }, renewTime);
      
      this.secretTimers.set(userId, timer);
    }
  }

  async revokeUserSecret(userId) {
    // Supprimer le secret et annuler le timer
    this.userSecrets.delete(userId);
    
    const timer = this.secretTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.secretTimers.delete(userId);
    }
  }

  async cleanupExpiredSecrets() {
    const now = Date.now() / 1000;
    
    for (const [userId, secret] of this.userSecrets.entries()) {
      if (secret.expires_at <= now) {
        await this.revokeUserSecret(userId);
        console.log(`Secret expiré nettoyé pour ${userId}`);
      }
    }
  }

  getActiveSecretsCount() {
    return this.userSecrets.size;
  }

  getUserSecretInfo(userId) {
    const secret = this.userSecrets.get(userId);
    if (!secret) return null;
    
    return {
      hasSecret: true,
      expiresAt: new Date(secret.expires_at * 1000),
      timeRemaining: Math.max(0, secret.expires_at - Date.now() / 1000),
      sessionId: secret.session.id
    };
  }
}

// Utilisation globale
const secretManager = new ClientSecretManager();

// Nettoyer les secrets expirés toutes les 10 minutes
setInterval(() => {
  secretManager.cleanupExpiredSecrets();
}, 600000);

// Obtenir un secret pour un utilisateur
const userSecret = await secretManager.getSecretForUser('user123', 'email_assistant');
console.log('Secret utilisateur:', userSecret.value);
```

### 3. Interface de Transcription Sécurisée

```javascript
class SecureTranscriptionInterface {
  constructor() {
    this.clientSecret = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  async initialize() {
    // Créer un secret pour la transcription
    const secretResponse = await clientSecretsAPI.createTranscriptionSecret(1800);
    this.clientSecret = secretResponse.value;
    
    console.log('Interface transcription initialisée');
    return secretResponse;
  }

  async startRecording() {
    if (!this.clientSecret) {
      await this.initialize();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.transcribeAudio(audioBlob);
      };

      this.mediaRecorder.start(1000); // Chunk toutes les secondes
      console.log('Enregistrement démarré');
      
    } catch (error) {
      console.error('Erreur démarrage enregistrement:', error);
      throw error;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      
      // Arrêter tous les tracks audio
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      console.log('Enregistrement arrêté');
    }
  }

  async transcribeAudio(audioBlob) {
    if (!this.clientSecret) {
      throw new Error('Client secret not available');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'gpt-4o-transcribe');
    formData.append('language', 'fr');
    formData.append('response_format', 'json');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.clientSecret}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Émettre l'événement de transcription
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('transcription-completed', {
          detail: {
            text: result.text,
            language: result.language,
            duration: result.duration
          }
        }));
      }

      return result;
      
    } catch (error) {
      console.error('Erreur transcription:', error);
      throw error;
    }
  }

  async renewSecret() {
    const newSecret = await clientSecretsAPI.createTranscriptionSecret(1800);
    this.clientSecret = newSecret.value;
    return newSecret;
  }
}

// Utilisation
const transcription = new SecureTranscriptionInterface();
await transcription.initialize();

// Démarrer l'enregistrement
await transcription.startRecording();

// Arrêter après 10 secondes
setTimeout(() => {
  transcription.stopRecording();
}, 10000);
```

## Composant React Sécurisé

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { clientSecretsAPI } from '@/services/api';

function SecureVoiceEmailGenerator() {
  const [clientSecret, setClientSecret] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [secretExpiry, setSecretExpiry] = useState(null);
  
  const websocketRef = useRef(null);
  const renewalTimerRef = useRef(null);

  useEffect(() => {
    initializeSecureConnection();
    return () => cleanup();
  }, []);

  const initializeSecureConnection = async () => {
    try {
      // Créer un client secret sécurisé
      const secretResponse = await clientSecretsAPI.createEmailAssistantSecret(3600);
      
      setClientSecret(secretResponse.value);
      setSecretExpiry(new Date(secretResponse.expires_at * 1000));
      
      // Programmer le renouvellement automatique
      scheduleSecretRenewal(secretResponse.expires_at);
      
      // Établir la connexion WebSocket
      await connectToRealtime(secretResponse.value);
      
    } catch (error) {
      console.error('Erreur initialisation connexion sécurisée:', error);
    }
  };

  const connectToRealtime = async (secret) => {
    const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-realtime`;
    
    websocketRef.current = new WebSocket(wsUrl);
    
    websocketRef.current.onopen = () => {
      // Authentification avec le client secret
      websocketRef.current.send(JSON.stringify({
        type: 'session.update',
        session: {
          authorization: `Bearer ${secret}`,
          instructions: 'Vous êtes un assistant spécialisé dans la génération d\\'emails professionnels.'
        }
      }));
      
      setIsConnected(true);
    };

    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeMessage(data);
    };

    websocketRef.current.onclose = () => {
      setIsConnected(false);
    };

    websocketRef.current.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      setIsConnected(false);
    };
  };

  const handleRealtimeMessage = (data) => {
    switch (data.type) {
      case 'response.text.delta':
        setGeneratedEmail(prev => prev + data.delta);
        break;
        
      case 'response.audio.delta':
        // Traiter l'audio en streaming
        playAudioDelta(data.delta);
        break;
        
      case 'response.done':
        console.log('Génération email terminée');
        break;
    }
  };

  const scheduleSecretRenewal = (expiresAt) => {
    // Renouveler 5 minutes avant expiration
    const renewTime = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000);
    
    if (renewTime > 0) {
      renewalTimerRef.current = setTimeout(async () => {
        await renewClientSecret();
      }, renewTime);
    }
  };

  const renewClientSecret = async () => {
    try {
      const newSecret = await clientSecretsAPI.createEmailAssistantSecret(3600);
      
      setClientSecret(newSecret.value);
      setSecretExpiry(new Date(newSecret.expires_at * 1000));
      
      // Reconnecter avec le nouveau secret
      if (websocketRef.current) {
        websocketRef.current.close();
        await connectToRealtime(newSecret.value);
      }
      
      // Programmer le prochain renouvellement
      scheduleSecretRenewal(newSecret.expires_at);
      
      console.log('Client secret renouvelé avec succès');
      
    } catch (error) {
      console.error('Erreur renouvellement secret:', error);
    }
  };

  const startVoiceGeneration = async () => {
    if (!isConnected) return;

    setIsRecording(true);
    setGeneratedEmail('');

    // Démarrer l'enregistrement audio
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Envoyer l'audio au WebSocket (implémentation simplifiée)
      websocketRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: 'base64_audio_data' // À remplacer par les vraies données audio
      }));
      
    } catch (error) {
      console.error('Erreur accès microphone:', error);
      setIsRecording(false);
    }
  };

  const stopVoiceGeneration = () => {
    setIsRecording(false);
    
    if (websocketRef.current) {
      websocketRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
      
      websocketRef.current.send(JSON.stringify({
        type: 'response.create'
      }));
    }
  };

  const cleanup = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    
    if (renewalTimerRef.current) {
      clearTimeout(renewalTimerRef.current);
    }
  };

  const playAudioDelta = (delta) => {
    // Implémentation de lecture audio en streaming
    // (dépend de l'implémentation audio du navigateur)
  };

  const getTimeRemaining = () => {
    if (!secretExpiry) return 'N/A';
    
    const remaining = Math.max(0, secretExpiry.getTime() - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="secure-voice-email-generator">
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
        </div>
        
        {clientSecret && (
          <div className="secret-info">
            <span>🔐 Secret actif</span>
            <span>⏱️ Expire dans: {getTimeRemaining()}</span>
          </div>
        )}
      </div>

      <div className="voice-controls">
        <button
          onClick={isRecording ? stopVoiceGeneration : startVoiceGeneration}
          disabled={!isConnected}
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
        >
          {isRecording ? '🛑 Arrêter' : '🎤 Générer Email Vocal'}
        </button>
      </div>

      {generatedEmail && (
        <div className="generated-email">
          <h3>📧 Email Généré</h3>
          <div className="email-content">
            {generatedEmail}
          </div>
        </div>
      )}

      <div className="security-info">
        <h4>🔒 Sécurité</h4>
        <ul>
          <li>✅ Connexion sécurisée avec client secret</li>
          <li>✅ Renouvellement automatique des tokens</li>
          <li>✅ Pas d'exposition de la clé API principale</li>
          <li>✅ Expiration automatique des secrets</li>
        </ul>
      </div>
    </div>
  );
}

export default SecureVoiceEmailGenerator;
```

## Bonnes Pratiques de Sécurité

### 1. Gestion des TTL
```javascript
// TTL courts pour les environnements sensibles
const shortTTL = await clientSecretsAPI.create({
  expires_after: { anchor: 'created_at', seconds: 300 } // 5 min
});

// TTL plus longs pour les sessions utilisateur
const longTTL = await clientSecretsAPI.createEmailAssistantSecret(7200); // 2h
```

### 2. Renouvellement Proactif
```javascript
class SecretRenewalManager {
  constructor(renewalThreshold = 300) { // 5 min avant expiration
    this.renewalThreshold = renewalThreshold;
    this.secrets = new Map();
  }

  async manageSecret(userId, purpose) {
    const existing = this.secrets.get(userId);
    const now = Date.now() / 1000;
    
    if (!existing || (existing.expires_at - now) < this.renewalThreshold) {
      const newSecret = await clientSecretsAPI.createEmailAssistantSecret(3600);
      this.secrets.set(userId, newSecret);
      return newSecret;
    }
    
    return existing;
  }
}
```

### 3. Validation et Monitoring
```javascript
const validateSecret = (secret) => {
  if (!secret.value.startsWith('ek_')) {
    throw new Error('Invalid client secret format');
  }
  
  if (secret.expires_at <= Date.now() / 1000) {
    throw new Error('Client secret already expired');
  }
  
  return true;
};

// Monitoring des secrets
const monitorSecrets = () => {
  console.log(`Active secrets: ${secretManager.getActiveSecretsCount()}`);
  
  // Log des expirations prochaines
  for (const [userId, info] of secretManager.userSecrets) {
    if (info.timeRemaining < 600) { // < 10 min
      console.warn(`Secret ${userId} expire bientôt: ${info.timeRemaining}s`);
    }
  }
};
```

---

**🎉 Client Secrets API intégré avec succès!**

*Accès sécurisé à l'API Realtime sans exposition de clés*