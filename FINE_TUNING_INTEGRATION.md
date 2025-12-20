# 🎯 OpenAI Fine-tuning API Integration - IAPosteManager

## 📋 Overview

IAPosteManager now includes comprehensive OpenAI Fine-tuning API integration for creating custom email models tailored to your specific communication style and requirements.

## 🔧 Features

### 1. Fine-tuning Job Management
- **Create jobs**: Train custom models on your email data
- **Monitor progress**: Real-time job status and event tracking
- **Control jobs**: Pause, resume, cancel fine-tuning jobs
- **Checkpoints**: Access intermediate model states

### 2. Training Methods
- **Supervised**: Standard fine-tuning with input-output pairs
- **Preference (DPO)**: Train on preferred vs non-preferred outputs
- **Reinforcement**: Advanced training for reasoning models

### 3. Model Management
- **Custom models**: Create email-specific AI models
- **Checkpoints**: Save and restore training progress
- **Permissions**: Share models across projects
- **Testing**: Validate model performance

## 🚀 Usage Examples

### Basic Email Model Training

```javascript
import { fineTuningHelpers } from './services/fine-tuning.js';

// Prepare training data
const emailExamples = [
  {
    prompt: 'Écrire un email de suivi après une réunion',
    completion: 'Bonjour,\n\nJe vous remercie pour la réunion productive d\'aujourd\'hui...'
  },
  {
    prompt: 'Email de relance pour une facture impayée',
    completion: 'Madame, Monsieur,\n\nNous vous contactons concernant la facture...'
  }
  // ... plus d'exemples
];

// Créer et entraîner le modèle
const result = await fineTuningHelpers.createEmailModel(
  emailExamples,
  'gpt-4o-mini',
  {
    suffix: 'company-emails',
    epochs: 3,
    metadata: {
      department: 'marketing',
      language: 'french'
    }
  }
);

console.log('Training job created:', result.job.id);
```

### Advanced Training with Preferences

```javascript
// Données de préférence pour améliorer la qualité
const preferenceExamples = [
  {
    prompt: 'Email de bienvenue pour nouveau client',
    preferred_completion: 'Bienvenue dans notre entreprise ! Nous sommes ravis...',
    non_preferred_completion: 'Salut, tu es maintenant client chez nous...'
  }
];

const preferenceData = fineTuningHelpers.createPreferenceData(preferenceExamples);
const trainingFile = await fineTuningHelpers.createTrainingFile(preferenceData);
const uploadedFile = await fineTuningHelpers.uploadTrainingFile(trainingFile);

// Créer job avec méthode DPO
const job = await openaiFineTuningService.jobs.create(
  'gpt-4o-mini',
  uploadedFile.id,
  {
    method: {
      type: 'dpo',
      dpo: {
        hyperparameters: {
          batch_size: 'auto',
          learning_rate_multiplier: 0.1,
          n_epochs: 2
        }
      }
    }
  }
);
```

### Job Monitoring

```javascript
// Monitorer le progrès d'entraînement
const monitor = await fineTuningHelpers.monitorJob(
  job.id,
  {
    onStatusChange: (status, job) => {
      console.log(`Job status: ${status}`);
      updateUI({ status, progress: job.trained_tokens });
    },
    
    onEvent: (event) => {
      console.log(`Event: ${event.message}`);
      addLogEntry(event);
    },
    
    onComplete: (job) => {
      console.log(`Model ready: ${job.fine_tuned_model}`);
      notifyUser('Training completed!');
    },
    
    onError: (error, job) => {
      console.error('Training failed:', error);
      handleTrainingError(error);
    }
  }
);

// Arrêter le monitoring si nécessaire
// monitor.stop();
```

### Model Testing

```javascript
// Tester le modèle fine-tuné
const testPrompts = [
  'Écrire un email de remerciement après achat',
  'Email de confirmation de rendez-vous',
  'Réponse à une réclamation client'
];

const testResults = await fineTuningHelpers.testFineTunedModel(
  'ft:gpt-4o-mini:company:emails:abc123',
  testPrompts
);

console.log(`Success rate: ${testResults.successCount}/${testResults.testCount}`);
testResults.results.forEach(result => {
  if (result.success) {
    console.log(`Prompt: ${result.prompt}`);
    console.log(`Response: ${result.response}`);
  }
});
```

## 🎯 Integration with IAPosteManager

### Email Style Learning

```javascript
class EmailStyleTrainer {
  constructor() {
    this.trainingData = [];
    this.currentJob = null;
  }

  // Collecter des exemples d'emails existants
  async collectEmailExamples(emailHistory) {
    const examples = emailHistory
      .filter(email => email.rating >= 4) // Emails bien notés
      .map(email => ({
        prompt: `Écrire un email ${email.category} pour: ${email.context}`,
        completion: `${email.subject}\n\n${email.body}`
      }));

    this.trainingData.push(...examples);
    return examples.length;
  }

  // Entraîner un modèle personnalisé
  async trainPersonalizedModel(userId, companyStyle = 'professional') {
    const modelName = `user-${userId}-${companyStyle}`;
    
    if (this.trainingData.length < 10) {
      throw new Error('Au moins 10 exemples d\'emails sont requis');
    }

    const result = await fineTuningHelpers.createEmailModel(
      this.trainingData,
      'gpt-4o-mini',
      {
        suffix: modelName,
        metadata: {
          user_id: userId.toString(),
          style: companyStyle,
          training_date: new Date().toISOString()
        }
      }
    );

    this.currentJob = result.job;
    return result;
  }

  // Utiliser le modèle personnalisé
  async generatePersonalizedEmail(prompt, modelId) {
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
            content: 'Tu es un assistant qui génère des emails dans le style spécifique de l\'utilisateur.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
```

### Department-Specific Models

```javascript
// Entraîner des modèles par département
const departmentTrainer = {
  async trainDepartmentModel(department, emailExamples) {
    const departmentPrompts = {
      'marketing': 'Tu es un expert en marketing qui crée des emails engageants et persuasifs.',
      'support': 'Tu es un agent de support qui résout les problèmes clients avec empathie.',
      'sales': 'Tu es un commercial qui crée des emails de vente efficaces et professionnels.',
      'hr': 'Tu es un responsable RH qui communique avec tact et professionnalisme.'
    };

    const trainingData = emailExamples.map(example => ({
      messages: [
        {
          role: 'system',
          content: departmentPrompts[department] || departmentPrompts['support']
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

    const result = await fineTuningHelpers.createEmailModel(
      trainingData,
      'gpt-4o-mini',
      {
        suffix: `${department}-emails`,
        metadata: {
          department,
          specialization: 'email_generation'
        }
      }
    );

    return result;
  }
};
```

### Continuous Learning

```javascript
// Apprentissage continu basé sur les retours
class ContinuousLearner {
  constructor() {
    this.feedbackData = [];
    this.retrainingThreshold = 50; // Réentraîner après 50 feedbacks
  }

  // Collecter les retours utilisateur
  collectFeedback(emailId, rating, improvements = '') {
    this.feedbackData.push({
      emailId,
      rating,
      improvements,
      timestamp: new Date().toISOString()
    });

    // Déclencher réentraînement si seuil atteint
    if (this.feedbackData.length >= this.retrainingThreshold) {
      this.triggerRetraining();
    }
  }

  // Créer des données d'amélioration
  createImprovementData() {
    const improvements = this.feedbackData
      .filter(feedback => feedback.rating >= 4 && feedback.improvements)
      .map(feedback => {
        // Récupérer l'email original
        const originalEmail = getEmailById(feedback.emailId);
        
        return {
          input: {
            messages: [
              { role: 'user', content: originalEmail.prompt }
            ]
          },
          preferred_output: [
            { role: 'assistant', content: feedback.improvements }
          ],
          non_preferred_output: [
            { role: 'assistant', content: originalEmail.content }
          ]
        };
      });

    return improvements;
  }

  // Déclencher réentraînement
  async triggerRetraining() {
    const improvementData = this.createImprovementData();
    
    if (improvementData.length < 10) {
      console.log('Pas assez de données d\'amélioration pour réentraîner');
      return;
    }

    const trainingFile = await fineTuningHelpers.createTrainingFile(improvementData);
    const uploadedFile = await fineTuningHelpers.uploadTrainingFile(trainingFile);

    const job = await openaiFineTuningService.jobs.create(
      'gpt-4o-mini',
      uploadedFile.id,
      {
        suffix: `improved-${Date.now()}`,
        method: {
          type: 'dpo',
          dpo: {
            hyperparameters: {
              n_epochs: 1,
              learning_rate_multiplier: 0.05
            }
          }
        }
      }
    );

    console.log('Réentraînement démarré:', job.id);
    this.feedbackData = []; // Reset feedback data
  }
}
```

## 🔧 Backend Integration

Add these endpoints to your Flask backend:

```python
@app.route('/api/fine-tuning/jobs', methods=['POST'])
def create_fine_tuning_job():
    data = request.get_json()
    training_data = data.get('training_data', [])
    model = data.get('model', 'gpt-4o-mini')
    
    try:
        # Validate training data
        if len(training_data) < 10:
            return jsonify({'error': 'Minimum 10 training examples required'}), 400
        
        # Create JSONL file
        jsonl_content = '\n'.join([json.dumps(item) for item in training_data])
        
        # Upload to OpenAI
        files_response = openai.files.create(
            file=io.StringIO(jsonl_content),
            purpose='fine-tune'
        )
        
        # Create fine-tuning job
        job = openai.fine_tuning.jobs.create(
            training_file=files_response.id,
            model=model,
            suffix=data.get('suffix', 'email-model')
        )
        
        return jsonify({
            'success': True,
            'job_id': job.id,
            'status': job.status,
            'training_file': files_response.id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/fine-tuning/jobs/<job_id>', methods=['GET'])
def get_fine_tuning_job(job_id):
    try:
        job = openai.fine_tuning.jobs.retrieve(job_id)
        
        return jsonify({
            'success': True,
            'job': {
                'id': job.id,
                'status': job.status,
                'model': job.model,
                'fine_tuned_model': job.fine_tuned_model,
                'created_at': job.created_at,
                'finished_at': job.finished_at,
                'trained_tokens': job.trained_tokens
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

## 📊 Cost Management

### Training Cost Estimation

```javascript
const costCalculator = {
  // Estimer le coût d'entraînement
  estimateTrainingCost: (trainingData, model = 'gpt-4o-mini') => {
    const tokenCount = trainingData.reduce((total, item) => {
      const text = JSON.stringify(item);
      return total + Math.ceil(text.length / 4); // Approximation
    }, 0);
    
    // Coûts par modèle (exemple)
    const costs = {
      'gpt-4o-mini': 0.0003, // $0.0003 per 1K tokens
      'gpt-4o': 0.008        // $0.008 per 1K tokens
    };
    
    const costPerToken = costs[model] || costs['gpt-4o-mini'];
    const estimatedCost = (tokenCount / 1000) * costPerToken;
    
    return {
      tokenCount,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      model
    };
  },
  
  // Suivre les coûts réels
  trackActualCost: (job) => {
    if (job.trained_tokens) {
      const costPerToken = 0.0003; // Ajuster selon le modèle
      const actualCost = (job.trained_tokens / 1000) * costPerToken;
      
      return {
        trainedTokens: job.trained_tokens,
        actualCost: Math.round(actualCost * 100) / 100
      };
    }
    
    return null;
  }
};
```

## 🛡️ Best Practices

1. **Data Quality**: Use high-quality, diverse training examples
2. **Validation**: Always validate training data before upload
3. **Monitoring**: Track job progress and handle failures
4. **Testing**: Thoroughly test fine-tuned models
5. **Cost Control**: Monitor token usage and costs
6. **Version Control**: Keep track of model versions and performance

## 🎉 Ready for Custom AI!

Your IAPosteManager now has enterprise-grade fine-tuning capabilities to create custom email models tailored to your specific needs!