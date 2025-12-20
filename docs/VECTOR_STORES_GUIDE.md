# 🔍 Vector Stores API - Guide de Recherche Sémantique

## Vue d'ensemble

Les Vector Stores permettent la recherche sémantique avancée pour l'API Retrieval et l'outil file_search dans les APIs Responses et Assistants.

## Caractéristiques

- **Recherche sémantique**: Recherche basée sur le sens, pas seulement les mots-clés
- **Chunking automatique**: Découpage intelligent des documents
- **Filtres avancés**: Recherche par attributs de fichiers
- **Expiration configurable**: Gestion automatique du cycle de vie
- **Métadonnées**: 16 paires clé-valeur personnalisées

## API Service

### 1. Créer un Vector Store

```javascript
import { vectorStoresAPI } from '@/services/api';

const vectorStore = await vectorStoresAPI.create('Support FAQ', {
  description: 'Base de connaissances FAQ',
  file_ids: ['file-abc123', 'file-def456'],
  chunking_strategy: {
    type: 'auto'
  },
  expires_after: {
    anchor: 'last_active_at',
    days: 30
  },
  metadata: {
    department: 'support',
    version: '1.0'
  }
});

console.log(vectorStore.id); // vs_abc123
```

### 2. Lister les Vector Stores

```javascript
const stores = await vectorStoresAPI.list({
  limit: 20,
  order: 'desc'
});

stores.data.forEach(store => {
  console.log(`${store.name}: ${store.file_counts.completed} files`);
});
```

### 3. Rechercher dans un Vector Store

```javascript
const results = await vectorStoresAPI.search('vs_abc123', 'politique de retour', {
  max_num_results: 5,
  rewrite_query: true,
  filters: {
    file_attributes: {
      department: 'support'
    }
  }
});

results.data.forEach(result => {
  console.log(`Score: ${result.score}`);
  console.log(`Content: ${result.content[0].text}`);
});
```

### 4. Mettre à jour un Vector Store

```javascript
await vectorStoresAPI.update('vs_abc123', {
  name: 'Support FAQ v2',
  metadata: {
    updated_at: new Date().toISOString()
  }
});
```

### 5. Supprimer un Vector Store

```javascript
const deleted = await vectorStoresAPI.delete('vs_abc123');
console.log(deleted.deleted); // true
```

## Utilitaires IAPosteManager

### 1. Base de Connaissances Email

```javascript
// Créer une base de connaissances pour emails
const emailKB = await vectorStoresAPI.createEmailKnowledgeBase(
  'Templates Email Pro',
  ['file-template1', 'file-template2', 'file-examples']
);

console.log('Knowledge base created:', emailKB.id);
```

### 2. Recherche de Templates

```javascript
// Rechercher des templates similaires
const templates = await vectorStoresAPI.searchEmailTemplates(
  emailKB.id,
  'email de relance commercial'
);

templates.data.forEach(template => {
  console.log(`Template: ${template.filename} (${template.score})`);
  console.log(`Content: ${template.content[0].text.substring(0, 200)}...`);
});
```

### 3. Attendre la Complétion

```javascript
// Attendre que le vector store soit prêt
const completedStore = await vectorStoresAPI.waitForCompletion('vs_abc123');
console.log(`Status: ${completedStore.status}`);
console.log(`Files processed: ${completedStore.file_counts.completed}`);
```

## Exemples d'Utilisation

### 1. Système de Recommandation d'Emails

```javascript
class EmailRecommendationSystem {
  constructor(vectorStoreId) {
    this.vectorStoreId = vectorStoreId;
  }

  async findSimilarEmails(emailContent, maxResults = 3) {
    const results = await vectorStoresAPI.search(
      this.vectorStoreId,
      emailContent,
      {
        max_num_results: maxResults,
        rewrite_query: true,
        ranking_options: {
          score_threshold: 0.7
        }
      }
    );

    return results.data.map(result => ({
      similarity: result.score,
      template: result.content[0].text,
      metadata: result.attributes
    }));
  }

  async improveEmail(originalEmail) {
    const similar = await this.findSimilarEmails(originalEmail);
    
    if (similar.length === 0) {
      return { improved: originalEmail, suggestions: [] };
    }

    const bestMatch = similar[0];
    const suggestions = [
      `Similarité trouvée: ${(bestMatch.similarity * 100).toFixed(1)}%`,
      'Template recommandé disponible',
      'Considérez cette structure pour améliorer votre email'
    ];

    return {
      improved: originalEmail,
      suggestions,
      recommendedTemplate: bestMatch.template
    };
  }
}

// Utilisation
const recommender = new EmailRecommendationSystem('vs_email_templates');
const improved = await recommender.improveEmail('Bonjour, je souhaite...');
```

### 2. Assistant de Rédaction Contextuel

```javascript
class ContextualWritingAssistant {
  constructor() {
    this.knowledgeBases = new Map();
  }

  async addKnowledgeBase(name, files, metadata = {}) {
    const vectorStore = await vectorStoresAPI.create(name, {
      description: `Knowledge base: ${name}`,
      file_ids: files,
      metadata: {
        ...metadata,
        created_by: 'writing_assistant'
      }
    });

    await vectorStoresAPI.waitForCompletion(vectorStore.id);
    this.knowledgeBases.set(name, vectorStore.id);
    
    return vectorStore.id;
  }

  async getContextualSuggestions(query, domain = 'general') {
    const vectorStoreId = this.knowledgeBases.get(domain);
    if (!vectorStoreId) {
      throw new Error(`Knowledge base '${domain}' not found`);
    }

    const results = await vectorStoresAPI.search(vectorStoreId, query, {
      max_num_results: 5,
      rewrite_query: true
    });

    return results.data.map(result => ({
      relevance: result.score,
      suggestion: result.content[0].text,
      source: result.filename,
      context: result.attributes
    }));
  }

  async enhanceEmailWithContext(emailDraft, domain = 'business') {
    const suggestions = await this.getContextualSuggestions(emailDraft, domain);
    
    const contextualInfo = suggestions
      .filter(s => s.relevance > 0.8)
      .map(s => s.suggestion)
      .join('\\n\\n');

    return {
      originalDraft: emailDraft,
      contextualInfo,
      suggestions: suggestions.slice(0, 3),
      enhancedVersion: `${emailDraft}\\n\\n--- Informations contextuelles ---\\n${contextualInfo}`
    };
  }
}

// Utilisation
const assistant = new ContextualWritingAssistant();

// Ajouter des bases de connaissances
await assistant.addKnowledgeBase('business', ['file-business-templates']);
await assistant.addKnowledgeBase('support', ['file-support-docs']);

// Améliorer un email
const enhanced = await assistant.enhanceEmailWithContext(
  'Je vous écris concernant votre demande...',
  'support'
);
```

### 3. Système de FAQ Intelligent

```javascript
class IntelligentFAQ {
  constructor(vectorStoreId) {
    this.vectorStoreId = vectorStoreId;
    this.cache = new Map();
  }

  async findAnswer(question) {
    // Vérifier le cache
    const cacheKey = question.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const results = await vectorStoresAPI.search(
      this.vectorStoreId,
      question,
      {
        max_num_results: 3,
        rewrite_query: true,
        ranking_options: {
          score_threshold: 0.6
        }
      }
    );

    if (results.data.length === 0) {
      return {
        found: false,
        message: 'Aucune réponse trouvée pour cette question'
      };
    }

    const bestAnswer = results.data[0];
    const answer = {
      found: true,
      answer: bestAnswer.content[0].text,
      confidence: bestAnswer.score,
      source: bestAnswer.filename,
      alternatives: results.data.slice(1).map(r => ({
        answer: r.content[0].text,
        confidence: r.score
      }))
    };

    // Mettre en cache
    this.cache.set(cacheKey, answer);
    
    return answer;
  }

  async suggestRelatedQuestions(question) {
    const results = await vectorStoresAPI.search(
      this.vectorStoreId,
      question,
      {
        max_num_results: 10,
        rewrite_query: false
      }
    );

    // Extraire les questions similaires
    const relatedQuestions = results.data
      .filter(r => r.score > 0.5 && r.score < 0.9) // Similaires mais pas identiques
      .map(r => {
        // Extraire la question du contenu (supposons format Q: ... A: ...)
        const match = r.content[0].text.match(/Q:\\s*(.+?)\\s*A:/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
      .slice(0, 5);

    return relatedQuestions;
  }

  async getStatistics() {
    const store = await vectorStoresAPI.get(this.vectorStoreId);
    
    return {
      totalFiles: store.file_counts.total,
      processedFiles: store.file_counts.completed,
      failedFiles: store.file_counts.failed,
      storageUsed: `${(store.usage_bytes / 1024 / 1024).toFixed(2)} MB`,
      lastActive: new Date(store.last_active_at * 1000).toLocaleString(),
      cacheSize: this.cache.size
    };
  }
}

// Utilisation
const faq = new IntelligentFAQ('vs_support_faq');

// Rechercher une réponse
const answer = await faq.findAnswer('Comment puis-je annuler ma commande?');
if (answer.found) {
  console.log(`Réponse (${(answer.confidence * 100).toFixed(1)}%): ${answer.answer}`);
  
  // Suggérer des questions liées
  const related = await faq.suggestRelatedQuestions('annuler commande');
  console.log('Questions liées:', related);
}
```

## Composant React Complet

```jsx
import React, { useState, useEffect } from 'react';
import { vectorStoresAPI } from '@/services/api';

function VectorStoreManager() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVectorStores();
  }, []);

  const loadVectorStores = async () => {
    try {
      const response = await vectorStoresAPI.list({ limit: 50 });
      setStores(response.data);
    } catch (error) {
      console.error('Failed to load vector stores:', error);
    }
  };

  const handleSearch = async () => {
    if (!selectedStore || !searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await vectorStoresAPI.search(
        selectedStore.id,
        searchQuery,
        {
          max_num_results: 10,
          rewrite_query: true
        }
      );
      setSearchResults(results.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewStore = async () => {
    const name = prompt('Nom du nouveau vector store:');
    if (!name) return;

    try {
      const newStore = await vectorStoresAPI.create(name, {
        description: 'Créé depuis l\\'interface',
        metadata: {
          created_via: 'ui',
          created_at: new Date().toISOString()
        }
      });
      
      setStores(prev => [newStore, ...prev]);
    } catch (error) {
      console.error('Failed to create vector store:', error);
    }
  };

  const deleteStore = async (storeId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce vector store?')) return;

    try {
      await vectorStoresAPI.delete(storeId);
      setStores(prev => prev.filter(s => s.id !== storeId));
      if (selectedStore?.id === storeId) {
        setSelectedStore(null);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to delete vector store:', error);
    }
  };

  return (
    <div className="vector-store-manager">
      <div className="header">
        <h2>🔍 Vector Stores Manager</h2>
        <button onClick={createNewStore} className="btn-primary">
          Nouveau Vector Store
        </button>
      </div>

      <div className="content">
        <div className="sidebar">
          <h3>Vector Stores ({stores.length})</h3>
          <div className="store-list">
            {stores.map(store => (
              <div
                key={store.id}
                className={`store-item ${selectedStore?.id === store.id ? 'selected' : ''}`}
                onClick={() => setSelectedStore(store)}
              >
                <div className="store-name">{store.name}</div>
                <div className="store-info">
                  <span className={`status ${store.status}`}>{store.status}</span>
                  <span className="file-count">
                    {store.file_counts.completed}/{store.file_counts.total} files
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStore(store.id);
                  }}
                  className="delete-btn"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="main-content">
          {selectedStore ? (
            <>
              <div className="store-details">
                <h3>{selectedStore.name}</h3>
                <p>{selectedStore.description}</p>
                <div className="stats">
                  <span>Status: <strong>{selectedStore.status}</strong></span>
                  <span>Files: <strong>{selectedStore.file_counts.completed}</strong></span>
                  <span>Size: <strong>{(selectedStore.usage_bytes / 1024 / 1024).toFixed(2)} MB</strong></span>
                </div>
              </div>

              <div className="search-section">
                <div className="search-input">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher dans le vector store..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button onClick={handleSearch} disabled={loading}>
                    {loading ? '🔄' : '🔍'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    <h4>Résultats ({searchResults.length})</h4>
                    {searchResults.map((result, idx) => (
                      <div key={idx} className="result-item">
                        <div className="result-header">
                          <span className="filename">{result.filename}</span>
                          <span className="score">
                            {(result.score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="result-content">
                          {result.content[0].text.substring(0, 300)}
                          {result.content[0].text.length > 300 && '...'}
                        </div>
                        {result.attributes && (
                          <div className="result-attributes">
                            {Object.entries(result.attributes).map(([key, value]) => (
                              <span key={key} className="attribute">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Sélectionnez un vector store pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VectorStoreManager;
```

## Stratégies de Chunking

### 1. Auto (Recommandé)
```javascript
const vectorStore = await vectorStoresAPI.create('Documents', {
  chunking_strategy: {
    type: 'auto'
  }
});
```

### 2. Static (Taille fixe)
```javascript
const vectorStore = await vectorStoresAPI.create('Documents', {
  chunking_strategy: {
    type: 'static',
    static: {
      max_chunk_size_tokens: 800,
      chunk_overlap_tokens: 400
    }
  }
});
```

## Filtres de Recherche

### 1. Par Attributs de Fichier
```javascript
const results = await vectorStoresAPI.search('vs_abc123', 'query', {
  filters: {
    file_attributes: {
      department: 'support',
      language: 'fr',
      type: 'faq'
    }
  }
});
```

### 2. Par Métadonnées
```javascript
const results = await vectorStoresAPI.search('vs_abc123', 'query', {
  filters: {
    metadata: {
      category: 'technical',
      priority: 'high'
    }
  }
});
```

## Bonnes Pratiques

### 1. Nommage et Organisation
```javascript
// Noms descriptifs
const emailTemplates = await vectorStoresAPI.create('Email_Templates_2024', {
  description: 'Templates d\\'emails professionnels mis à jour en 2024',
  metadata: {
    version: '2024.1',
    department: 'marketing',
    language: 'fr'
  }
});
```

### 2. Gestion de l'Expiration
```javascript
// Expiration basée sur la dernière activité
const vectorStore = await vectorStoresAPI.create('Temporary_Analysis', {
  expires_after: {
    anchor: 'last_active_at',
    days: 7
  }
});
```

### 3. Monitoring et Maintenance
```javascript
async function monitorVectorStores() {
  const stores = await vectorStoresAPI.list({ limit: 100 });
  
  for (const store of stores.data) {
    if (store.status === 'failed') {
      console.error(`Vector store ${store.name} failed processing`);
    }
    
    if (store.file_counts.failed > 0) {
      console.warn(`${store.file_counts.failed} files failed in ${store.name}`);
    }
    
    // Nettoyer les stores expirés
    if (store.expires_at && store.expires_at < Date.now() / 1000) {
      await vectorStoresAPI.delete(store.id);
      console.log(`Deleted expired vector store: ${store.name}`);
    }
  }
}

// Exécuter toutes les heures
setInterval(monitorVectorStores, 3600000);
```

---

**🎉 Vector Stores API intégré avec succès!**

*Recherche sémantique avancée pour IAPosteManager*