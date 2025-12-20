# 📁 Vector Store Files - Guide Complet

## Vue d'ensemble

L'intégration des **Vector Store Files** permet de gérer des fichiers dans des vector stores OpenAI pour la recherche sémantique avancée via l'API Assistants. Cette fonctionnalité est parfaite pour créer des knowledge bases et des chatbots intelligents.

## ⚙️ Prérequis

### Version OpenAI Library

```bash
pip install --upgrade openai>=1.12.0
```

**Note:** Les Vector Stores nécessitent OpenAI SDK v1.12.0+ avec l'API Assistants v2 (Beta).

### Headers Requis

Tous les appels aux Vector Stores nécessitent le header:
```
OpenAI-Beta: assistants=v2
```

## 📚 Fonctionnalités Implémentées

### 1. Attacher un Fichier à un Vector Store

**Méthode:** `create_vector_store_file()`

```python
from backend.app import ai_service

result = ai_service.create_vector_store_file(
    vector_store_id="vs_abc123",
    file_id="file-xyz789",
    attributes={
        "category": "emails",
        "priority": "high",
        "department": "support"
    },
    chunking_strategy={
        "type": "static",
        "static": {
            "max_chunk_size_tokens": 800,
            "chunk_overlap_tokens": 400
        }
    }
)

if result['success']:
    print(f"Fichier attaché: {result['id']}")
    print(f"Status: {result['status']}")
```

**Paramètres:**
- `vector_store_id`: ID du vector store (requis)
- `file_id`: ID du fichier uploadé (requis)
- `attributes`: Métadonnées personnalisées (optionnel, max 16 clés)
- `chunking_strategy`: Stratégie de découpage (optionnel)

**Retour:**
```json
{
  "success": true,
  "id": "file-abc123",
  "status": "completed",
  "usage_bytes": 1234,
  "vector_store_id": "vs_abc123",
  "created_at": 1699061776
}
```

### 2. Lister les Fichiers d'un Vector Store

**Méthode:** `list_vector_store_files()`

```python
result = ai_service.list_vector_store_files(
    vector_store_id="vs_abc123",
    limit=20,
    order='desc',
    filter_status='completed',
    after=None,
    before=None
)

for file in result['files']:
    print(f"{file['id']}: {file['status']} ({file['usage_bytes']} bytes)")
```

**Paramètres:**
- `limit`: 1-100 (défaut: 20)
- `order`: 'asc' ou 'desc' (défaut: 'desc')
- `filter_status`: 'in_progress', 'completed', 'failed', 'cancelled'
- `after`/`before`: Curseurs de pagination

**Retour:**
```json
{
  "success": true,
  "files": [
    {
      "id": "file-abc123",
      "status": "completed",
      "created_at": 1699061776,
      "usage_bytes": 1234
    }
  ],
  "has_more": false,
  "first_id": "file-abc123",
  "last_id": "file-abc456"
}
```

### 3. Récupérer les Détails d'un Fichier

**Méthode:** `get_vector_store_file()`

```python
result = ai_service.get_vector_store_file(
    vector_store_id="vs_abc123",
    file_id="file-xyz789"
)

print(f"Status: {result['status']}")
print(f"Attributes: {result['attributes']}")
print(f"Chunking: {result['chunking_strategy']}")
```

### 4. Retirer un Fichier d'un Vector Store

**Méthode:** `delete_vector_store_file()`

```python
result = ai_service.delete_vector_store_file(
    vector_store_id="vs_abc123",
    file_id="file-xyz789"
)

if result['deleted']:
    print("Fichier retiré du vector store")
```

**Important:** Le fichier est retiré du vector store mais **n'est PAS supprimé** d'OpenAI. Pour supprimer le fichier complètement, utilisez l'endpoint Files API.

## 🌐 API REST Endpoints

### POST /api/ai/vector-stores/{vector_store_id}/files

Attache un fichier à un vector store.

**Request:**
```bash
curl -X POST http://localhost:5000/api/ai/vector-stores/vs_abc123/files \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "file_id": "file-xyz789",
    "attributes": {
      "category": "documentation",
      "version": "2.0"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "id": "file-abc123",
  "status": "in_progress",
  "vector_store_id": "vs_abc123"
}
```

### GET /api/ai/vector-stores/{vector_store_id}/files

Liste les fichiers d'un vector store.

**Request:**
```bash
curl "http://localhost:5000/api/ai/vector-stores/vs_abc123/files?limit=10&filter=completed" \
  -H "Authorization: Bearer token"
```

### GET /api/ai/vector-stores/{vector_store_id}/files/{file_id}

Récupère les détails d'un fichier.

### DELETE /api/ai/vector-stores/{vector_store_id}/files/{file_id}

Retire un fichier du vector store.

## 🎯 Cas d'Usage

### 1. Knowledge Base pour Support Client

```python
# 1. Créer un vector store
from openai import OpenAI
client = OpenAI(api_key=api_key)

vector_store = client.beta.vector_stores.create(
    name="Support Knowledge Base"
)

# 2. Uploader la documentation
with open("faq.pdf", "rb") as f:
    file = client.files.create(
        file=f,
        purpose="assistants"
    )

# 3. Attacher au vector store
ai_service.create_vector_store_file(
    vector_store_id=vector_store.id,
    file_id=file.id,
    attributes={
        "type": "faq",
        "language": "fr",
        "version": "1.0"
    }
)

# 4. Utiliser avec un Assistant
assistant = client.beta.assistants.create(
    name="Support Bot",
    instructions="Tu es un assistant support. Utilise la base de connaissances pour répondre.",
    model="gpt-4-turbo",
    tools=[{"type": "file_search"}],
    tool_resources={
        "file_search": {
            "vector_store_ids": [vector_store.id]
        }
    }
)
```

### 2. Recherche dans Documentation Emails

```python
# Indexer tous les emails historiques
email_files = []

for email in emails_archive:
    # Convertir email en fichier texte
    with open(f"email_{email.id}.txt", "w", encoding="utf-8") as f:
        f.write(f"From: {email.sender}\n")
        f.write(f"Subject: {email.subject}\n\n")
        f.write(email.body)
    
    # Uploader
    with open(f"email_{email.id}.txt", "rb") as f:
        file = client.files.create(file=f, purpose="assistants")
    
    # Attacher au vector store
    ai_service.create_vector_store_file(
        vector_store_id=email_vector_store_id,
        file_id=file.id,
        attributes={
            "email_id": str(email.id),
            "sender": email.sender,
            "date": str(email.date)
        }
    )

# Rechercher dans tous les emails
thread = client.beta.threads.create(
    messages=[{
        "role": "user",
        "content": "Trouve tous les emails concernant les retards de livraison"
    }]
)

run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id
)
```

### 3. Classification Automatique avec Métadonnées

```python
# Organiser par catégories
files_by_category = ai_service.list_vector_store_files(
    vector_store_id=vs_id,
    limit=100
)

# Filtrer par attributs
support_files = [
    f for f in files_by_category['files']
    if f.get('attributes', {}).get('category') == 'support'
]

print(f"Fichiers support: {len(support_files)}")
```

## 📊 Chunking Strategies

### Auto Chunking (Défaut)

OpenAI choisit automatiquement la meilleure stratégie.

```python
# Pas besoin de spécifier chunking_strategy
ai_service.create_vector_store_file(
    vector_store_id=vs_id,
    file_id=file_id
)
```

### Static Chunking

Découpage fixe avec chevauchement.

```python
ai_service.create_vector_store_file(
    vector_store_id=vs_id,
    file_id=file_id,
    chunking_strategy={
        "type": "static",
        "static": {
            "max_chunk_size_tokens": 800,  # Max tokens par chunk
            "chunk_overlap_tokens": 400     # Tokens de chevauchement
        }
    }
)
```

**Recommandations:**
- **Documents courts (< 10 pages):** Auto chunking
- **Documents longs:** Static avec `max_chunk_size_tokens=800`
- **Texte technique:** Augmenter le chevauchement à 400-600 tokens

## 🔄 Workflow Complet

```python
from openai import OpenAI
from backend.app import ai_service

# 1. Initialiser
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# 2. Créer vector store
vs = client.beta.vector_stores.create(
    name="IAPosteManager Emails KB",
    expires_after={
        "anchor": "last_active_at",
        "days": 7  # Expire après 7 jours d'inactivité
    }
)

# 3. Uploader et attacher fichiers
files = ["emails_2024.pdf", "faq.md", "procedures.docx"]

for filename in files:
    # Upload
    with open(filename, "rb") as f:
        file_obj = client.files.create(file=f, purpose="assistants")
    
    # Attach
    result = ai_service.create_vector_store_file(
        vector_store_id=vs.id,
        file_id=file_obj.id,
        attributes={
            "filename": filename,
            "upload_date": str(datetime.now())
        }
    )
    
    print(f"✓ {filename}: {result['status']}")

# 4. Attendre que tous soient processed
import time

while True:
    files_list = ai_service.list_vector_store_files(vs.id)
    
    statuses = [f['status'] for f in files_list['files']]
    completed = statuses.count('completed')
    total = len(statuses)
    
    print(f"Processing: {completed}/{total}")
    
    if all(s == 'completed' for s in statuses):
        break
    
    time.sleep(2)

# 5. Créer Assistant avec vector store
assistant = client.beta.assistants.create(
    name="Email Assistant",
    model="gpt-4-turbo",
    tools=[{"type": "file_search"}],
    tool_resources={
        "file_search": {
            "vector_store_ids": [vs.id]
        }
    }
)

print(f"✅ Assistant créé: {assistant.id}")
```

## 💾 Stockage & Limites

### Limites Techniques

- **Taille max par fichier:** 512 MB
- **Fichiers par vector store:** 10,000 max
- **Vector stores par organisation:** Illimité
- **Formats supportés:** `.c`, `.cpp`, `.css`, `.csv`, `.docx`, `.gif`, `.html`, `.java`, `.jpeg`, `.jpg`, `.js`, `.json`, `.md`, `.pdf`, `.php`, `.png`, `.pptx`, `.py`, `.rb`, `.sh`, `.tar`, `.tex`, `.ts`, `.txt`, `.webp`, `.xlsx`, `.xml`, `.zip`

### Coûts

- **Stockage:** $0.10/GB/jour
- **Recherche (File Search):** Inclus dans les coûts de l'Assistant

## 🔐 Sécurité & Bonnes Pratiques

### Métadonnées Sensibles

```python
# ❌ NE PAS faire
attributes = {
    "password": "secret123",  # Jamais de mots de passe!
    "api_key": "sk-..."       # Jamais de clés API!
}

# ✅ BON
attributes = {
    "category": "confidential",
    "department": "legal",
    "access_level": "restricted"
}
```

### Nettoyage Régulier

```python
# Supprimer les fichiers obsolètes
files = ai_service.list_vector_store_files(vs_id, limit=100)

for file in files['files']:
    # Vérifier âge
    age_days = (time.time() - file['created_at']) / 86400
    
    if age_days > 30:  # Plus de 30 jours
        ai_service.delete_vector_store_file(vs_id, file['id'])
        print(f"Supprimé: {file['id']}")
```

## 📈 Monitoring

### Surveiller l'Usage

```python
# Statistiques du vector store
files = ai_service.list_vector_store_files(vs_id, limit=100)

total_bytes = sum(f.get('usage_bytes', 0) for f in files['files'])
total_files = len(files['files'])

print(f"Fichiers: {total_files}")
print(f"Usage: {total_bytes / 1024 / 1024:.2f} MB")
print(f"Coût estimé/jour: ${total_bytes / 1024 / 1024 / 1024 * 0.10:.4f}")
```

### Statuts des Fichiers

```python
files = ai_service.list_vector_store_files(vs_id, limit=100)

statuses = {}
for file in files['files']:
    status = file['status']
    statuses[status] = statuses.get(status, 0) + 1

for status, count in statuses.items():
    print(f"{status}: {count}")
```

## 🚀 Démarrage Rapide

```bash
# 1. Installer/mettre à jour OpenAI
pip install --upgrade openai>=1.12.0

# 2. Tester l'implémentation
python test_vector_stores.py

# 3. Créer votre premier vector store
python -c "
from openai import OpenAI
client = OpenAI()
vs = client.beta.vector_stores.create(name='Test')
print(f'Vector Store ID: {vs.id}')
"

# 4. Ajouter l'ID dans .env
echo "TEST_VECTOR_STORE_ID=vs_xxxx" >> .env
```

## 📚 Ressources

- [OpenAI Vector Stores Docs](https://platform.openai.com/docs/assistants/tools/file-search)
- [Assistants API Guide](https://platform.openai.com/docs/assistants/overview)
- [Chunking Strategies Best Practices](https://platform.openai.com/docs/assistants/tools/file-search/chunking)

---

**Développé pour IAPosteManager v2.2.0**  
**Documentation mise à jour:** 20/12/2024
