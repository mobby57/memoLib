/**
 * OpenAI Realtime WebSocket Events Handler
 * Manages server events for voice interactions in IAPosteManager
 */

class RealtimeEventsHandler {
  constructor() {
    this.eventHandlers = new Map();
    this.session = null;
    this.conversation = [];
    this.currentResponse = null;
  }

  /**
   * Register event handler
   */
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType).push(handler);
  }

  /**
   * Handle incoming server event
   */
  handleEvent(event) {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error handling ${event.type}:`, error);
      }
    });

    // Built-in handlers
    switch (event.type) {
      case 'error':
        this.handleError(event);
        break;
      case 'session.created':
        this.handleSessionCreated(event);
        break;
      case 'conversation.item.added':
        this.handleItemAdded(event);
        break;
      case 'response.created':
        this.handleResponseCreated(event);
        break;
      case 'response.done':
        this.handleResponseDone(event);
        break;
      case 'input_audio_buffer.speech_started':
        this.handleSpeechStarted(event);
        break;
      case 'input_audio_buffer.speech_stopped':
        this.handleSpeechStopped(event);
        break;
    }
  }

  /**
   * Handle error events
   */
  handleError(event) {
    console.error('Realtime API Error:', event.error);
    this.emit('error', event.error);
  }

  /**
   * Handle session creation
   */
  handleSessionCreated(event) {
    this.session = event.session;
    this.emit('sessionReady', this.session);
  }

  /**
   * Handle conversation item added
   */
  handleItemAdded(event) {
    this.conversation.push(event.item);
    this.emit('messageAdded', event.item);
  }

  /**
   * Handle response creation
   */
  handleResponseCreated(event) {
    this.currentResponse = event.response;
    this.emit('responseStarted', event.response);
  }

  /**
   * Handle response completion
   */
  handleResponseDone(event) {
    this.currentResponse = event.response;
    this.emit('responseCompleted', event.response);
    
    // Extract email content if available
    if (event.response.output) {
      const emailContent = this.extractEmailContent(event.response.output);
      if (emailContent) {
        this.emit('emailGenerated', emailContent);
      }
    }
  }

  /**
   * Handle speech detection
   */
  handleSpeechStarted(event) {
    this.emit('speechStarted', { itemId: event.item_id, startTime: event.audio_start_ms });
  }

  handleSpeechStopped(event) {
    this.emit('speechStopped', { itemId: event.item_id, endTime: event.audio_end_ms });
  }

  /**
   * Extract email content from response
   */
  extractEmailContent(output) {
    for (const item of output) {
      if (item.type === 'message' && item.role === 'assistant') {
        for (const content of item.content || []) {
          if (content.type === 'output_text' || content.type === 'output_audio') {
            const text = content.text || content.transcript || '';
            
            // Simple email pattern detection
            const emailMatch = text.match(/Subject:\s*(.+)\n\nBody:\s*(.+)/s);
            if (emailMatch) {
              return {
                subject: emailMatch[1].trim(),
                body: emailMatch[2].trim(),
                fullText: text
              };
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Emit custom events
   */
  emit(eventName, data) {
    const handlers = this.eventHandlers.get(eventName) || [];
    handlers.forEach(handler => handler(data));
  }

  /**
   * Get conversation history
   */
  getConversation() {
    return this.conversation.map(item => ({
      id: item.id,
      role: item.role,
      content: item.content?.[0]?.text || item.content?.[0]?.transcript || '',
      timestamp: Date.now()
    }));
  }

  /**
   * Get current session info
   */
  getSession() {
    return this.session;
  }

  /**
   * Clear conversation
   */
  clearConversation() {
    this.conversation = [];
    this.emit('conversationCleared');
  }
}

// Email-specific event handlers
export const createEmailEventHandlers = () => {
  const handler = new RealtimeEventsHandler();

  // Email generation handler
  handler.on('responseCompleted', (response) => {
    if (response.status === 'completed') {
      console.log('Email response completed:', response.usage);
    }
  });

  // Speech detection for email dictation
  handler.on('speechStarted', () => {
    console.log('User started speaking - ready for email dictation');
  });

  handler.on('speechStopped', () => {
    console.log('User stopped speaking - processing email content');
  });

  // Error handling for email workflows
  handler.on('error', (error) => {
    if (error.code === 'audio_unintelligible') {
      console.warn('Audio unclear - please repeat email request');
    }
  });

  return handler;
};

export default RealtimeEventsHandler;