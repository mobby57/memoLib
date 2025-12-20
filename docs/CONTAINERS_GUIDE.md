# 🐳 Containers API - Guide Code Interpreter

## Vue d'ensemble

L'API Containers permet de créer et gérer des conteneurs pour l'outil Code Interpreter, offrant un environnement d'exécution isolé pour l'analyse de données et le traitement de fichiers.

## Caractéristiques

- **Environnement isolé**: Conteneurs sécurisés pour l'exécution de code
- **Gestion mémoire**: Limites configurables (1g à 4g)
- **Expiration automatique**: Nettoyage automatique des ressources
- **Intégration fichiers**: Copie automatique de fichiers dans le conteneur
- **Statut temps réel**: Monitoring de l'état des conteneurs

## API Service

### 1. Créer un Conteneur

```javascript
import { containersAPI } from '@/services/api';

const container = await containersAPI.create('Email Analysis', {
  memory_limit: '2g',
  file_ids: ['file-abc123', 'file-def456'],
  expires_after: {
    anchor: 'last_active_at',
    minutes: 30
  }
});

console.log(container.id); // cntr_abc123
console.log(container.status); // running
```

### 2. Lister les Conteneurs

```javascript
const containers = await containersAPI.list({
  limit: 20,
  order: 'desc'
});

containers.data.forEach(container => {
  console.log(`${container.name}: ${container.status} (${container.memory_limit})`);
});
```

### 3. Récupérer un Conteneur

```javascript
const container = await containersAPI.get('cntr_abc123');
console.log(`Status: ${container.status}`);
console.log(`Memory: ${container.memory_limit}`);
console.log(`Last active: ${new Date(container.last_active_at * 1000)}`);
```

### 4. Supprimer un Conteneur

```javascript
const deleted = await containersAPI.delete('cntr_abc123');
console.log(deleted.deleted); // true
```

## Utilitaires IAPosteManager

### 1. Conteneur d'Analyse Email

```javascript
// Créer un conteneur spécialisé pour l'analyse d'emails
const emailContainer = await containersAPI.createEmailAnalysisContainer([
  'file-email-data',
  'file-templates'
]);

console.log('Email analysis container ready:', emailContainer.id);
```

### 2. Attendre la Disponibilité

```javascript
// Attendre que le conteneur soit prêt
const readyContainer = await containersAPI.waitForReady('cntr_abc123');
console.log(`Container ${readyContainer.name} is ready!`);
```

## Exemples d'Utilisation

### 1. Analyseur de Performance Email

```javascript
class EmailPerformanceAnalyzer {
  constructor() {
    this.containerId = null;
  }

  async initialize(emailDataFiles) {
    // Créer un conteneur avec plus de mémoire pour l'analyse
    const container = await containersAPI.create('Email Performance Analyzer', {
      memory_limit: '4g',
      file_ids: emailDataFiles,
      expires_after: {
        anchor: 'last_active_at',
        minutes: 60
      }
    });

    // Attendre que le conteneur soit prêt
    await containersAPI.waitForReady(container.id);
    this.containerId = container.id;
    
    return container;
  }

  async analyzeEmailMetrics(emailData) {
    if (!this.containerId) {
      throw new Error('Analyzer not initialized');
    }

    // Utiliser le conteneur avec Code Interpreter
    const analysis = await aiAPI.createResponse(
      `Analysez les métriques de performance de ces emails: ${JSON.stringify(emailData)}`,
      {
        tools: [{
          type: 'code_interpreter',
          container_id: this.containerId
        }]
      }
    );

    return analysis;
  }

  async generateReport(analysisResults) {
    const report = await aiAPI.createResponse(
      `Générez un rapport détaillé basé sur cette analyse: ${JSON.stringify(analysisResults)}`,
      {
        tools: [{
          type: 'code_interpreter',
          container_id: this.containerId
        }]
      }
    );

    return report;
  }

  async cleanup() {
    if (this.containerId) {
      await containersAPI.delete(this.containerId);
      this.containerId = null;
    }
  }
}

// Utilisation
const analyzer = new EmailPerformanceAnalyzer();
await analyzer.initialize(['file-email-metrics', 'file-campaign-data']);

const metrics = await analyzer.analyzeEmailMetrics({
  open_rates: [0.25, 0.30, 0.28],
  click_rates: [0.05, 0.07, 0.06],
  conversion_rates: [0.02, 0.03, 0.025]
});

const report = await analyzer.generateReport(metrics);
await analyzer.cleanup();
```

### 2. Générateur de Graphiques Email

```javascript
class EmailChartGenerator {
  constructor() {
    this.containers = new Map();
  }

  async createChartContainer(userId) {
    const container = await containersAPI.create(`Charts-${userId}`, {
      memory_limit: '2g',
      expires_after: {
        anchor: 'last_active_at',
        minutes: 45
      }
    });

    await containersAPI.waitForReady(container.id);
    this.containers.set(userId, container.id);
    
    return container.id;
  }

  async generateEmailChart(userId, chartType, data) {
    let containerId = this.containers.get(userId);
    
    if (!containerId) {
      containerId = await this.createChartContainer(userId);
    }

    const chartCode = this.getChartCode(chartType, data);
    
    const result = await aiAPI.createResponse(
      `Exécutez ce code Python pour générer un graphique: ${chartCode}`,
      {
        tools: [{
          type: 'code_interpreter',
          container_id: containerId
        }]
      }
    );

    return result;
  }

  getChartCode(chartType, data) {
    const baseCode = `
import matplotlib.pyplot as plt
import pandas as pd
import json

# Données
data = json.loads('${JSON.stringify(data)}')
df = pd.DataFrame(data)
`;

    switch (chartType) {
      case 'line':
        return baseCode + `
plt.figure(figsize=(10, 6))
plt.plot(df['dates'], df['values'])
plt.title('Évolution des Métriques Email')
plt.xlabel('Date')
plt.ylabel('Valeur')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('email_metrics.png', dpi=300, bbox_inches='tight')
plt.show()
`;

      case 'bar':
        return baseCode + `
plt.figure(figsize=(10, 6))
plt.bar(df['categories'], df['values'])
plt.title('Performance par Catégorie')
plt.xlabel('Catégorie')
plt.ylabel('Performance')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('email_performance.png', dpi=300, bbox_inches='tight')
plt.show()
`;

      case 'pie':
        return baseCode + `
plt.figure(figsize=(8, 8))
plt.pie(df['values'], labels=df['labels'], autopct='%1.1f%%')
plt.title('Répartition des Résultats Email')
plt.axis('equal')
plt.savefig('email_distribution.png', dpi=300, bbox_inches='tight')
plt.show()
`;

      default:
        return baseCode + `
print("Type de graphique non supporté")
`;
    }
  }

  async cleanupUserContainer(userId) {
    const containerId = this.containers.get(userId);
    if (containerId) {
      await containersAPI.delete(containerId);
      this.containers.delete(userId);
    }
  }

  async cleanupAllContainers() {
    for (const [userId, containerId] of this.containers) {
      try {
        await containersAPI.delete(containerId);
      } catch (error) {
        console.error(`Failed to cleanup container for user ${userId}:`, error);
      }
    }
    this.containers.clear();
  }
}

// Utilisation
const chartGen = new EmailChartGenerator();

// Générer un graphique linéaire
const lineChart = await chartGen.generateEmailChart('user123', 'line', {
  dates: ['2024-01', '2024-02', '2024-03'],
  values: [25, 30, 28]
});

// Générer un graphique en barres
const barChart = await chartGen.generateEmailChart('user123', 'bar', {
  categories: ['Newsletter', 'Promo', 'Transactionnel'],
  values: [45, 32, 67]
});
```

### 3. Processeur de Données Email

```javascript
class EmailDataProcessor {
  async processEmailCampaignData(campaignFiles) {
    // Créer un conteneur avec beaucoup de mémoire
    const container = await containersAPI.create('Campaign Data Processor', {
      memory_limit: '4g',
      file_ids: campaignFiles,
      expires_after: {
        anchor: 'created_at',
        minutes: 120 // 2 heures pour les gros traitements
      }
    });

    await containersAPI.waitForReady(container.id);

    try {
      // Traitement des données
      const processing = await aiAPI.createResponse(
        `Analysez les fichiers de campagne email et générez un rapport complet avec:
        1. Statistiques de performance
        2. Segmentation des audiences
        3. Recommandations d'optimisation
        4. Graphiques de tendances`,
        {
          tools: [{
            type: 'code_interpreter',
            container_id: container.id
          }]
        }
      );

      return processing;
    } finally {
      // Nettoyer le conteneur
      await containersAPI.delete(container.id);
    }
  }

  async validateEmailList(emailListFile) {
    const container = await containersAPI.create('Email List Validator', {
      memory_limit: '1g',
      file_ids: [emailListFile],
      expires_after: {
        anchor: 'last_active_at',
        minutes: 30
      }
    });

    await containersAPI.waitForReady(container.id);

    try {
      const validation = await aiAPI.createResponse(
        `Validez cette liste d'emails et générez un rapport avec:
        1. Emails valides/invalides
        2. Domaines suspects
        3. Doublons détectés
        4. Recommandations de nettoyage`,
        {
          tools: [{
            type: 'code_interpreter',
            container_id: container.id
          }]
        }
      );

      return validation;
    } finally {
      await containersAPI.delete(container.id);
    }
  }
}

// Utilisation
const processor = new EmailDataProcessor();

// Traiter les données de campagne
const campaignAnalysis = await processor.processEmailCampaignData([
  'file-campaign-metrics',
  'file-audience-data',
  'file-engagement-stats'
]);

// Valider une liste d'emails
const listValidation = await processor.validateEmailList('file-email-list');
```

## Composant React de Gestion

```jsx
import React, { useState, useEffect } from 'react';
import { containersAPI } from '@/services/api';

function ContainerManager() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      const response = await containersAPI.list({ limit: 50 });
      setContainers(response.data);
    } catch (error) {
      console.error('Failed to load containers:', error);
    }
  };

  const createContainer = async () => {
    if (!newContainerName.trim()) return;

    setLoading(true);
    try {
      const container = await containersAPI.create(newContainerName, {
        memory_limit: '2g',
        expires_after: {
          anchor: 'last_active_at',
          minutes: 30
        }
      });

      setContainers(prev => [container, ...prev]);
      setNewContainerName('');
    } catch (error) {
      console.error('Failed to create container:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteContainer = async (containerId) => {
    if (!confirm('Supprimer ce conteneur?')) return;

    try {
      await containersAPI.delete(containerId);
      setContainers(prev => prev.filter(c => c.id !== containerId));
    } catch (error) {
      console.error('Failed to delete container:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'green';
      case 'failed': return 'red';
      case 'stopped': return 'orange';
      default: return 'gray';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="container-manager">
      <div className="header">
        <h2>🐳 Container Manager</h2>
        <div className="create-container">
          <input
            type="text"
            value={newContainerName}
            onChange={(e) => setNewContainerName(e.target.value)}
            placeholder="Nom du conteneur..."
            onKeyPress={(e) => e.key === 'Enter' && createContainer()}
          />
          <button onClick={createContainer} disabled={loading}>
            {loading ? '⏳' : '➕'} Créer
          </button>
        </div>
      </div>

      <div className="containers-list">
        {containers.length === 0 ? (
          <p>Aucun conteneur actif</p>
        ) : (
          containers.map(container => (
            <div key={container.id} className="container-item">
              <div className="container-info">
                <h3>{container.name}</h3>
                <div className="container-details">
                  <span 
                    className="status"
                    style={{ color: getStatusColor(container.status) }}
                  >
                    ● {container.status}
                  </span>
                  <span className="memory">💾 {container.memory_limit}</span>
                  <span className="created">
                    📅 {formatTime(container.created_at)}
                  </span>
                  <span className="last-active">
                    🕒 {formatTime(container.last_active_at)}
                  </span>
                </div>
                {container.expires_after && (
                  <div className="expiration">
                    ⏰ Expire après {container.expires_after.minutes} min d'inactivité
                  </div>
                )}
              </div>
              <div className="container-actions">
                <button
                  onClick={() => deleteContainer(container.id)}
                  className="delete-btn"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="stats">
        <h3>📊 Statistiques</h3>
        <div className="stats-grid">
          <div className="stat">
            <span className="label">Total:</span>
            <span className="value">{containers.length}</span>
          </div>
          <div className="stat">
            <span className="label">Actifs:</span>
            <span className="value">
              {containers.filter(c => c.status === 'running').length}
            </span>
          </div>
          <div className="stat">
            <span className="label">Mémoire totale:</span>
            <span className="value">
              {containers.reduce((total, c) => {
                const mem = parseInt(c.memory_limit);
                return total + (isNaN(mem) ? 1 : mem);
              }, 0)}g
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContainerManager;
```

## Bonnes Pratiques

### 1. Gestion de la Mémoire
```javascript
// Choisir la bonne taille selon l'usage
const memoryLimits = {
  'light_analysis': '1g',    // Analyse simple
  'data_processing': '2g',   // Traitement de données
  'heavy_computation': '4g'  // Calculs intensifs
};

const container = await containersAPI.create('Analysis', {
  memory_limit: memoryLimits.data_processing
});
```

### 2. Expiration Intelligente
```javascript
// Expiration basée sur l'activité
const container = await containersAPI.create('Interactive Analysis', {
  expires_after: {
    anchor: 'last_active_at',
    minutes: 30  // Se ferme après 30 min d'inactivité
  }
});

// Expiration fixe pour les tâches batch
const batchContainer = await containersAPI.create('Batch Processing', {
  expires_after: {
    anchor: 'created_at',
    minutes: 120  // Se ferme après 2h max
  }
});
```

### 3. Nettoyage Automatique
```javascript
class ContainerPool {
  constructor() {
    this.containers = new Map();
    this.startCleanupTimer();
  }

  async getContainer(userId, purpose) {
    const key = `${userId}-${purpose}`;
    let containerId = this.containers.get(key);

    if (!containerId) {
      const container = await containersAPI.create(`${purpose}-${userId}`, {
        memory_limit: '2g',
        expires_after: {
          anchor: 'last_active_at',
          minutes: 45
        }
      });
      
      containerId = container.id;
      this.containers.set(key, containerId);
    }

    return containerId;
  }

  startCleanupTimer() {
    setInterval(async () => {
      const containerList = await containersAPI.list({ limit: 100 });
      
      for (const container of containerList.data) {
        const expiresAt = container.expires_at;
        if (expiresAt && expiresAt < Date.now() / 1000) {
          try {
            await containersAPI.delete(container.id);
            console.log(`Cleaned up expired container: ${container.name}`);
          } catch (error) {
            console.error(`Failed to cleanup container ${container.id}:`, error);
          }
        }
      }
    }, 300000); // Vérifier toutes les 5 minutes
  }
}

// Utilisation globale
const containerPool = new ContainerPool();
```

---

**🎉 Containers API intégré avec succès!**

*Environnements d'exécution isolés pour Code Interpreter*