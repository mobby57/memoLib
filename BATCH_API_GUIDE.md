# API Batch OpenAI - Guide d'utilisation

## Vue d'ensemble

L'API Batch d'OpenAI permet de traiter de grandes quantités de requêtes de manière asynchrone avec **50% de réduction sur les coûts**. Les résultats sont disponibles sous 24 heures.

## Fonctionnalités

### ✅ Endpoints supportés

- `/v1/chat/completions` - Conversations chat
- `/v1/completions` - Completion de texte
- `/v1/embeddings` - Génération d'embeddings
- `/v1/moderations` - Modération de contenu
- `/v1/responses` - Réponses (Background mode)

### ✅ Capacités

- **Max 50,000 requêtes** par batch
- **Max 200 MB** par fichier
- **24h de traitement** garanties
- **50% de réduction** sur tous les tokens
- **Stockage local** de l'historique des batches

## Configuration

### 1. Clé API OpenAI

Ajoutez votre clé API dans `.env` :

```env
OPENAI_API_KEY=sk-votre-cle-api-openai
```

## Interface Web

**URL :** `http://localhost:5000/batch-api.html`

### Fonctionnalités de l'interface :

- 📊 **Statistiques** - Total batches, requêtes, tokens
- ✨ **Création facile** - Mode simple et avancé
- 📋 **Historique complet** - Liste tous les batches
- 🔄 **Actualisation auto** - Rafraîchissement toutes les 30s
- ⬇️ **Téléchargement** - Récupération des résultats

## API Endpoints

### POST /api/batch/create

Crée un nouveau batch.

**Options :**

1. **À partir d'une liste de requêtes (recommandé)**

```bash
curl -X POST http://localhost:5000/api/batch/create \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h",
    "requests": [
      {
        "custom_id": "request-1",
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {
          "model": "gpt-4o-mini",
          "messages": [
            {"role": "user", "content": "Quelle est la capitale de la France?"}
          ]
        }
      },
      {
        "custom_id": "request-2",
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {
          "model": "gpt-4o-mini",
          "messages": [
            {"role": "user", "content": "Explique la photosynthèse"}
          ]
        }
      }
    ]
  }'
```

2. **À partir d'un fichier déjà uploadé**

```bash
curl -X POST http://localhost:5000/api/batch/create \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h",
    "metadata": {
      "project": "mon-projet",
      "batch_name": "test-batch-1"
    }
  }'
```

**Réponse :**

```json
{
  "success": true,
  "batch": {
    "id": "batch_abc123",
    "object": "batch",
    "endpoint": "/v1/chat/completions",
    "status": "validating",
    "input_file_id": "file-xyz789",
    "completion_window": "24h",
    "created_at": 1734691200,
    "request_counts": {
      "total": 0,
      "completed": 0,
      "failed": 0
    }
  }
}
```

### GET /api/batch/{batch_id}

Récupère les informations d'un batch.

```bash
curl http://localhost:5000/api/batch/batch_abc123?refresh=true
```

**Query params :**
- `refresh` : Si `true`, récupère depuis l'API OpenAI (défaut: true)

**Réponse :**

```json
{
  "success": true,
  "batch": {
    "id": "batch_abc123",
    "status": "completed",
    "endpoint": "/v1/chat/completions",
    "output_file_id": "file-results123",
    "error_file_id": null,
    "created_at": 1734691200,
    "completed_at": 1734777600,
    "request_counts": {
      "total": 100,
      "completed": 95,
      "failed": 5
    },
    "usage": {
      "input_tokens": 1500,
      "output_tokens": 800,
      "total_tokens": 2300
    }
  }
}
```

### POST /api/batch/{batch_id}/cancel

Annule un batch en cours.

```bash
curl -X POST http://localhost:5000/api/batch/batch_abc123/cancel
```

**Réponse :**

```json
{
  "success": true,
  "batch": {
    "id": "batch_abc123",
    "status": "cancelling",
    "cancelling_at": 1734691500
  }
}
```

### GET /api/batch/list

Liste tous les batches.

```bash
# Liste depuis l'API OpenAI
curl http://localhost:5000/api/batch/list?limit=20&source=api

# Liste depuis la base locale
curl http://localhost:5000/api/batch/list?source=local&limit=50&status=completed
```

**Query params :**
- `source` : `api` (OpenAI) ou `local` (base de données)
- `limit` : Nombre max de batches (1-100)
- `after` : Cursor pour pagination (source=api)
- `status` : Filtrer par statut (source=local)
- `offset` : Décalage pour pagination (source=local)

**Réponse :**

```json
{
  "success": true,
  "object": "list",
  "data": [
    {
      "id": "batch_abc123",
      "status": "completed",
      "endpoint": "/v1/chat/completions",
      "created_at": 1734691200
    }
  ],
  "first_id": "batch_abc123",
  "last_id": "batch_xyz789",
  "has_more": false
}
```

### GET /api/batch/stats

Récupère les statistiques des batches.

```bash
curl http://localhost:5000/api/batch/stats
```

**Réponse :**

```json
{
  "success": true,
  "stats": {
    "total_batches": 45,
    "by_status": {
      "completed": 30,
      "in_progress": 5,
      "failed": 2,
      "cancelled": 8
    },
    "request_counts": {
      "total": 45000,
      "completed": 43500,
      "failed": 1500
    },
    "usage": {
      "input_tokens": 1250000,
      "output_tokens": 850000,
      "total_tokens": 2100000
    }
  }
}
```

### GET /api/batch/{batch_id}/results

Télécharge les résultats d'un batch.

```bash
# Résultats réussis
curl http://localhost:5000/api/batch/batch_abc123/results?type=output \
  -o results.jsonl

# Résultats en erreur
curl http://localhost:5000/api/batch/batch_abc123/results?type=error \
  -o errors.jsonl
```

**Query params :**
- `type` : `output` (résultats) ou `error` (erreurs)

Le fichier téléchargé est au format JSONL.

### POST /api/batch/upload

Upload un fichier JSONL.

```bash
curl -X POST http://localhost:5000/api/batch/upload \
  -F "file=@my_batch.jsonl" \
  -F "purpose=batch"
```

**Réponse :**

```json
{
  "success": true,
  "file": {
    "id": "file-abc123",
    "filename": "my_batch.jsonl",
    "bytes": 15234,
    "created_at": 1734691200,
    "purpose": "batch"
  }
}
```

## Format de fichier JSONL

Chaque ligne doit être un objet JSON valide :

```jsonl
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello!"}]}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Bonjour!"}]}}
```

### Structure d'une requête :

```json
{
  "custom_id": "request-1",          // ID unique pour matching
  "method": "POST",                   // Toujours POST
  "url": "/v1/chat/completions",     // Endpoint
  "body": {                           // Paramètres de la requête
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Question..."}
    ],
    "max_tokens": 1000
  }
}
```

## Statuts des batches

- `validating` - Validation du fichier en cours
- `in_progress` - Traitement en cours
- `finalizing` - Finalisation des résultats
- `completed` - Terminé avec succès
- `failed` - Échec du batch
- `expired` - Expiré (24h dépassées)
- `cancelling` - Annulation en cours
- `cancelled` - Annulé

## Exemples d'utilisation

### Exemple 1 : Traduire 100 textes

```python
import requests
import json

# Préparer les requêtes
requests_data = []
texts_to_translate = ["Hello", "Goodbye", "Thank you", ...]  # 100 textes

for i, text in enumerate(texts_to_translate):
    requests_data.append({
        "custom_id": f"translation-{i}",
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "Traduis en français"},
                {"role": "user", "content": text}
            ]
        }
    })

# Créer le batch
response = requests.post(
    "http://localhost:5000/api/batch/create",
    json={
        "endpoint": "/v1/chat/completions",
        "requests": requests_data
    }
)

batch = response.json()['batch']
print(f"Batch créé: {batch['id']}")
```

### Exemple 2 : Générer des embeddings

```python
import requests

# Préparer les textes
texts = ["Premier texte", "Deuxième texte", ...]  # Max 50,000

requests_data = []
for i, text in enumerate(texts):
    requests_data.append({
        "custom_id": f"embedding-{i}",
        "method": "POST",
        "url": "/v1/embeddings",
        "body": {
            "model": "text-embedding-ada-002",
            "input": text
        }
    })

# Créer le batch
response = requests.post(
    "http://localhost:5000/api/batch/create",
    json={
        "endpoint": "/v1/embeddings",
        "requests": requests_data,
        "metadata": {"project": "embeddings-generation"}
    }
)
```

### Exemple 3 : Surveiller et récupérer les résultats

```python
import requests
import time
import json

batch_id = "batch_abc123"

# Vérifier le statut toutes les 5 minutes
while True:
    response = requests.get(f"http://localhost:5000/api/batch/{batch_id}")
    batch = response.json()['batch']
    
    print(f"Statut: {batch['status']}")
    print(f"Requêtes: {batch['request_counts']['completed']}/{batch['request_counts']['total']}")
    
    if batch['status'] == 'completed':
        # Télécharger les résultats
        results_response = requests.get(
            f"http://localhost:5000/api/batch/{batch_id}/results?type=output"
        )
        
        with open('results.jsonl', 'wb') as f:
            f.write(results_response.content)
        
        # Lire et traiter les résultats
        with open('results.jsonl', 'r') as f:
            for line in f:
                result = json.loads(line)
                custom_id = result['custom_id']
                response_body = result['response']['body']
                print(f"{custom_id}: {response_body}")
        
        break
    
    elif batch['status'] in ['failed', 'expired', 'cancelled']:
        print("Batch terminé sans succès")
        break
    
    time.sleep(300)  # Attendre 5 minutes
```

## Bonnes pratiques

### 1. Optimiser les coûts

- Utilisez `gpt-4o-mini` pour 50% de réduction + batch = **75% de réduction totale**
- Groupez les requêtes similaires dans un même batch
- Utilisez les batches pour les tâches non urgentes

### 2. Gestion des erreurs

- Toujours vérifier `error_file_id` après completion
- Implémenter un retry pour les requêtes échouées
- Logger les `custom_id` pour traçabilité

### 3. Performance

- Préparez vos fichiers JSONL en avance
- Utilisez la base locale pour éviter les appels API répétés
- Surveillez l'expiration (24h après création)

### 4. Limites

- Max 50,000 requêtes par batch
- Max 200 MB par fichier
- Pour embeddings : max 50,000 inputs par batch
- Délai de traitement : jusqu'à 24h

## Base de données

Les batches sont stockés dans : `src/backend/data/batches.db`

### Tables :

- **batches** - Informations complètes sur chaque batch
- **batch_files** - Fichiers uploadés

## Dépannage

### Batch en statut "validating" trop longtemps

- Vérifiez le format JSONL (chaque ligne doit être JSON valide)
- Vérifiez que `custom_id` est unique pour chaque requête
- Vérifiez la taille du fichier (< 200 MB)

### Erreur "API key not configured"

- Vérifiez que `OPENAI_API_KEY` est dans `.env`
- Redémarrez le serveur après modification

### Résultats non disponibles

- Attendez que le statut soit `completed`
- Vérifiez `output_file_id` est non-null
- Les résultats sont disponibles pendant 1 an

## Économies réalisées

### Exemple de calcul :

**Sans batch :**
- 10,000 requêtes GPT-4o-mini
- 50,000 tokens input @ $0.150/1M = $7.50
- 30,000 tokens output @ $0.600/1M = $18.00
- **Total : $25.50**

**Avec batch :**
- Même volume avec 50% de réduction
- **Total : $12.75**
- **Économie : $12.75 (50%)**

## Support

Pour toute question :
- Documentation OpenAI : https://platform.openai.com/docs/api-reference/batch
- Interface web : `http://localhost:5000/batch-api.html`
- Logs : `logs/app.log`

## Limitations connues

- Pas de streaming en mode batch
- Délai de traitement variable (jusqu'à 24h)
- Nécessite une clé API OpenAI valide
- Les embeddings sont limités à 50,000 inputs

## Améliorations futures

- [ ] Notifications par email quand batch complété
- [ ] Interface de création de batch par drag & drop
- [ ] Export CSV des statistiques
- [ ] Retry automatique des requêtes échouées
- [ ] Planification de batches récurrents
