# 🔔 Webhooks - Guide d'Intégration

## Configuration des Webhooks OpenAI

### Backend - Endpoint de Réception

Créez un endpoint dans votre backend Flask pour recevoir les webhooks :

```python
# src/backend/routes/webhooks.py
from flask import Blueprint, request, jsonify
import hmac
import hashlib

webhooks_bp = Blueprint('webhooks', __name__)

@webhooks_bp.route('/webhooks/openai', methods=['POST'])
def handle_openai_webhook():
    # Vérifier la signature (recommandé en production)
    signature = request.headers.get('X-OpenAI-Signature')
    
    # Récupérer l'événement
    event = request.json
    event_type = event.get('type')
    event_data = event.get('data')
    
    # Traiter selon le type
    if event_type == 'response.completed':
        handle_response_completed(event_data)
    elif event_type == 'response.failed':
        handle_response_failed(event_data)
    elif event_type == 'batch.completed':
        handle_batch_completed(event_data)
    
    return jsonify({'status': 'received'}), 200

def handle_response_completed(data):
    response_id = data.get('id')
    # Notifier le frontend via WebSocket ou SSE
    print(f"Response {response_id} completed")
    
def handle_response_failed(data):
    response_id = data.get('id')
    print(f"Response {response_id} failed")
    
def handle_batch_completed(data):
    batch_id = data.get('id')
    print(f"Batch {batch_id} completed")
```

### Frontend - Écoute des Événements

```javascript
import { webhookAPI } from './services/api';

// Écouter les événements webhook
window.addEventListener('openai-response-completed', (event) => {
  const { responseId, timestamp } = event.detail;
  console.log('Response completed:', responseId);
  
  // Récupérer la réponse complète
  aiAPI.getResponse(responseId).then(response => {
    displayResult(response);
  });
});

window.addEventListener('openai-response-failed', (event) => {
  const { responseId, timestamp } = event.detail;
  console.error('Response failed:', responseId);
  showErrorNotification('La génération a échoué');
});

window.addEventListener('openai-batch-completed', (event) => {
  const { batchId, timestamp } = event.detail;
  console.log('Batch completed:', batchId);
  refreshBatchResults();
});
```

### Configuration Initiale

```javascript
// Configurer l'URL du webhook
await webhookAPI.configureWebhook(
  'https://votre-domaine.com/api/webhooks/openai',
  [
    'response.completed',
    'response.failed',
    'response.cancelled',
    'batch.completed',
    'fine_tuning.job.succeeded'
  ]
);

// Vérifier le statut
const status = await webhookAPI.getWebhookStatus();
console.log('Webhook status:', status);
```

## Types d'Événements Supportés

### Réponses en Arrière-Plan
- `response.completed` - Réponse terminée
- `response.failed` - Réponse échouée
- `response.cancelled` - Réponse annulée
- `response.incomplete` - Réponse interrompue

### Traitements par Lots
- `batch.completed` - Lot terminé
- `batch.cancelled` - Lot annulé
- `batch.expired` - Lot expiré
- `batch.failed` - Lot échoué

### Fine-Tuning
- `fine_tuning.job.succeeded` - Fine-tuning réussi
- `fine_tuning.job.failed` - Fine-tuning échoué
- `fine_tuning.job.cancelled` - Fine-tuning annulé

### Évaluations
- `eval.run.succeeded` - Évaluation réussie
- `eval.run.failed` - Évaluation échouée
- `eval.run.canceled` - Évaluation annulée

## Exemple Complet - Génération en Arrière-Plan

```javascript
// 1. Lancer une génération en arrière-plan
const response = await aiAPI.createResponse(
  "Génère un rapport détaillé de 5000 mots",
  {
    model: 'gpt-4o',
    background: true, // Mode arrière-plan
    max_output_tokens: 8000
  }
);

const responseId = response.id;
console.log('Background job started:', responseId);

// 2. Écouter la complétion
window.addEventListener('openai-response-completed', async (event) => {
  if (event.detail.responseId === responseId) {
    // Récupérer le résultat
    const result = await aiAPI.getResponse(responseId);
    const text = result.output[0].content[0].text;
    
    // Afficher le résultat
    displayReport(text);
    
    // Notifier l'utilisateur
    showNotification('Votre rapport est prêt !');
  }
});

// 3. Gérer les erreurs
window.addEventListener('openai-response-failed', (event) => {
  if (event.detail.responseId === responseId) {
    showError('La génération a échoué');
  }
});
```

## Sécurité - Vérification de Signature

```python
# Backend - Vérifier la signature OpenAI
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)

@webhooks_bp.route('/webhooks/openai', methods=['POST'])
def handle_openai_webhook():
    signature = request.headers.get('X-OpenAI-Signature')
    payload = request.get_data(as_text=True)
    
    if not verify_webhook_signature(payload, signature, WEBHOOK_SECRET):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Traiter l'événement...
```

## Monitoring et Logs

```javascript
// Logger tous les événements webhook
webhookAPI.handleWebhookEvent = (event) => {
  // Log pour analytics
  console.log('Webhook event:', {
    type: event.type,
    id: event.id,
    timestamp: new Date(event.created_at * 1000).toISOString()
  });
  
  // Envoyer à votre système de monitoring
  sendToAnalytics({
    event: 'webhook_received',
    type: event.type,
    data: event.data
  });
  
  // Traitement par défaut
  switch (event.type) {
    case 'response.completed':
      webhookAPI.onResponseCompleted(event.data, event.created_at);
      break;
    // ...
  }
};
```

## Configuration Render.com

Pour déployer sur Render avec webhooks :

```yaml
# render.yaml
services:
  - type: web
    name: iapostemanager-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn src.backend.app:app
    envVars:
      - key: WEBHOOK_SECRET
        generateValue: true
      - key: OPENAI_WEBHOOK_URL
        value: https://votre-app.onrender.com/api/webhooks/openai
```

## Tests

```javascript
// Tester le gestionnaire de webhook
const mockEvent = {
  id: 'evt_test123',
  type: 'response.completed',
  created_at: Math.floor(Date.now() / 1000),
  data: {
    id: 'resp_test123'
  }
};

webhookAPI.handleWebhookEvent(mockEvent);
```

---

**Version** : 2.2  
**Statut** : ✅ Production Ready
