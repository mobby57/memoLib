/**
 * OpenAI Calls API Service
 * Controls WebRTC and SIP calls with the Realtime API
 */

class CallsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1/realtime/calls';
  }

  /**
   * Accept incoming SIP call
   */
  async acceptCall(callId, sessionConfig = {}) {
    try {
      const defaultConfig = {
        type: 'realtime',
        model: 'gpt-realtime',
        instructions: 'You are a professional email assistant. Help users create and manage emails efficiently.',
        output_modalities: ['audio'],
        audio: {
          input: {
            format: { type: 'audio/pcm', rate: 24000 },
            turn_detection: { type: 'server_vad' }
          },
          output: {
            format: { type: 'audio/pcm', rate: 24000 },
            voice: 'alloy',
            speed: 1.0
          }
        }
      };

      const config = { ...defaultConfig, ...sessionConfig };

      const response = await fetch(`${this.baseURL}/${callId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Accept call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Accept call error:', error);
      throw error;
    }
  }

  /**
   * Reject incoming SIP call
   */
  async rejectCall(callId, statusCode = 603) {
    try {
      const response = await fetch(`${this.baseURL}/${callId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ status_code: statusCode })
      });

      if (!response.ok) {
        throw new Error(`Reject call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Reject call error:', error);
      throw error;
    }
  }

  /**
   * Transfer call to another destination
   */
  async referCall(callId, targetUri) {
    try {
      const response = await fetch(`${this.baseURL}/${callId}/refer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ target_uri: targetUri })
      });

      if (!response.ok) {
        throw new Error(`Refer call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Refer call error:', error);
      throw error;
    }
  }

  /**
   * Hang up active call
   */
  async hangupCall(callId) {
    try {
      const response = await fetch(`${this.baseURL}/${callId}/hangup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Hangup call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Hangup call error:', error);
      throw error;
    }
  }

  // Helper methods for email-specific use cases

  /**
   * Accept call with email assistant configuration
   */
  async acceptEmailAssistantCall(callId, language = 'en') {
    const instructions = {
      en: 'You are Alex, a professional email assistant. Help users create, edit, and manage their emails efficiently. Be concise and helpful.',
      fr: 'Vous êtes Alex, un assistant email professionnel. Aidez les utilisateurs à créer, modifier et gérer leurs emails efficacement. Soyez concis et utile.',
      es: 'Eres Alex, un asistente de email profesional. Ayuda a los usuarios a crear, editar y gestionar sus emails de manera eficiente. Sé conciso y útil.'
    };

    return this.acceptCall(callId, {
      instructions: instructions[language] || instructions.en,
      max_output_tokens: 1000,
      tools: [
        {
          type: 'function',
          name: 'create_email',
          description: 'Create a new email draft',
          parameters: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              body: { type: 'string' },
              recipient: { type: 'string' }
            }
          }
        }
      ]
    });
  }

  /**
   * Accept call with transcription focus
   */
  async acceptTranscriptionCall(callId) {
    return this.acceptCall(callId, {
      instructions: 'You are a transcription assistant. Listen carefully and provide accurate transcriptions of spoken content.',
      include: ['item.input_audio_transcription.logprobs'],
      output_modalities: ['text']
    });
  }

  /**
   * Transfer call to human agent
   */
  async transferToAgent(callId, agentPhone) {
    const targetUri = agentPhone.startsWith('sip:') ? agentPhone : `tel:${agentPhone}`;
    return this.referCall(callId, targetUri);
  }

  /**
   * Reject call with specific reason
   */
  async rejectWithReason(callId, reason = 'busy') {
    const statusCodes = {
      busy: 486,        // Busy Here
      decline: 603,     // Decline
      unavailable: 480, // Temporarily Unavailable
      forbidden: 403    // Forbidden
    };

    return this.rejectCall(callId, statusCodes[reason] || 603);
  }

  /**
   * Get session configuration for email workflows
   */
  getEmailSessionConfig(options = {}) {
    const {
      voice = 'alloy',
      speed = 1.0,
      language = 'en',
      maxTokens = 2000
    } = options;

    return {
      type: 'realtime',
      model: 'gpt-realtime',
      instructions: `You are a professional email assistant. Help users with email composition, editing, and management. Respond in ${language}.`,
      max_output_tokens: maxTokens,
      output_modalities: ['audio'],
      audio: {
        input: {
          format: { type: 'audio/pcm', rate: 24000 },
          turn_detection: { type: 'server_vad', threshold: 0.5 }
        },
        output: {
          format: { type: 'audio/pcm', rate: 24000 },
          voice,
          speed
        }
      },
      tools: [
        {
          type: 'function',
          name: 'create_email_draft',
          description: 'Create a new email draft',
          parameters: {
            type: 'object',
            properties: {
              subject: { type: 'string', description: 'Email subject' },
              body: { type: 'string', description: 'Email body content' },
              recipient: { type: 'string', description: 'Recipient email address' },
              priority: { type: 'string', enum: ['low', 'normal', 'high'] }
            },
            required: ['subject', 'body']
          }
        },
        {
          type: 'function',
          name: 'save_email_template',
          description: 'Save email content as template',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Template name' },
              content: { type: 'string', description: 'Template content' },
              category: { type: 'string', description: 'Template category' }
            },
            required: ['name', 'content']
          }
        }
      ]
    };
  }
}

export default new CallsService();