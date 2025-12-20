// 🎯 OpenAI Fine-tuning API Service - IAPosteManager
// Custom model training for email-specific AI capabilities

const OPENAI_API_BASE = 'https://api.openai.com/v1';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Fine-tuning request handler
const fineTuningRequest = async (endpoint, options = {}) => {
  if (!OPENAI_API_KEY) {
    throw new Error('Clé API OpenAI manquante');
  }
  
  const url = `${OPENAI_API_BASE}${endpoint}`;
  const requestId = `ft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
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
    throw new Error(`Fine-tuning API Error: ${errorData.error?.message || response.statusText}`);
  }
  
  return response.json();
};

// Service Fine-tuning OpenAI complet
export const openaiFineTuningService = {
  // Jobs management
  jobs: {
    // Créer un job de fine-tuning
    create: async (model, trainingFileId, options = {}) => {
      const {
        validationFileId = null,
        suffix = null,
        seed = null,
        metadata = {},
        method = {
          type: 'supervised',
          supervised: {
            hyperparameters: {
              batch_size: 'auto',
              learning_rate_multiplier: 'auto',
              n_epochs: 'auto'
            }
          }
        },
        integrations = []
      } = options;
      
      return fineTuningRequest('/fine_tuning/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          training_file: trainingFileId,
          validation_file: validationFileId,
          suffix,
          seed,
          metadata,
          method,
          integrations
        })
      });
    },
    
    // Lister les jobs
    list: async (options = {}) => {
      const { after, limit = 20, metadata = null } = options;
      const params = new URLSearchParams();
      
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      if (metadata) {
        if (metadata === null) {
          params.append('metadata', 'null');
        } else {
          Object.entries(metadata).forEach(([key, value]) => {
            params.append(`metadata[${key}]`, value);
          });
        }
      }
      
      return fineTuningRequest(`/fine_tuning/jobs?${params}`, {
        method: 'GET'
      });
    },
    
    // Récupérer un job
    get: async (jobId) => {
      return fineTuningRequest(`/fine_tuning/jobs/${jobId}`, {
        method: 'GET'
      });
    },
    
    // Annuler un job
    cancel: async (jobId) => {
      return fineTuningRequest(`/fine_tuning/jobs/${jobId}/cancel`, {
        method: 'POST'
      });
    },
    
    // Reprendre un job
    resume: async (jobId) => {
      return fineTuningRequest(`/fine_tuning/jobs/${jobId}/resume`, {
        method: 'POST'
      });
    },
    
    // Mettre en pause un job
    pause: async (jobId) => {
      return fineTuningRequest(`/fine_tuning/jobs/${jobId}/pause`, {
        method: 'POST'
      });
    },
    
    // Lister les événements d'un job
    listEvents: async (jobId, options = {}) => {
      const { after, limit = 20 } = options;
      const params = new URLSearchParams();
      
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      
      return fineTuningRequest(`/fine_tuning/jobs/${jobId}/events?${params}`, {
        method: 'GET'
      });
    },
    
    // Lister les checkpoints
    listCheckpoints: async (jobId, options = {}) => {
      const { after, limit = 10 } = options;
      const params = new URLSearchParams();
      
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      
      return fineTuningRequest(`/fine_tuning/jobs/${jobId}/checkpoints?${params}`, {
        method: 'GET'
      });
    }
  },
  
  // Checkpoints management
  checkpoints: {
    // Lister les permissions d'un checkpoint
    listPermissions: async (checkpointId, options = {}) => {
      const { after, limit = 10, order = 'desc', projectId } = options;
      const params = new URLSearchParams();
      
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      params.append('order', order);
      if (projectId) params.append('project_id', projectId);
      
      return fineTuningRequest(`/fine_tuning/checkpoints/${checkpointId}/permissions?${params}`, {
        method: 'GET'
      });
    },
    
    // Créer des permissions pour un checkpoint
    createPermissions: async (checkpointId, projectIds) => {
      return fineTuningRequest(`/fine_tuning/checkpoints/${checkpointId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_ids: projectIds })
      });
    },
    
    // Supprimer une permission
    deletePermission: async (checkpointId, permissionId) => {
      return fineTuningRequest(`/fine_tuning/checkpoints/${checkpointId}/permissions/${permissionId}`, {
        method: 'DELETE'
      });
    }
  }
};

// Helpers pour IAPosteManager
export const fineTuningHelpers = {
  // Créer des données d'entraînement pour emails
  createEmailTrainingData: (emailExamples) => {
    return emailExamples.map(example => ({
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en rédaction d\'emails professionnels en français.'
        },
        {
          role: 'user',
          content: example.prompt
        },
        {
          role: 'assistant',
          content: example.completion
        }
      ]
    }));
  },
  
  // Créer des données de préférence (DPO)
  createPreferenceData: (preferenceExamples) => {
    return preferenceExamples.map(example => ({
      input: {
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant expert en rédaction d\'emails professionnels en français.'
          },
          {
            role: 'user',
            content: example.prompt
          }
        ]
      },
      preferred_output: [
        {
          role: 'assistant',
          content: example.preferred_completion
        }
      ],
      non_preferred_output: [
        {
          role: 'assistant',
          content: example.non_preferred_completion
        }
      ]
    }));
  },
  
  // Valider les données d'entraînement
  validateTrainingData: (trainingData) => {
    const errors = [];
    
    trainingData.forEach((item, index) => {
      if (!item.messages || !Array.isArray(item.messages)) {
        errors.push(`Item ${index}: messages field is required and must be an array`);
      }
      
      if (item.messages) {
        const hasUser = item.messages.some(msg => msg.role === 'user');
        const hasAssistant = item.messages.some(msg => msg.role === 'assistant');
        
        if (!hasUser) {
          errors.push(`Item ${index}: must have at least one user message`);
        }
        if (!hasAssistant) {
          errors.push(`Item ${index}: must have at least one assistant message`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      itemCount: trainingData.length
    };
  },
  
  // Convertir en format JSONL
  toJSONL: (data) => {
    return data.map(item => JSON.stringify(item)).join('\n');
  },
  
  // Créer un fichier d'entraînement
  createTrainingFile: async (trainingData, filename = 'email-training-data.jsonl') => {
    const validation = fineTuningHelpers.validateTrainingData(trainingData);
    
    if (!validation.isValid) {
      throw new Error(`Training data validation failed: ${validation.errors.join(', ')}`);
    }
    
    const jsonlContent = fineTuningHelpers.toJSONL(trainingData);
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const file = new File([blob], filename, { type: 'application/jsonl' });
    
    return file;
  },
  
  // Uploader un fichier d'entraînement
  uploadTrainingFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'fine-tune');
    
    const response = await fetch(`${OPENAI_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`File upload failed: ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
  },
  
  // Workflow complet de fine-tuning
  createEmailModel: async (emailExamples, modelName = 'gpt-4o-mini', options = {}) => {
    try {
      // 1. Créer les données d'entraînement
      const trainingData = fineTuningHelpers.createEmailTrainingData(emailExamples);
      
      // 2. Valider les données
      const validation = fineTuningHelpers.validateTrainingData(trainingData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // 3. Créer le fichier
      const trainingFile = await fineTuningHelpers.createTrainingFile(
        trainingData,
        `${modelName}-email-training-${Date.now()}.jsonl`
      );
      
      // 4. Uploader le fichier
      const uploadedFile = await fineTuningHelpers.uploadTrainingFile(trainingFile);
      
      // 5. Créer le job de fine-tuning
      const job = await openaiFineTuningService.jobs.create(
        modelName,
        uploadedFile.id,
        {
          suffix: options.suffix || 'email-model',
          metadata: {
            purpose: 'email_generation',
            created_by: 'iapostemanager',
            training_examples: trainingData.length.toString(),
            ...options.metadata
          },
          method: options.method || {
            type: 'supervised',
            supervised: {
              hyperparameters: {
                batch_size: 'auto',
                learning_rate_multiplier: 'auto',
                n_epochs: options.epochs || 'auto'
              }
            }
          }
        }
      );
      
      return {
        job,
        trainingFile: uploadedFile,
        trainingDataCount: trainingData.length,
        validation
      };
      
    } catch (error) {
      console.error('Email model creation failed:', error);
      throw error;
    }
  },
  
  // Monitorer un job de fine-tuning
  monitorJob: async (jobId, callbacks = {}) => {
    const {
      onStatusChange = () => {},
      onEvent = () => {},
      onComplete = () => {},
      onError = () => {}
    } = callbacks;
    
    let lastStatus = null;
    let lastEventId = null;
    
    const checkStatus = async () => {
      try {
        // Vérifier le statut du job
        const job = await openaiFineTuningService.jobs.get(jobId);
        
        if (job.status !== lastStatus) {
          lastStatus = job.status;
          onStatusChange(job.status, job);
          
          if (job.status === 'succeeded') {
            onComplete(job);
            return true; // Stop monitoring
          } else if (job.status === 'failed' || job.status === 'cancelled') {
            onError(job.error || { message: `Job ${job.status}` }, job);
            return true; // Stop monitoring
          }
        }
        
        // Récupérer les nouveaux événements
        const events = await openaiFineTuningService.jobs.listEvents(jobId, {
          after: lastEventId,
          limit: 50
        });
        
        if (events.data.length > 0) {
          events.data.reverse().forEach(event => {
            onEvent(event);
          });
          lastEventId = events.data[0].id;
        }
        
        return false; // Continue monitoring
        
      } catch (error) {
        onError(error);
        return true; // Stop monitoring on error
      }
    };
    
    // Vérification initiale
    await checkStatus();
    
    // Monitoring périodique
    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 30000); // Vérifier toutes les 30 secondes
    
    return {
      jobId,
      stop: () => clearInterval(interval)
    };
  },
  
  // Tester un modèle fine-tuné
  testFineTunedModel: async (modelId, testPrompts) => {
    const results = [];
    
    for (const prompt of testPrompts) {
      try {
        const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              {
                role: 'system',
                content: 'Tu es un assistant expert en rédaction d\'emails professionnels en français.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          })
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        results.push({
          prompt,
          response: data.choices[0].message.content,
          usage: data.usage,
          success: true
        });
        
      } catch (error) {
        results.push({
          prompt,
          error: error.message,
          success: false
        });
      }
    }
    
    return {
      modelId,
      testCount: testPrompts.length,
      successCount: results.filter(r => r.success).length,
      results
    };
  }
};

export default openaiFineTuningService;