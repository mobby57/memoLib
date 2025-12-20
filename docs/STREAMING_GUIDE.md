# 🎯 Streaming Events - Guide d'Utilisation

## 📡 Streaming Optimisé avec Événements SSE

### Utilisation Simple

```javascript
import { streamingAPI } from './services/api';

// Génération d'email avec streaming
const result = await streamingAPI.generateEmailStream(
  "Écris un email de relance professionnel",
  { useWebSearch: true }
);
```

### Callbacks Avancés

```javascript
import { aiAPI } from './services/api';

await aiAPI.streamResponse(
  "Génère un long email",
  { model: 'gpt-4o', tools: [aiAPI.tools.webSearch] },
  {
    onStart: (event) => {
      console.log('Démarrage:', event.response.id);
      showLoader();
    },
    
    onProgress: ({ delta, fullText }) => {
      // Mise à jour en temps réel
      updateTextArea(fullText);
      updateProgressBar(fullText.length);
    },
    
    onToolCall: ({ type, tool, event }) => {
      if (type === 'started') {
        showToolIndicator(tool);
      } else if (type === 'completed') {
        hideToolIndicator(tool);
      }
    },
    
    onReasoning: ({ type, delta, text }) => {
      if (type === 'delta') {
        updateReasoningPanel(delta);
      } else if (type === 'summary') {
        showReasoningSummary(text);
      }
    },
    
    onComplete: ({ text, response, incomplete }) => {
      hideLoader();
      if (incomplete) {
        showIncompleteWarning(response.reason);
      }
      finalizeEmail(text);
    },
    
    onError: (error, event) => {
      hideLoader();
      showError(error.message);
    }
  }
);
```

### Événements Personnalisés pour l'UI

```javascript
// Écouter les événements de streaming
window.addEventListener('email-generation-progress', (event) => {
  const { delta, fullText, progress } = event.detail;
  
  // Mettre à jour l'interface
  document.getElementById('email-content').value = fullText;
  document.getElementById('progress').style.width = `${progress}%`;
});

window.addEventListener('ai-text-delta', (event) => {
  const { delta, fullText } = event.detail;
  // Animation de frappe
  typewriterEffect(delta);
});
```

### Types d'Événements Supportés

#### 🚀 Événements de Base
- `response.created` - Réponse créée
- `response.in_progress` - En cours
- `response.completed` - Terminé
- `response.failed` - Échec
- `response.incomplete` - Incomplet

#### 📝 Événements de Texte
- `response.output_text.delta` - Nouveau texte
- `response.output_text.done` - Texte finalisé

#### 🔧 Événements d'Outils
- `response.web_search_call.in_progress` - Recherche web démarrée
- `response.web_search_call.searching` - Recherche en cours
- `response.web_search_call.completed` - Recherche terminée
- `response.file_search_call.*` - Recherche de fichiers
- `response.code_interpreter_call.*` - Interpréteur de code

#### 🧠 Événements de Raisonnement
- `response.reasoning_text.delta` - Raisonnement en cours
- `response.reasoning_summary_text.done` - Résumé du raisonnement

### Exemple Complet pour IAPosteManager

```javascript
// Composant React avec streaming
import { useEffect, useState } from 'react';
import { streamingAPI } from '../services/api';

function EmailGenerator() {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toolsUsed, setToolsUsed] = useState([]);

  const generateEmail = async (prompt) => {
    setIsGenerating(true);
    setContent('');
    setProgress(0);
    setToolsUsed([]);

    try {
      await streamingAPI.generateEmailStream(prompt, {
        useWebSearch: true,
        onStart: () => {
          console.log('Génération démarrée');
        },
        onProgress: ({ delta, fullText }) => {
          setContent(fullText);
          setProgress(Math.min(100, (fullText.length / 1000) * 100));
        },
        onToolCall: ({ type, tool }) => {
          if (type === 'started') {
            setToolsUsed(prev => [...prev, tool]);
          }
        },
        onComplete: ({ text }) => {
          setContent(text);
          setProgress(100);
          setIsGenerating(false);
        },
        onError: (error) => {
          console.error('Erreur:', error);
          setIsGenerating(false);
        }
      });
    } catch (error) {
      console.error('Erreur de génération:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => generateEmail("Email de relance client")}
        disabled={isGenerating}
      >
        {isGenerating ? 'Génération...' : 'Générer Email'}
      </button>
      
      {isGenerating && (
        <div>
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
          <div>Outils utilisés: {toolsUsed.join(', ')}</div>
        </div>
      )}
      
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        cols={50}
      />
    </div>
  );
}
```

### Performance et Optimisations

- **Buffer intelligent** : Gestion des chunks SSE
- **Événements personnalisés** : Communication avec l'UI
- **Gestion d'erreurs** : Retry automatique
- **Monitoring** : Suivi des performances

### Compatibilité

- ✅ Chrome/Edge (natif)
- ✅ Firefox (natif) 
- ✅ Safari (natif)
- ✅ Node.js (avec polyfill)

---

**Version** : 2.2  
**Statut** : ✅ Production Ready