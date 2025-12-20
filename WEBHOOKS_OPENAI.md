# Configuration des Webhooks OpenAI

## Vue d'ensemble

Ce projet intègre maintenant un système complet de gestion des webhooks OpenAI permettant de recevoir et traiter automatiquement les événements de l'API OpenAI en temps réel.

## Fonctionnalités

### ✅ Types d'événements supportés

- **Réponses (Response Events)**
  - `response.completed` - Réponse complétée
  - `response.cancelled` - Réponse annulée
  - `response.failed` - Réponse échouée
  - `response.incomplete` - Réponse incomplète

- **Batch API**
  - `batch.completed` - Batch complété
  - `batch.cancelled` - Batch annulé
  - `batch.expired` - Batch expiré
  - `batch.failed` - Batch échoué

- **Fine-tuning**
  - `fine_tuning.job.succeeded` - Fine-tuning réussi
  - `fine_tuning.job.failed` - Fine-tuning échoué
  - `fine_tuning.job.cancelled` - Fine-tuning annulé

- **Evaluations**
  - `eval.run.succeeded` - Eval réussi
  - `eval.run.failed` - Eval échoué
  - `eval.run.canceled` - Eval annulé

- **Realtime API**
  - `realtime.call.incoming` - Appel entrant

## Configuration

### 1. Variable d'environnement

Ajoutez la clé de vérification des webhooks dans votre fichier `.env` :

```env
OPENAI_WEBHOOK_SECRET=votre_secret_webhook_openai
```

Cette clé est utilisée pour vérifier l'authenticité des webhooks reçus via la signature HMAC-SHA256.

### 2. Configurer le webhook dans OpenAI

1. Accédez à votre dashboard OpenAI
2. Allez dans la section **Webhooks** ou **API Settings**
3. Créez un nouveau webhook endpoint avec l'URL :

```
https://votre-domaine.com/api/webhooks/openai
```

Pour le développement local, vous pouvez utiliser un tunnel comme ngrok :

```bash
ngrok http 5000
```

Puis utilisez l'URL fournie par ngrok :

```
https://abc123.ngrok.io/api/webhooks/openai
```

4. Configurez les événements que vous souhaitez recevoir
5. Copiez le **Webhook Secret** fourni par OpenAI et ajoutez-le dans votre `.env`

## API Endpoints

### POST /api/webhooks/openai

Endpoint principal pour recevoir les webhooks d'OpenAI.

**Headers requis :**
- `X-OpenAI-Signature`: Signature HMAC-SHA256 de vérification

**Body :** JSON de l'événement webhook

**Réponses :**
- `200`: Événement traité avec succès
- `401`: Signature invalide
- `400`: Données invalides
- `500`: Erreur serveur

**Exemple de réponse :**

```json
{
  "success": true,
  "event_id": "evt_abc123",
  "event_type": "response.completed",
  "processed_at": "2025-12-20T10:30:00.000Z"
}
```

### GET /api/webhooks/events

Récupère l'historique des événements webhook.

**Query params :**
- `type`: Type d'événement à filtrer (optionnel)
- `limit`: Nombre d'événements (défaut: 100, max: 500)
- `offset`: Décalage pour pagination (défaut: 0)

**Exemple :**

```
GET /api/webhooks/events?type=response.completed&limit=50&offset=0
```

**Réponse :**

```json
{
  "success": true,
  "events": [
    {
      "id": "evt_abc123",
      "event_type": "response.completed",
      "event_object": "event",
      "created_at": 1734691200,
      "received_at": "2025-12-20T10:30:00.000Z",
      "data": "{\"id\":\"resp_abc123\"}",
      "status": "processed",
      "processing_error": null
    }
  ],
  "count": 1,
  "limit": 50,
  "offset": 0
}
```

### GET /api/webhooks/stats

Récupère les statistiques des événements webhook.

**Réponse :**

```json
{
  "success": true,
  "stats": {
    "events_by_type": {
      "response.completed": 45,
      "batch.completed": 12,
      "fine_tuning.job.succeeded": 3
    },
    "events_by_status": {
      "processed": 58,
      "error": 2
    },
    "recent_events_24h": 15,
    "total_events": 60
  }
}
```

### GET /api/webhooks/health

Vérifie l'état du service webhook.

**Réponse :**

```json
{
  "success": true,
  "service": "webhook",
  "status": "healthy"
}
```

## Interface Web

Une interface web complète est disponible pour visualiser et gérer les webhooks :

**URL :** `http://localhost:5000/webhooks.html`

### Fonctionnalités de l'interface :

- 📊 **Statistiques en temps réel**
  - Total des événements
  - Événements des dernières 24h
  - Répartition par type

- 📋 **Historique complet**
  - Liste tous les événements reçus
  - Filtrage par type d'événement
  - Pagination

- 🔄 **Actualisation automatique**
  - Rafraîchissement toutes les 30 secondes
  - Indicateur visuel de mise à jour

- 📋 **URL du webhook**
  - Affichage de l'URL complète
  - Bouton de copie rapide

## Base de données

Les événements webhook sont stockés dans une base de données SQLite : `src/backend/data/webhooks.db`

### Tables principales :

- **webhook_events** - Tous les événements reçus
- **response_events** - Événements de réponse
- **batch_events** - Événements batch
- **fine_tuning_events** - Événements fine-tuning
- **eval_events** - Événements d'évaluation
- **realtime_events** - Événements realtime

## Sécurité

### Vérification de signature

Chaque webhook reçu est vérifié via sa signature HMAC-SHA256 :

```python
signature = request.headers.get('X-OpenAI-Signature')
is_valid = webhook_service.verify_signature(request.data, signature)
```

### Protection

- Validation stricte des données reçues
- Gestion des erreurs robuste
- Logging de toutes les tentatives
- Détection des événements dupliqués

## Utilisation dans le code

### Personnaliser le traitement des événements

Vous pouvez modifier les handlers dans `src/backend/services/webhook_service.py` :

```python
def _handle_response_completed(self, event_id: str, data: Dict[str, Any], created_at: int):
    """Gère l'événement response.completed"""
    response_id = data.get('id')
    
    # Votre logique personnalisée ici
    # Par exemple : envoyer une notification, déclencher une action, etc.
    
    logger.info(f"Réponse complétée: {response_id}")
    # ... stockage en base de données ...
```

### Ajouter des notifications

Exemple d'ajout de notifications par email lors d'un événement :

```python
def _handle_batch_completed(self, event_id: str, data: Dict[str, Any], created_at: int):
    batch_id = data.get('id')
    
    # Envoyer une notification
    send_notification_email(
        subject=f"Batch {batch_id} complété",
        body=f"Le batch {batch_id} a été traité avec succès."
    )
    
    # Stockage standard
    # ...
```

## Test en local

### Avec ngrok

1. Démarrez votre serveur :

```bash
python src/backend/app.py
```

2. Dans un autre terminal, lancez ngrok :

```bash
ngrok http 5000
```

3. Utilisez l'URL HTTPS fournie par ngrok dans la configuration OpenAI

4. Testez en créant une requête API qui déclenche un webhook

### Test manuel

Vous pouvez simuler un webhook avec curl :

```bash
curl -X POST http://localhost:5000/api/webhooks/openai \
  -H "Content-Type: application/json" \
  -H "X-OpenAI-Signature: test_signature" \
  -d '{
    "id": "evt_test123",
    "type": "response.completed",
    "created_at": 1734691200,
    "object": "event",
    "data": {
      "id": "resp_test123"
    }
  }'
```

## Monitoring

### Logs

Tous les événements webhook sont loggés dans :
- `logs/app.log` - Logs généraux
- `logs/error.log` - Erreurs uniquement

### Métriques disponibles

- Nombre total d'événements reçus
- Événements par type
- Événements par statut (processed, error, unhandled)
- Événements récents (24h)
- Taux d'erreur

## Dépannage

### Webhook non reçu

1. Vérifiez que le serveur est accessible depuis Internet
2. Vérifiez l'URL configurée dans OpenAI
3. Consultez les logs pour voir si des requêtes arrivent
4. Vérifiez que le port 5000 est ouvert

### Signature invalide

1. Vérifiez que `OPENAI_WEBHOOK_SECRET` est correctement configuré
2. Assurez-vous d'utiliser le même secret que dans OpenAI
3. Vérifiez que le header `X-OpenAI-Signature` est présent

### Événements non traités

1. Consultez la table `webhook_events` pour voir le statut
2. Vérifiez la colonne `processing_error` pour les détails
3. Consultez `logs/error.log` pour les traces d'erreur

## Améliorations futures possibles

- [ ] Support des webhooks retry automatique
- [ ] Intégration avec des services de notification (Slack, Discord)
- [ ] Métriques avancées et analytics
- [ ] Export des événements (CSV, JSON)
- [ ] Filtres avancés dans l'interface web
- [ ] Webhooks pour d'autres services (SendGrid, etc.)

## Support

Pour toute question ou problème, consultez :
- La documentation OpenAI : https://platform.openai.com/docs/api-reference/webhooks
- Les logs de l'application : `logs/app.log`
- L'interface web : `http://localhost:5000/webhooks.html`
