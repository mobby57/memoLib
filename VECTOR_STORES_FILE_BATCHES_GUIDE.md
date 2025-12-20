# Guide Vector Stores & File Batches - IAPosteManager

## 📚 Vue d'ensemble

Les **Vector Stores** permettent de stocker et rechercher des embeddings de fichiers pour des capacités de recherche sémantique puissantes. Utilisez les **File Batches** pour ajouter efficacement plusieurs fichiers à un vector store.

## 🎯 Cas d'usage

- **Base de connaissances**: Indexer de la documentation, FAQ, manuels
- **Support client**: Recherche sémantique dans les tickets et solutions
- **Analyse de documents**: Traiter et interroger des collections de documents
- **Assistant IA**: Créer des assistants avec accès à une base de connaissances

## 🚀 Démarrage rapide

### 1. Créer un Vector Store

```python
import requests

response = requests.post('http://localhost:5000/api/vector-stores/', json={
    "name": "Documentation Produit 2024",
    "file_ids": ["file-abc123", "file-def456"],
    "chunking_strategy": {
        "type": "auto"
    }
})

vector_store = response.json()['vector_store']
print(f"Vector Store créé: {vector_store['id']}")
```

### 2. Ajouter des fichiers en batch

```python
response = requests.post(
    f'http://localhost:5000/api/vector-stores/{vector_store_id}/file-batches',
    json={
        "file_ids": ["file-ghi789", "file-jkl012"],
        "chunking_strategy": {
            "type": "auto"
        }
    }
)

batch = response.json()['batch']
print(f"Batch créé: {batch['id']}, Status: {batch['status']}")
```

## 📋 API Endpoints

### Vector Stores

#### Créer un Vector Store
```http
POST /api/vector-stores/
Content-Type: application/json

{
    "name": "Ma Base de Connaissances",
    "file_ids": ["file-abc", "file-def"],
    "chunking_strategy": {
        "type": "auto"
    },
    "expires_after": {
        "anchor": "last_active_at",
        "days": 7
    },
    "metadata": {
        "projet": "Support",
        "version": "1.0"
    }
}
```

**Réponse:**
```json
{
    "success": true,
    "vector_store": {
        "id": "vs_abc123",
        "name": "Ma Base de Connaissances",
        "status": "completed",
        "file_counts": {
            "total": 2,
            "completed": 2,
            "in_progress": 0,
            "failed": 0,
            "cancelled": 0
        },
        "created_at": 1234567890,
        "expires_at": 1234999999
    }
}
```

#### Récupérer un Vector Store
```http
GET /api/vector-stores/{vector_store_id}?refresh=true
```

#### Lister les Vector Stores
```http
GET /api/vector-stores/list?limit=20&after=vs_abc
```

#### Supprimer un Vector Store
```http
DELETE /api/vector-stores/{vector_store_id}
```

### File Batches

#### Créer un File Batch
```http
POST /api/vector-stores/{vector_store_id}/file-batches
Content-Type: application/json

{
    "file_ids": ["file-abc", "file-def", "file-ghi"],
    "chunking_strategy": {
        "type": "static",
        "static": {
            "max_chunk_size_tokens": 800,
            "chunk_overlap_tokens": 400
        }
    }
}
```

**Réponse:**
```json
{
    "success": true,
    "batch": {
        "id": "vsfb_abc123",
        "vector_store_id": "vs_def456",
        "status": "in_progress",
        "file_counts": {
            "total": 3,
            "completed": 1,
            "in_progress": 2,
            "failed": 0,
            "cancelled": 0
        },
        "created_at": 1234567890
    }
}
```

#### Récupérer un File Batch
```http
GET /api/vector-stores/{vector_store_id}/file-batches/{batch_id}
```

#### Annuler un File Batch
```http
POST /api/vector-stores/{vector_store_id}/file-batches/{batch_id}/cancel
```

#### Lister les fichiers d'un batch
```http
GET /api/vector-stores/{vector_store_id}/file-batches/{batch_id}/files?limit=20&filter=completed
```

#### Lister les batches d'un vector store
```http
GET /api/vector-stores/{vector_store_id}/file-batches/list?limit=50
```

### Statistiques
```http
GET /api/vector-stores/stats
```

**Réponse:**
```json
{
    "success": true,
    "stats": {
        "total_vector_stores": 5,
        "total_file_batches": 12,
        "total_files_processed": 87,
        "batches_in_progress": 2,
        "batches_completed": 8,
        "batches_failed": 1,
        "batches_cancelled": 1
    }
}
```

## 🔧 Stratégies de Chunking

### Auto (Recommandé)
```python
chunking_strategy = {
    "type": "auto"
}
```
- Ajuste automatiquement la taille des chunks
- Optimise pour la qualité de la recherche
- Recommandé pour la plupart des cas

### Static (Contrôle manuel)
```python
chunking_strategy = {
    "type": "static",
    "static": {
        "max_chunk_size_tokens": 800,
        "chunk_overlap_tokens": 400
    }
}
```
- Contrôle précis de la segmentation
- `max_chunk_size_tokens`: Taille max d'un chunk (100-4096)
- `chunk_overlap_tokens`: Overlap entre chunks (0-taille max)

### Recommandations

| Type de document | Strategy | Max Tokens | Overlap |
|-----------------|----------|------------|---------|
| Documentation technique | Static | 800 | 400 |
| Articles longs | Static | 1200 | 200 |
| FAQ / Q&A | Auto | - | - |
| Code source | Static | 600 | 100 |
| Emails / Messages | Auto | - | - |

## ⏰ Expiration automatique

Configurez l'expiration pour nettoyer automatiquement les vector stores:

```python
expires_after = {
    "anchor": "last_active_at",  # ou "created_at"
    "days": 7
}
```

- `anchor: "last_active_at"`: Expire après 7 jours d'inactivité
- `anchor: "created_at"`: Expire 7 jours après création

## 📊 Monitoring des batches

### Statuts possibles
- `in_progress`: Traitement en cours
- `completed`: Tous les fichiers traités avec succès
- `failed`: Un ou plusieurs fichiers ont échoué
- `cancelled`: Batch annulé

### Surveiller la progression
```python
import time

def wait_for_batch_completion(vector_store_id, batch_id):
    while True:
        response = requests.get(
            f'http://localhost:5000/api/vector-stores/{vector_store_id}/file-batches/{batch_id}'
        )
        batch = response.json()['batch']
        
        print(f"Status: {batch['status']}")
        print(f"Complétés: {batch['file_counts']['completed']}/{batch['file_counts']['total']}")
        
        if batch['status'] in ['completed', 'failed', 'cancelled']:
            break
            
        time.sleep(5)
    
    return batch
```

## 🎨 Interface Web

Accédez à l'interface graphique: **http://localhost:5000/vector-stores.html**

### Fonctionnalités
- ✅ Créer des vector stores avec configuration complète
- ✅ Visualiser tous les vector stores
- ✅ Créer des file batches
- ✅ Surveiller la progression en temps réel
- ✅ Annuler des batches en cours
- ✅ Statistiques globales

## 💡 Exemples pratiques

### Exemple 1: Base de connaissances produit

```python
# 1. Uploader les fichiers
files = ['manuel.pdf', 'faq.txt', 'guide_installation.md']
file_ids = []

for filepath in files:
    with open(filepath, 'rb') as f:
        response = requests.post(
            'https://api.openai.com/v1/files',
            headers={'Authorization': f'Bearer {OPENAI_API_KEY}'},
            files={'file': f},
            data={'purpose': 'assistants'}
        )
        file_ids.append(response.json()['id'])

# 2. Créer le vector store
response = requests.post('http://localhost:5000/api/vector-stores/', json={
    "name": "Documentation Produit XYZ",
    "file_ids": file_ids,
    "chunking_strategy": {"type": "auto"},
    "metadata": {"produit": "XYZ", "version": "2.0"}
})

print("Vector store créé:", response.json())
```

### Exemple 2: Ajouter des fichiers progressivement

```python
vector_store_id = "vs_abc123"

# Ajouter un premier batch
batch1 = requests.post(
    f'http://localhost:5000/api/vector-stores/{vector_store_id}/file-batches',
    json={"file_ids": ["file-1", "file-2", "file-3"]}
).json()

# Ajouter un second batch plus tard
batch2 = requests.post(
    f'http://localhost:5000/api/vector-stores/{vector_store_id}/file-batches',
    json={"file_ids": ["file-4", "file-5"]}
).json()
```

### Exemple 3: Utiliser avec un Assistant OpenAI

```python
from openai import OpenAI

client = OpenAI()

# Créer un assistant avec le vector store
assistant = client.beta.assistants.create(
    name="Support Bot",
    instructions="Tu es un assistant qui répond aux questions sur nos produits.",
    model="gpt-4-turbo",
    tools=[{"type": "file_search"}],
    tool_resources={
        "file_search": {
            "vector_store_ids": [vector_store_id]
        }
    }
)

# Créer une conversation
thread = client.beta.threads.create()

# Poser une question
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="Comment installer le produit XYZ?"
)

# Exécuter l'assistant
run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id
)

# Récupérer la réponse
# (code de polling et récupération de la réponse)
```

## 🔍 Bonnes pratiques

### 1. Préparation des fichiers
- ✅ Formats supportés: `.txt`, `.md`, `.pdf`, `.docx`
- ✅ Taille max par fichier: 512 MB
- ✅ Nettoyer les fichiers (enlever les en-têtes/pieds de page inutiles)
- ✅ Utiliser des noms de fichiers descriptifs

### 2. Chunking optimal
- Pour des documents techniques: Static avec 800 tokens, overlap 400
- Pour du contenu généraliste: Auto chunking
- Pour du code: Static avec 600 tokens, overlap 100

### 3. Organisation
- Utiliser des métadonnées pour catégoriser
- Créer des vector stores par projet/thème
- Configurer l'expiration pour les données temporaires
- Utiliser des noms descriptifs

### 4. Performance
- Ajouter les fichiers en batches (max 500 fichiers par batch)
- Surveiller les statuts pour détecter les erreurs
- Annuler les batches inutiles pour économiser les ressources

### 5. Maintenance
- Supprimer les vector stores obsolètes
- Vérifier régulièrement les statistiques
- Tester la qualité de recherche avec différentes stratégies

## ⚠️ Limites et quotas

- **Max fichiers par vector store**: 10,000 fichiers
- **Max fichiers par batch**: 500 fichiers
- **Taille max par fichier**: 512 MB
- **Tokens max par chunk**: 4096 tokens
- **Vector stores actifs**: Selon votre plan OpenAI

## 🐛 Dépannage

### Batch bloqué en "in_progress"
```python
# Annuler et recréer
requests.post(f'{API_BASE}/{vs_id}/file-batches/{batch_id}/cancel')
```

### Fichiers qui échouent
```python
# Vérifier les détails
response = requests.get(
    f'{API_BASE}/{vs_id}/file-batches/{batch_id}/files?filter=failed'
)
failed_files = response.json()['data']
for file in failed_files:
    print(f"Fichier {file['id']}: {file.get('last_error')}")
```

### Vector store vide après création
- Vérifier que les fichiers sont bien uploadés avec `purpose: 'assistants'`
- Attendre que le batch soit en statut `completed`
- Vérifier les logs dans la console du serveur

## 📞 Support

- Documentation OpenAI: https://platform.openai.com/docs/assistants/tools/file-search
- Interface web: http://localhost:5000/vector-stores.html
- Statistiques API: http://localhost:5000/api/vector-stores/stats

---

**Créé pour IAPosteManager v3.0** | Utilise l'API OpenAI Vector Stores avec cache local SQLite
