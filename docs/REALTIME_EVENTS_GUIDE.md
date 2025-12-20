# ⚡ Realtime Events API - Guide WebSocket Client

## Vue d'ensemble

L'API Realtime Events fournit les événements client pour interagir avec le serveur WebSocket OpenAI Realtime, permettant des conversations vocales en temps réel.

## Événements Client Disponibles

### 1. Session Update
Mettre à jour la configuration de session

### 2. Audio Buffer
- `append`: Ajouter de l'audio au buffer
- `commit`: Valider le buffer audio
- `clear`: Vider le buffer audio

### 3. Conversation Items
- `create`: Créer un nouvel élément
- `retrieve`: Récupérer un élément
- `truncate`: Tronquer l'audio
- `delete`: Supprimer un élément

### 4. Response Control
- `create`: Déclencher une réponse
- `cancel`: Annuler une réponse

## API Service

### 1. Configuration de Session

```javascript
import { realtimeEventsAPI } from '@/services/api';

// Configuration pour assistant email
const sessionConfig = realtimeEventsAPI.createEmailSessionConfig(
  'Vous êtes un expert en rédaction d\'emails professionnels.'
);

const sessionUpdate = realtimeEventsAPI.createSessionUpdate(sessionConfig);

// Envoyer via WebSocket
websocket.send(JSON.stringify(sessionUpdate));
```

### 2. Gestion Audio

```javascript
// Ajouter de l'audio au buffer
const audioAppend = realtimeEventsAPI.createAudioAppend(
  'base64AudioData',
  'event_123'
);

// Valider le buffer (créer un message utilisateur)
const audioCommit = realtimeEventsAPI.createAudioCommit('event_124');

// Vider le buffer
const audioClear = realtimeEventsAPI.createAudioClear('event_125');

websocket.send(JSON.stringify(audioAppend));
websocket.send(JSON.stringify(audioCommit));
```

### 3. Messages de Conversation

```javascript
// Créer un message utilisateur
const userMessage = realtimeEventsAPI.createEmailMessage(
  'Rédigez un email de relance pour un client'
);

const createItem = realtimeEventsAPI.createConversationItem(
  userMessage,
  null, // previous_item_id
  'event_126'
);

websocket.send(JSON.stringify(createItem));
```

### 4. Contrôle des Réponses

```javascript
// Déclencher une réponse simple
const simpleResponse = realtimeEventsAPI.createResponse();

// Réponse avec configuration spécifique
const customResponse = realtimeEventsAPI.createResponse({
  instructions: 'Répondez de manière concise',
  output_modalities: ['text'],
  max_output_tokens: 500
});

websocket.send(JSON.stringify(customResponse));
```

## Exemples d'Utilisation

### 1. Assistant Email Vocal Complet

```javascript
class RealtimeEmailAssistant {
  constructor() {
    this.websocket = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  async connect(clientSecret) {
    const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-realtime';
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('WebSocket connecté');
      this.initializeSession();
    };

    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleServerEvent(data);
    };

    this.websocket.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
    };
  }

  initializeSession() {
    // Configurer la session pour l'assistance email
    const sessionConfig = realtimeEventsAPI.createEmailSessionConfig();
    const sessionUpdate = realtimeEventsAPI.createSessionUpdate(sessionConfig);
    
    this.send(sessionUpdate);
  }

  async startVoiceInput() {
    if (this.isRecording) return;

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
      this.isRecording = true;

      // Vider le buffer audio avant de commencer
      const clearEvent = realtimeEventsAPI.createAudioClear();
      this.send(clearEvent);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.processAudioChunk(event.data);
        }
      };

      this.mediaRecorder.start(100); // Chunks de 100ms
      console.log('Enregistrement vocal démarré');

    } catch (error) {
      console.error('Erreur démarrage vocal:', error);
    }
  }

  async processAudioChunk(audioBlob) {
    // Convertir en base64 PCM 24kHz
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = this.arrayBufferToBase64(arrayBuffer);
    
    // Envoyer au serveur
    const appendEvent = realtimeEventsAPI.createAudioAppend(base64Audio);
    this.send(appendEvent);
  }

  stopVoiceInput() {
    if (!this.isRecording) return;

    this.isRecording = false;
    
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    // Valider le buffer audio
    const commitEvent = realtimeEventsAPI.createAudioCommit();
    this.send(commitEvent);

    // Déclencher la réponse
    const responseEvent = realtimeEventsAPI.createResponse();
    this.send(responseEvent);

    console.log('Enregistrement vocal arrêté');
  }

  sendTextMessage(text) {
    // Créer un message texte
    const message = realtimeEventsAPI.createEmailMessage(text);
    const createItem = realtimeEventsAPI.createConversationItem(message);
    
    this.send(createItem);

    // Déclencher la réponse
    const responseEvent = realtimeEventsAPI.createResponse();
    this.send(responseEvent);
  }

  handleServerEvent(event) {
    switch (event.type) {
      case 'session.created':
        console.log('Session créée:', event.session.id);
        break;

      case 'session.updated':
        console.log('Session mise à jour');
        break;

      case 'input_audio_buffer.committed':
        console.log('Buffer audio validé');
        break;

      case 'conversation.item.created':
        console.log('Élément créé:', event.item.id);
        break;

      case 'response.created':
        console.log('Réponse créée:', event.response.id);
        break;

      case 'response.output_item.added':
        this.handleResponseItem(event.item);
        break;

      case 'response.content_part.added':
        this.handleContentPart(event.part);
        break;

      case 'response.audio.delta':
        this.handleAudioDelta(event.delta);
        break;

      case 'response.text.delta':
        this.handleTextDelta(event.delta);
        break;

      case 'response.done':
        console.log('Réponse terminée');
        break;

      case 'error':
        console.error('Erreur serveur:', event.error);
        break;
    }
  }

  handleResponseItem(item) {
    if (item.type === 'message' && item.role === 'assistant') {
      console.log('Réponse assistant reçue');
    }
  }

  handleContentPart(part) {
    if (part.type === 'text') {
      console.log('Contenu texte:', part.text);
    } else if (part.type === 'audio') {
      console.log('Contenu audio reçu');
    }
  }

  handleAudioDelta(delta) {
    // Décoder et jouer l'audio
    const audioData = atob(delta);
    this.playAudioChunk(audioData);
  }

  handleTextDelta(delta) {
    // Afficher le texte en streaming
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('assistant-text-delta', {
        detail: { delta, timestamp: Date.now() }
      }));
    }
  }

  playAudioChunk(audioData) {
    // Implémentation de lecture audio
    // (dépend de l'implémentation audio du navigateur)
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  send(event) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(event));
    }
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
    }
    
    if (this.isRecording && this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }
}

// Utilisation
const assistant = new RealtimeEmailAssistant();
await assistant.connect('client_secret_here');

// Interaction vocale
assistant.startVoiceInput();
// ... parler ...
assistant.stopVoiceInput();

// Interaction texte
assistant.sendTextMessage('Créez un email de remerciement client');
```

### 2. Gestionnaire d'Interruptions

```javascript
class InterruptionManager {
  constructor(websocket) {
    this.websocket = websocket;
    this.currentResponseId = null;
    this.isPlaying = false;
    this.audioStartTime = null;
  }

  onResponseStarted(responseId) {
    this.currentResponseId = responseId;
    this.isPlaying = true;
    this.audioStartTime = Date.now();
  }

  handleUserInterruption() {
    if (!this.currentResponseId || !this.isPlaying) return;

    // Calculer le temps d'audio écoulé
    const elapsedMs = Date.now() - this.audioStartTime;

    // Annuler la réponse en cours
    const cancelEvent = realtimeEventsAPI.createResponseCancel(this.currentResponseId);
    this.send(cancelEvent);

    // Tronquer l'audio à la position actuelle
    const truncateEvent = realtimeEventsAPI.createItemTruncate(
      this.currentResponseId,
      0, // content_index
      elapsedMs
    );
    this.send(truncateEvent);

    // Vider le buffer audio de sortie
    const clearOutputEvent = realtimeEventsAPI.createOutputAudioClear();
    this.send(clearOutputEvent);

    this.isPlaying = false;
    this.currentResponseId = null;

    console.log(`Interruption gérée à ${elapsedMs}ms`);
  }

  send(event) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(event));
    }
  }
}

// Utilisation
const interruptionManager = new InterruptionManager(websocket);

// Détecter l'interruption utilisateur (ex: clic, touche, détection vocale)
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    interruptionManager.handleUserInterruption();
  }
});
```

### 3. Gestionnaire de Conversation Multi-Tours

```javascript
class ConversationManager {
  constructor(websocket) {
    this.websocket = websocket;
    this.conversationHistory = [];
    this.currentContext = 'email_creation';
  }

  addUserMessage(text, context = null) {
    const message = realtimeEventsAPI.createEmailMessage(text, 'user');
    const createEvent = realtimeEventsAPI.createConversationItem(message);
    
    this.send(createEvent);
    
    // Ajouter à l'historique local
    this.conversationHistory.push({
      role: 'user',
      content: text,
      timestamp: Date.now(),
      context: context || this.currentContext
    });

    return createEvent.event_id;
  }

  createContextualResponse(context, instructions = null) {
    const contextInstructions = {
      email_creation: 'Aidez à créer un email professionnel',
      email_editing: 'Aidez à améliorer cet email',
      email_review: 'Analysez et donnez des suggestions pour cet email'
    };

    const responseConfig = {
      instructions: instructions || contextInstructions[context],
      output_modalities: ['text', 'audio'],
      metadata: {
        context: context,
        conversation_turn: this.conversationHistory.length
      }
    };

    const responseEvent = realtimeEventsAPI.createResponse(responseConfig);
    this.send(responseEvent);

    return responseEvent.event_id;
  }

  switchContext(newContext, transitionMessage = null) {
    this.currentContext = newContext;
    
    if (transitionMessage) {
      this.addUserMessage(transitionMessage, newContext);
      this.createContextualResponse(newContext);
    }
  }

  retrieveConversationItem(itemId) {
    const retrieveEvent = realtimeEventsAPI.createItemRetrieve(itemId);
    this.send(retrieveEvent);
    return retrieveEvent.event_id;
  }

  deleteConversationItem(itemId) {
    const deleteEvent = realtimeEventsAPI.createItemDelete(itemId);
    this.send(deleteEvent);
    
    // Supprimer de l'historique local
    this.conversationHistory = this.conversationHistory.filter(
      item => item.id !== itemId
    );

    return deleteEvent.event_id;
  }

  getConversationSummary() {
    return {
      totalMessages: this.conversationHistory.length,
      contexts: [...new Set(this.conversationHistory.map(item => item.context))],
      currentContext: this.currentContext,
      lastMessage: this.conversationHistory[this.conversationHistory.length - 1]
    };
  }

  send(event) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(event));
    }
  }
}

// Utilisation
const conversationManager = new ConversationManager(websocket);

// Créer un email
conversationManager.addUserMessage('Je veux créer un email de relance client');
conversationManager.createContextualResponse('email_creation');

// Changer de contexte pour édition
conversationManager.switchContext(
  'email_editing',
  'Maintenant aidez-moi à améliorer ce brouillon'
);

// Récupérer l'historique
const summary = conversationManager.getConversationSummary();
console.log('Résumé conversation:', summary);
```

## Composant React Intégré

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { realtimeEventsAPI, clientSecretsAPI } from '@/services/api';

function RealtimeEmailChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  const websocketRef = useRef(null);
  const assistantRef = useRef(null);

  useEffect(() => {
    initializeRealtime();
    return () => cleanup();
  }, []);

  const initializeRealtime = async () => {
    try {
      // Créer un client secret
      const secret = await clientSecretsAPI.createEmailAssistantSecret(3600);
      
      // Initialiser l'assistant
      assistantRef.current = new RealtimeEmailAssistant();
      await assistantRef.current.connect(secret.value);
      
      setIsConnected(true);
      
    } catch (error) {
      console.error('Erreur initialisation:', error);
    }
  };

  const handleVoiceToggle = () => {
    if (!assistantRef.current) return;

    if (isRecording) {
      assistantRef.current.stopVoiceInput();
      setIsRecording(false);
    } else {
      assistantRef.current.startVoiceInput();
      setIsRecording(true);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !assistantRef.current) return;

    assistantRef.current.sendTextMessage(inputText);
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    }]);
    
    setInputText('');
  };

  const cleanup = () => {
    if (assistantRef.current) {
      assistantRef.current.disconnect();
    }
  };

  // Écouter les événements de l'assistant
  useEffect(() => {
    const handleTextDelta = (event) => {
      const { delta } = event.detail;
      
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.streaming) {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + delta }
          ];
        } else {
          return [...prev, {
            role: 'assistant',
            content: delta,
            timestamp: Date.now(),
            streaming: true
          }];
        }
      });
    };

    window.addEventListener('assistant-text-delta', handleTextDelta);
    return () => window.removeEventListener('assistant-text-delta', handleTextDelta);
  }, []);

  return (
    <div className="realtime-email-chat">
      <div className="chat-header">
        <h2>🎤 Assistant Email Temps Réel</h2>
        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      <div className="input-controls">
        <form onSubmit={handleTextSubmit} className="text-input">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tapez votre message..."
            disabled={!isConnected}
          />
          <button type="submit" disabled={!isConnected || !inputText.trim()}>
            📤
          </button>
        </form>

        <button
          onClick={handleVoiceToggle}
          disabled={!isConnected}
          className={`voice-button ${isRecording ? 'recording' : ''}`}
        >
          {isRecording ? '🛑 Arrêter' : '🎤 Parler'}
        </button>
      </div>

      <div className="quick-actions">
        <button
          onClick={() => assistantRef.current?.sendTextMessage('Créez un email de relance client')}
          disabled={!isConnected}
        >
          📧 Email de relance
        </button>
        <button
          onClick={() => assistantRef.current?.sendTextMessage('Rédigez un email de remerciement')}
          disabled={!isConnected}
        >
          🙏 Email de remerciement
        </button>
        <button
          onClick={() => assistantRef.current?.sendTextMessage('Aidez-moi à améliorer cet email')}
          disabled={!isConnected}
        >
          ✨ Améliorer email
        </button>
      </div>
    </div>
  );
}

export default RealtimeEmailChat;
```

## Bonnes Pratiques

### 1. Gestion des Event IDs
```javascript
class EventIdManager {
  constructor() {
    this.counter = 0;
  }

  generate(prefix = 'event') {
    return `${prefix}_${Date.now()}_${++this.counter}`;
  }
}

const eventIds = new EventIdManager();

// Utilisation
const event = realtimeEventsAPI.createAudioCommit(eventIds.generate('audio'));
```

### 2. Validation des Événements
```javascript
const validateEvent = (event) => {
  if (!event.type) {
    throw new Error('Event type is required');
  }
  
  const validTypes = [
    'session.update',
    'input_audio_buffer.append',
    'input_audio_buffer.commit',
    'conversation.item.create',
    'response.create'
  ];
  
  if (!validTypes.includes(event.type)) {
    throw new Error(`Invalid event type: ${event.type}`);
  }
  
  return true;
};
```

### 3. Monitoring des Événements
```javascript
class EventMonitor {
  constructor() {
    this.sentEvents = new Map();
    this.receivedEvents = new Map();
  }

  logSentEvent(event) {
    const id = event.event_id || 'no_id';
    this.sentEvents.set(id, {
      ...event,
      timestamp: Date.now()
    });
  }

  logReceivedEvent(event) {
    const id = event.event_id || 'no_id';
    this.receivedEvents.set(id, {
      ...event,
      timestamp: Date.now()
    });
  }

  getStats() {
    return {
      sent: this.sentEvents.size,
      received: this.receivedEvents.size,
      pending: this.sentEvents.size - this.receivedEvents.size
    };
  }
}
```

---

**🎉 Realtime Events API intégré avec succès!**

*Contrôle complet des événements WebSocket pour interactions temps réel*