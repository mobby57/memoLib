# 📊 Evals - Évaluation des Performances IA

## Évaluation des Modèles

### Créer une Évaluation Simple

```javascript
import { evalsAPI } from './services/api';

// Configuration de la source de données
const dataSourceConfig = {
  type: 'custom',
  schema: {
    type: 'object',
    properties: {
      item: {
        type: 'object',
        properties: {
          input: { type: 'string' },
          expected_output: { type: 'string' }
        },
        required: ['input', 'expected_output']
      }
    },
    required: ['item']
  }
};

// Critères de test
const testingCriteria = [
  {
    type: 'string_check',
    name: 'Exact Match',
    input: '{{sample.output_text}}',
    reference: '{{item.expected_output}}',
    operation: 'eq'
  }
];

// Créer l'évaluation
const eval_ = await evalsAPI.create(
  'Test Email Generation',
  dataSourceConfig,
  testingCriteria,
  { description: 'Test de génération d\'emails' }
);
```

### Exécuter une Évaluation

```javascript
// Données de test
const testData = [
  {
    item: {
      input: 'Écris un email de remerciement client',
      expected_output: 'professional'
    }
  },
  {
    item: {
      input: 'Email de relance commercial',
      expected_output: 'persuasive'
    }
  }
];

// Source de données pour l'exécution
const dataSource = {
  type: 'completions',
  source: {
    type: 'file_content',
    content: testData
  },
  input_messages: {
    type: 'template',
    template: [
      {
        role: 'developer',
        content: 'Tu es un assistant email professionnel.'
      },
      {
        role: 'user',
        content: '{{item.input}}'
      }
    ]
  },
  model: 'gpt-4o',
  sampling_params: {
    temperature: 0.7,
    max_completions_tokens: 1000
  }
};

// Lancer l'exécution
const run = await evalsAPI.runs.create(eval_.id, dataSource, {
  name: 'Test Run 1'
});

console.log('Run ID:', run.id);
console.log('Status:', run.status);
```

## Service Email Evals

### Évaluation Automatique des Emails

```javascript
import { emailEvalsAPI } from './services/api';

// Tester la qualité des emails
const emailPrompts = [
  {
    prompt: 'Email de bienvenue nouveau client',
    expected_tone: 'friendly',
    expected_length: 200
  },
  {
    prompt: 'Email de relance facture impayée',
    expected_tone: 'professional',
    expected_length: 150
  }
];

const results = await emailEvalsAPI.evaluateEmailQuality(
  emailPrompts,
  {
    checkTone: true,
    checkLength: true,
    checkProfessionalism: true,
    expectedTone: 'professional'
  }
);

console.log('Résultats:', {
  successRate: results.successRate,
  totalTests: results.totalTests,
  passed: results.passed,
  failed: results.failed
});
```

### Comparaison de Modèles

```javascript
// Comparer GPT-4o vs GPT-4o-mini
const comparison = await emailEvalsAPI.compareModels(
  emailPrompts,
  'gpt-4o',
  'gpt-4o-mini'
);

console.log('Comparaison:', {
  winner: comparison.comparison.winner,
  difference: comparison.comparison.difference,
  'gpt-4o': comparison['gpt-4o'].successRate,
  'gpt-4o-mini': comparison['gpt-4o-mini'].successRate
});
```

## Exemple Complet - Dashboard d'Évaluation

```javascript
// Composant React pour dashboard d'évaluation
import { useState, useEffect } from 'react';
import { evalsAPI, emailEvalsAPI } from '../services/api';

function EvalDashboard() {
  const [evals, setEvals] = useState([]);
  const [currentRun, setCurrentRun] = useState(null);
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadEvals();
  }, []);

  const loadEvals = async () => {
    try {
      const response = await evalsAPI.list({ limit: 10 });
      setEvals(response.data);
    } catch (error) {
      console.error('Erreur chargement evals:', error);
    }
  };

  const runEmailEval = async () => {
    setIsRunning(true);
    
    try {
      const testEmails = [
        {
          prompt: 'Email de confirmation commande',
          expected_tone: 'professional',
          expected_length: 200
        },
        {
          prompt: 'Email de promotion produit',
          expected_tone: 'persuasive',
          expected_length: 300
        }
      ];

      const evalResults = await emailEvalsAPI.evaluateEmailQuality(
        testEmails,
        { expectedTone: 'professional' }
      );

      setResults(evalResults);
    } catch (error) {
      console.error('Erreur évaluation:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const compareModels = async () => {
    setIsRunning(true);
    
    try {
      const testPrompts = [
        { prompt: 'Email service client', expected_tone: 'helpful' },
        { prompt: 'Email marketing', expected_tone: 'engaging' }
      ];

      const comparison = await emailEvalsAPI.compareModels(
        testPrompts,
        'gpt-4o',
        'gpt-4o-mini'
      );

      setResults(comparison);
    } catch (error) {
      console.error('Erreur comparaison:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="eval-dashboard">
      <h2>📊 Dashboard d'Évaluation IA</h2>
      
      <div className="eval-actions">
        <button 
          onClick={runEmailEval}
          disabled={isRunning}
        >
          {isRunning ? 'Évaluation...' : 'Tester Qualité Emails'}
        </button>
        
        <button 
          onClick={compareModels}
          disabled={isRunning}
        >
          {isRunning ? 'Comparaison...' : 'Comparer Modèles'}
        </button>
      </div>

      {results && (
        <div className="results-section">
          <h3>Résultats</h3>
          
          {results.successRate !== undefined ? (
            // Résultats d'évaluation simple
            <div className="eval-results">
              <div className="metric">
                <span>Taux de Réussite:</span>
                <strong>{results.successRate.toFixed(1)}%</strong>
              </div>
              <div className="metric">
                <span>Tests Passés:</span>
                <strong>{results.passed}/{results.totalTests}</strong>
              </div>
              <div className="metric">
                <span>Tests Échoués:</span>
                <strong>{results.failed}</strong>
              </div>
            </div>
          ) : (
            // Résultats de comparaison
            <div className="comparison-results">
              <div className="winner">
                <h4>🏆 Gagnant: {results.comparison.winner}</h4>
                <p>Différence: {results.comparison.difference.toFixed(1)}%</p>
              </div>
              
              <div className="model-scores">
                <div className="model-score">
                  <h5>GPT-4o</h5>
                  <span>{results['gpt-4o']?.successRate.toFixed(1)}%</span>
                </div>
                <div className="model-score">
                  <h5>GPT-4o-mini</h5>
                  <span>{results['gpt-4o-mini']?.successRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="evals-list">
        <h3>Évaluations Existantes</h3>
        {evals.map(eval_ => (
          <div key={eval_.id} className="eval-item">
            <h4>{eval_.name}</h4>
            <p>Créé: {new Date(eval_.created_at * 1000).toLocaleDateString()}</p>
            <button onClick={() => viewEvalDetails(eval_.id)}>
              Voir Détails
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Évaluation Continue

### Configuration d'Évaluation Automatique

```javascript
// Configurer une évaluation continue
const continuousEval = await emailEvalsAPI.setupContinuousEval({
  name: 'Email Quality Monitor',
  testData: [
    { prompt: 'Email standard', expected_tone: 'professional' },
    { prompt: 'Email urgent', expected_tone: 'urgent' }
  ],
  interval: 3600000, // 1 heure
  minSuccessRate: 85 // Alerter si < 85%
});

// Écouter les résultats
window.addEventListener('email-eval-completed', (event) => {
  const { results } = event.detail;
  console.log('Évaluation automatique:', results.successRate);
  
  // Mettre à jour le dashboard
  updateQualityMetrics(results);
});

// Écouter les alertes qualité
window.addEventListener('email-quality-alert', (event) => {
  const { message, results } = event.detail;
  
  // Afficher notification
  showNotification({
    type: 'warning',
    title: 'Alerte Qualité',
    message: message
  });
  
  // Envoyer alerte par email
  emailAPI.send({
    to: 'admin@company.com',
    subject: 'Alerte Qualité IA',
    text: `La qualité des emails générés a chuté: ${message}`
  });
});
```

## Types d'Évaluateurs

### String Check
```javascript
{
  type: 'string_check',
  name: 'Exact Match',
  input: '{{sample.output_text}}',
  reference: '{{item.expected}}',
  operation: 'eq' // 'eq', 'contains', 'starts_with', 'ends_with'
}
```

### Label Model
```javascript
{
  type: 'label_model',
  model: 'gpt-4o',
  name: 'Quality Grader',
  input: [
    {
      role: 'developer',
      content: 'Rate this email as "good" or "poor"'
    },
    {
      role: 'user',
      content: 'Email: {{sample.output_text}}'
    }
  ],
  passing_labels: ['good'],
  labels: ['good', 'poor']
}
```

## Analyse des Résultats

```javascript
// Analyser les résultats détaillés
const analyzeEvalResults = async (evalId, runId) => {
  const outputItems = await evalsAPI.runs.getOutputItems(evalId, runId);
  
  const analysis = {
    totalItems: outputItems.data.length,
    passedItems: outputItems.data.filter(item => item.status === 'pass'),
    failedItems: outputItems.data.filter(item => item.status === 'fail'),
    averageScore: 0,
    commonFailures: []
  };
  
  // Calculer le score moyen
  const scores = outputItems.data.map(item => 
    item.results.reduce((sum, result) => sum + result.score, 0) / item.results.length
  );
  analysis.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Identifier les échecs communs
  const failureReasons = analysis.failedItems.map(item => 
    item.results.filter(result => !result.passed).map(result => result.name)
  ).flat();
  
  analysis.commonFailures = [...new Set(failureReasons)];
  
  return analysis;
};
```

## Bonnes Pratiques

### 1. Tests Représentatifs
```javascript
// Créer des tests qui couvrent tous les cas d'usage
const comprehensiveTests = [
  { type: 'welcome', tone: 'friendly', length: 'short' },
  { type: 'reminder', tone: 'professional', length: 'medium' },
  { type: 'complaint', tone: 'empathetic', length: 'long' },
  { type: 'promotion', tone: 'persuasive', length: 'medium' }
];
```

### 2. Métriques Multiples
```javascript
const multiMetricEval = {
  criteria: [
    'tone_accuracy',
    'length_appropriateness', 
    'grammar_correctness',
    'professional_language',
    'call_to_action_presence'
  ]
};
```

### 3. Monitoring Continu
```javascript
// Surveiller la dérive des performances
const monitorPerformanceDrift = async () => {
  const recentRuns = await evalsAPI.runs.list(evalId, { 
    limit: 10, 
    order: 'desc' 
  });
  
  const successRates = recentRuns.data.map(run => 
    (run.result_counts.passed / run.result_counts.total) * 100
  );
  
  const trend = calculateTrend(successRates);
  
  if (trend < -5) { // Baisse de 5%
    alertPerformanceDrift(trend);
  }
};
```

---

**Version** : 2.2  
**Statut** : ✅ Production Ready avec Evals