# 🎯 Graders - Évaluateurs Avancés

## Types de Graders

### String Check Grader

```javascript
import { gradersAPI } from './services/api';

// Comparaison exacte
const exactMatch = gradersAPI.types.stringCheck(
  'Exact Match',
  '{{sample.output_text}}',
  '{{item.expected_output}}',
  'eq' // 'eq', 'ne', 'like', 'ilike'
);

// Tester le grader
const result = await gradersAPI.run(
  exactMatch,
  'Bonjour, comment allez-vous ?',
  { expected_output: 'Bonjour, comment allez-vous ?' }
);

console.log('Score:', result.reward); // 1.0 si identique
```

### Text Similarity Grader

```javascript
// Similarité de texte
const similarity = gradersAPI.types.textSimilarity(
  'Text Similarity',
  '{{sample.output_text}}',
  '{{item.reference_text}}',
  'fuzzy_match' // 'cosine', 'bleu', 'rouge_l', etc.
);

const result = await gradersAPI.run(
  similarity,
  'Email professionnel de remerciement',
  { reference_text: 'Email de remerciement professionnel' }
);

console.log('Similarité:', result.reward); // Score 0-1
```

### Score Model Grader

```javascript
// Notation par modèle IA
const qualityScore = gradersAPI.types.scoreModel(
  'Quality Score',
  [{
    role: 'user',
    content: [{
      type: 'input_text',
      text: 'Rate the quality of this email from 0 to 1:\n\n{{sample.output_text}}'
    }]
  }],
  'gpt-4o'
);

const result = await gradersAPI.run(
  qualityScore,
  'Cher client, merci pour votre commande...'
);

console.log('Qualité:', result.reward);
```

### Label Model Grader

```javascript
// Classification par labels
const toneClassifier = gradersAPI.types.labelModel(
  'Tone Classifier',
  [{
    role: 'developer',
    content: [{
      type: 'input_text',
      text: 'Classify the tone as "professional", "casual", or "inappropriate"'
    }]
  }, {
    role: 'user',
    content: [{
      type: 'input_text',
      text: 'Email: {{sample.output_text}}'
    }]
  }],
  ['professional', 'casual', 'inappropriate'],
  ['professional'], // Labels qui passent
  'gpt-4o'
);
```

## Graders Prédéfinis pour Emails

### Vérification du Ton Professionnel

```javascript
// Utiliser un grader prédéfini
const toneGrader = gradersAPI.emailGraders.professionalTone();

const samples = [
  { modelOutput: 'Cher Monsieur, je vous remercie...' },
  { modelOutput: 'Salut ! Comment ça va ?' }
];

const results = await advancedEvalsAPI.testGrader(toneGrader, samples);

console.log('Résultats:', {
  passed: results.passed,
  failed: results.failed,
  totalSamples: results.totalSamples
});
```

### Vérification de la Grammaire

```javascript
const grammarGrader = gradersAPI.emailGraders.grammarCheck();

const testResults = await advancedEvalsAPI.testGrader(
  grammarGrader,
  [
    { modelOutput: 'Votre commande a été expédiée.' },
    { modelOutput: 'Votre commande a était expédier.' } // Erreurs
  ]
);

console.log('Score grammaire moyen:', 
  testResults.results.reduce((sum, r) => sum + r.reward, 0) / testResults.results.length
);
```

## Exemple Complet - Dashboard de Graders

```javascript
// Composant React pour tester les graders
import { useState } from 'react';
import { gradersAPI, advancedEvalsAPI } from '../services/api';

function GraderTester() {
  const [selectedGrader, setSelectedGrader] = useState('professionalTone');
  const [testText, setTestText] = useState('');
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const availableGraders = {
    professionalTone: 'Ton Professionnel',
    grammarCheck: 'Vérification Grammaire',
    custom: 'Grader Personnalisé'
  };

  const runGraderTest = async () => {
    setIsRunning(true);
    
    try {
      let grader;
      
      switch (selectedGrader) {
        case 'professionalTone':
          grader = gradersAPI.emailGraders.professionalTone();
          break;
        case 'grammarCheck':
          grader = gradersAPI.emailGraders.grammarCheck();
          break;
        case 'custom':
          grader = gradersAPI.types.scoreModel(
            'Custom Quality',
            [{
              role: 'user',
              content: [{
                type: 'input_text',
                text: 'Rate this email quality 0-1: {{sample.output_text}}'
              }]
            }]
          );
          break;
      }

      const result = await gradersAPI.run(grader, testText);
      
      setResults({
        grader: grader.name,
        reward: result.reward,
        metadata: result.metadata,
        passed: result.reward >= 0.5
      });
      
    } catch (error) {
      setResults({
        error: error.message,
        passed: false
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runBatchTest = async () => {
    setIsRunning(true);
    
    try {
      const samples = [
        { modelOutput: 'Cher client, votre commande est prête.' },
        { modelOutput: 'Salut, ton truc est prêt !' },
        { modelOutput: 'Nous vous informons que votre demande...' }
      ];

      const grader = gradersAPI.emailGraders.professionalTone();
      const batchResults = await advancedEvalsAPI.testGrader(grader, samples);
      
      setResults(batchResults);
      
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grader-tester">
      <h2>🎯 Testeur de Graders</h2>
      
      <div className="grader-selection">
        <label>Grader:</label>
        <select 
          value={selectedGrader}
          onChange={(e) => setSelectedGrader(e.target.value)}
        >
          {Object.entries(availableGraders).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="test-input">
        <label>Texte à tester:</label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          rows={4}
          placeholder="Entrez le texte à évaluer..."
        />
      </div>

      <div className="actions">
        <button 
          onClick={runGraderTest}
          disabled={isRunning || !testText.trim()}
        >
          {isRunning ? 'Test...' : 'Tester Grader'}
        </button>
        
        <button 
          onClick={runBatchTest}
          disabled={isRunning}
        >
          {isRunning ? 'Test...' : 'Test par Lot'}
        </button>
      </div>

      {results && (
        <div className="results">
          <h3>Résultats</h3>
          
          {results.error ? (
            <div className="error">
              Erreur: {results.error}
            </div>
          ) : results.totalSamples ? (
            // Résultats par lot
            <div className="batch-results">
              <div className="summary">
                <span>Total: {results.totalSamples}</span>
                <span>Réussis: {results.passed}</span>
                <span>Échoués: {results.totalSamples - results.passed}</span>
              </div>
              
              <div className="individual-results">
                {results.results.map((result, index) => (
                  <div key={index} className={`result ${result.passed ? 'pass' : 'fail'}`}>
                    <div className="sample">"{result.sample}"</div>
                    <div className="score">Score: {result.reward?.toFixed(2) || 'N/A'}</div>
                    <div className="status">{result.passed ? '✅ Réussi' : '❌ Échoué'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Résultat simple
            <div className="single-result">
              <div className="score">
                Score: <strong>{results.reward?.toFixed(2)}</strong>
              </div>
              <div className="status">
                {results.passed ? '✅ Réussi' : '❌ Échoué'}
              </div>
              {results.metadata && (
                <div className="metadata">
                  <p>Temps d'exécution: {results.metadata.execution_time?.toFixed(2)}s</p>
                  <p>Tokens utilisés: {results.metadata.token_usage?.total_tokens}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Graders Personnalisés

### Python Grader

```javascript
// Grader Python pour vérifications complexes
const customPythonGrader = gradersAPI.types.python(
  'Email Length Check',
  `
def grade(sample: dict, item: dict) -> float:
    text = sample.get('output_text', '')
    min_length = item.get('min_length', 50)
    max_length = item.get('max_length', 500)
    
    length = len(text)
    
    if min_length <= length <= max_length:
        return 1.0
    elif length < min_length:
        return max(0.0, (length / min_length) * 0.5)
    else:
        return max(0.0, 1.0 - ((length - max_length) / max_length))
`
);

// Tester avec des paramètres
const result = await gradersAPI.run(
  customPythonGrader,
  'Court email',
  { min_length: 100, max_length: 300 }
);
```

### Multi Grader

```javascript
// Combiner plusieurs graders
const comprehensiveGrader = gradersAPI.types.multi(
  'Comprehensive Email Quality',
  [
    gradersAPI.emailGraders.professionalTone(),
    gradersAPI.emailGraders.grammarCheck(),
    gradersAPI.types.scoreModel(
      'Clarity',
      [{
        role: 'user',
        content: [{
          type: 'input_text',
          text: 'Rate email clarity 0-1: {{sample.output_text}}'
        }]
      }]
    )
  ],
  '(professional_tone_score + grammar_check_score + clarity_score) / 3'
);
```

## Validation de Graders

```javascript
// Valider un grader avant utilisation
const grader = gradersAPI.types.stringCheck(
  'Test Grader',
  '{{sample.output_text}}',
  '{{item.expected}}',
  'eq'
);

try {
  const validation = await gradersAPI.validate(grader);
  console.log('Grader valide:', validation.grader);
} catch (error) {
  console.error('Grader invalide:', error.message);
}
```

## Métriques de Similarité

### Métriques Disponibles

- `cosine` - Similarité cosinus
- `fuzzy_match` - Correspondance floue
- `bleu` - Score BLEU (traduction)
- `rouge_1`, `rouge_2`, `rouge_l` - Scores ROUGE
- `meteor` - Score METEOR
- `gleu` - Score GLEU

```javascript
// Comparer différentes métriques
const metrics = ['cosine', 'fuzzy_match', 'bleu', 'rouge_l'];

for (const metric of metrics) {
  const grader = gradersAPI.types.textSimilarity(
    `Similarity ${metric}`,
    '{{sample.output_text}}',
    '{{item.reference}}',
    metric
  );
  
  const result = await gradersAPI.run(
    grader,
    'Email de confirmation de commande',
    { reference: 'Confirmation de votre commande' }
  );
  
  console.log(`${metric}: ${result.reward.toFixed(3)}`);
}
```

---

**Version** : 2.2  
**Statut** : ✅ Production Ready avec Graders