# 🤖 Guide Complet Assistants API - IAPosteManager

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Vector Stores API](#vector-stores-api)
4. [Assistants API](#assistants-api)
5. [Threads API](#threads-api)
6. [Messages API](#messages-api)
7. [Runs API](#runs-api)
8. [Run Steps API](#run-steps-api)
9. [Cas d'usage email](#cas-dusage-email)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## 📖 Introduction

L'écosystème **Assistants API** permet de créer des assistants IA persistants avec:
- 🧠 **Mémoire**: Conversations thread persistants
- 📚 **Connaissances**: Vector stores avec file search
- 🔧 **Outils**: Code interpreter, function calling
- ⚡ **Asynchrone**: Exécution non-bloquante

### Workflow complet

```
1. Créer Vector Store → Base de connaissances
2. Créer Assistant → Configuration IA
3. Créer Thread → Nouvelle conversation
4. Ajouter Messages → User/Assistant
5. Créer Run → Exécuter assistant
6. Surveiller Steps → Suivre progression
7. Récupérer résultat → Réponse finale
```

---

## 🏗️ Architecture

### Composants

```
┌─────────────────┐
│  Vector Store   │ → Base connaissances (fichiers indexés)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Assistant     │ → Configuration IA (modèle, instructions, tools)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│     Thread      │ → Conversation persistante
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    Messages     │ → User ↔ Assistant
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│      Run        │ → Exécution assistant sur thread
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Run Steps     │ → Détails exécution (message_creation, tool_calls)
└─────────────────┘
```

### Relation entre APIs

```python
# 1 Vector Store → N Assistants
vector_store → assistants (via tool_resources)

# 1 Assistant → N Threads
assistant → threads (via runs)

# 1 Thread → N Messages
thread → messages

# 1 Thread → N Runs
thread → runs (exécutions successives)

# 1 Run → N Steps
run → steps (détails exécution)
```

---

## 📦 Vector Stores API

### Créer un vector store

**Backend:**
```python
result = unified_ai.create_vector_store(
    name="Base emails clients",
    file_ids=["file-abc123", "file-def456"],  # Fichiers à indexer
    expires_after={
        'anchor': 'last_active_at',
        'days': 7  # Expire après 7j inactivité
    },
    chunking_strategy={
        'type': 'auto'  # Découpage automatique
    },
    metadata={
        'category': 'customer_emails',
        'version': '1.0'
    }
)

vector_store_id = result['id']
```

**API Endpoint:**
```bash
POST /api/ai/vector-stores
Content-Type: application/json

{
  "name": "Base emails clients",
  "file_ids": ["file-abc123"],
  "metadata": {
    "category": "customer_emails"
  }
}
```

**Frontend:**
```javascript
const response = await fetch('/api/ai/vector-stores', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa('user:password')}`
  },
  body: JSON.stringify({
    name: 'Base emails clients',
    file_ids: ['file-abc123']
  })
});

const vectorStore = await response.json();
console.log('Vector Store:', vectorStore.id);
```

### Lister vector stores

**Backend:**
```python
result = unified_ai.list_vector_stores(
    limit=20,
    order='desc'
)

for vs in result['data']:
    print(f"{vs['name']}: {vs['file_counts']['total']} fichiers")
```

**API:**
```bash
GET /api/ai/vector-stores?limit=20&order=desc
```

### Récupérer un vector store

**Backend:**
```python
result = unified_ai.get_vector_store('vs_abc123')

print(f"Nom: {result['name']}")
print(f"Fichiers: {result['file_counts']}")
print(f"Status: {result['status']}")
```

### Mettre à jour

**Backend:**
```python
result = unified_ai.update_vector_store(
    vector_store_id='vs_abc123',
    name="Base emails clients - V2",
    metadata={'version': '2.0'}
)
```

### Supprimer

**Backend:**
```python
result = unified_ai.delete_vector_store('vs_abc123')
# result['deleted'] = True
```

---

## 🤖 Assistants API

### Créer un assistant

**Backend:**
```python
result = unified_ai.create_assistant(
    model='gpt-4-turbo-preview',
    name='Assistant Email Pro',
    description='Assistant spécialisé emails professionnels',
    
    instructions="""Tu es un assistant email expert.
    
Responsabilités:
- Rédiger emails professionnels
- Analyser sentiment
- Proposer réponses
- Classer par priorité

Style: Professionnel, courtois, concis.
Langue: Français
""",
    
    tools=[
        {'type': 'file_search'},      # Recherche dans vector stores
        {'type': 'code_interpreter'}  # Exécution code Python
    ],
    
    tool_resources={
        'file_search': {
            'vector_store_ids': ['vs_abc123']
        }
    },
    
    metadata={
        'type': 'email',
        'language': 'fr',
        'version': '1.0'
    },
    
    temperature=0.7,
    top_p=0.9
)

assistant_id = result['id']
```

**API Endpoint:**
```bash
POST /api/ai/assistants
Content-Type: application/json

{
  "model": "gpt-4-turbo-preview",
  "name": "Assistant Email Pro",
  "instructions": "Tu es un assistant email expert...",
  "tools": [
    {"type": "file_search"},
    {"type": "code_interpreter"}
  ],
  "tool_resources": {
    "file_search": {
      "vector_store_ids": ["vs_abc123"]
    }
  },
  "temperature": 0.7
}
```

**Frontend:**
```javascript
const assistant = await fetch('/api/ai/assistants', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa('user:password')}`
  },
  body: JSON.stringify({
    model: 'gpt-4-turbo-preview',
    name: 'Assistant Email Pro',
    instructions: 'Tu es un assistant email expert...',
    tools: [
      { type: 'file_search' }
    ],
    temperature: 0.7
  })
}).then(r => r.json());

console.log('Assistant créé:', assistant.id);
```

### Lister assistants

**Backend:**
```python
result = unified_ai.list_assistants(limit=10)

for asst in result['data']:
    print(f"{asst['name']} ({asst['model']})")
```

### Mettre à jour

**Backend:**
```python
result = unified_ai.update_assistant(
    assistant_id='asst_abc123',
    temperature=0.5,
    instructions="Instructions mises à jour...",
    metadata={'version': '1.1'}
)
```

**API:**
```bash
POST /api/ai/assistants/asst_abc123
Content-Type: application/json

{
  "temperature": 0.5,
  "metadata": {"version": "1.1"}
}
```

---

## 💬 Threads API

### Créer un thread

**Backend:**
```python
# Thread vide
result = unified_ai.create_thread(
    metadata={
        'customer_id': 'CUST_12345',
        'topic': 'support',
        'priority': 'high'
    }
)

# Thread avec messages initiaux
result = unified_ai.create_thread(
    messages=[
        {
            'role': 'user',
            'content': 'J\'ai un problème avec ma commande #12345'
        }
    ],
    metadata={'customer_id': 'CUST_12345'}
)

thread_id = result['id']
```

**API:**
```bash
POST /api/ai/threads
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "J'ai un problème avec ma commande"
    }
  ],
  "metadata": {
    "customer_id": "CUST_12345"
  }
}
```

**Frontend:**
```javascript
const thread = await fetch('/api/ai/threads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa('user:password')}`
  },
  body: JSON.stringify({
    metadata: {
      customer_id: 'CUST_12345',
      topic: 'support'
    }
  })
}).then(r => r.json());

console.log('Thread ID:', thread.id);
```

### Récupérer thread

**Backend:**
```python
result = unified_ai.get_thread('thread_abc123')
print(f"Métadonnées: {result['metadata']}")
```

### Mettre à jour

**Backend:**
```python
result = unified_ai.update_thread(
    thread_id='thread_abc123',
    metadata={
        'status': 'resolved',
        'resolved_at': '2024-12-20T10:30:00Z'
    }
)
```

---

## 📨 Messages API

### Créer un message

**Backend:**
```python
result = unified_ai.create_message(
    thread_id='thread_abc123',
    role='user',  # 'user' ou 'assistant'
    content='Peux-tu analyser cet email?',
    
    # Avec fichiers
    attachments=[
        {
            'file_id': 'file-abc123',
            'tools': [{'type': 'file_search'}]
        }
    ],
    
    metadata={'urgent': True}
)

message_id = result['id']
```

**API:**
```bash
POST /api/ai/threads/thread_abc123/messages
Content-Type: application/json

{
  "role": "user",
  "content": "Peux-tu analyser cet email?",
  "attachments": [
    {
      "file_id": "file-abc123",
      "tools": [{"type": "file_search"}]
    }
  ]
}
```

**Frontend:**
```javascript
const message = await fetch('/api/ai/threads/thread_abc123/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa('user:password')}`
  },
  body: JSON.stringify({
    role: 'user',
    content: 'Peux-tu analyser cet email?'
  })
}).then(r => r.json());
```

### Lister messages

**Backend:**
```python
result = unified_ai.list_messages(
    thread_id='thread_abc123',
    limit=20,
    order='desc'  # Plus récents en premier
)

for msg in result['data']:
    content = msg['content'][0]['text']['value']
    print(f"[{msg['role']}] {content}")
```

**API:**
```bash
GET /api/ai/threads/thread_abc123/messages?limit=20&order=desc
```

### Récupérer un message

**Backend:**
```python
result = unified_ai.get_message(
    thread_id='thread_abc123',
    message_id='msg_abc123'
)

# Extraire le texte
for content in result['content']:
    if content['type'] == 'text':
        text = content['text']['value']
        print(text)
        
        # Citations (si file_search utilisé)
        for annotation in content['text']['annotations']:
            print(f"Citation: {annotation}")
```

---

## 🏃 Runs API

### Créer un run

**Backend:**
```python
result = unified_ai.create_run(
    thread_id='thread_abc123',
    assistant_id='asst_abc123',
    
    # Override instructions
    instructions="Analyse cet email et propose 3 réponses",
    
    # Instructions additionnelles
    additional_instructions="Utilise un ton très professionnel",
    
    # Override model
    model='gpt-4-turbo-preview',
    
    # Contrôle tokens
    max_prompt_tokens=1000,
    max_completion_tokens=500,
    
    metadata={'test': True}
)

run_id = result['id']
status = result['status']  # 'queued', 'in_progress', ...
```

**API:**
```bash
POST /api/ai/threads/thread_abc123/runs
Content-Type: application/json

{
  "assistant_id": "asst_abc123",
  "instructions": "Analyse cet email et propose 3 réponses",
  "model": "gpt-4-turbo-preview"
}
```

**Frontend:**
```javascript
const run = await fetch('/api/ai/threads/thread_abc123/runs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa('user:password')}`
  },
  body: JSON.stringify({
    assistant_id: 'asst_abc123',
    instructions: 'Analyse cet email'
  })
}).then(r => r.json());

console.log('Run créé:', run.id, 'Status:', run.status);
```

### Surveiller un run (Polling)

**Backend:**
```python
import time

run_id = 'run_abc123'
thread_id = 'thread_abc123'

while True:
    result = unified_ai.get_run(thread_id, run_id)
    status = result['status']
    
    print(f"Status: {status}")
    
    if status == 'completed':
        print("✅ Terminé!")
        print(f"Tokens: {result['usage']['total_tokens']}")
        break
    
    elif status == 'requires_action':
        # Tool calling requis
        required_action = result['required_action']
        tool_calls = required_action['submit_tool_outputs']['tool_calls']
        
        # Exécuter les tools et soumettre résultats
        tool_outputs = []
        for tool_call in tool_calls:
            # Votre logique ici
            output = execute_function(tool_call)
            tool_outputs.append({
                'tool_call_id': tool_call['id'],
                'output': output
            })
        
        # Soumettre
        unified_ai.submit_tool_outputs(
            thread_id=thread_id,
            run_id=run_id,
            tool_outputs=tool_outputs
        )
    
    elif status in ['failed', 'cancelled', 'expired']:
        print(f"❌ Échec: {result.get('last_error')}")
        break
    
    time.sleep(1)  # Attendre 1s avant re-check
```

**Frontend (avec polling):**
```javascript
async function waitForRunCompletion(threadId, runId) {
  while (true) {
    const run = await fetch(`/api/ai/threads/${threadId}/runs/${runId}`, {
      headers: {
        'Authorization': `Basic ${btoa('user:password')}`
      }
    }).then(r => r.json());
    
    console.log('Status:', run.status);
    
    if (run.status === 'completed') {
      console.log('✅ Terminé!');
      console.log('Tokens:', run.usage.total_tokens);
      return run;
    }
    
    if (run.status === 'requires_action') {
      // Handle tool calling
      const toolOutputs = await handleToolCalls(run.required_action);
      
      await fetch(`/api/ai/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('user:password')}`
        },
        body: JSON.stringify({ tool_outputs: toolOutputs })
      });
    }
    
    if (['failed', 'cancelled', 'expired'].includes(run.status)) {
      console.error('❌ Échec:', run.last_error);
      throw new Error(run.status);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Utilisation
const run = await waitForRunCompletion('thread_abc123', 'run_abc123');
```

### Annuler un run

**Backend:**
```python
result = unified_ai.cancel_run(
    thread_id='thread_abc123',
    run_id='run_abc123'
)

print(f"Run annulé: {result['cancelled_at']}")
```

**API:**
```bash
POST /api/ai/threads/thread_abc123/runs/run_abc123/cancel
```

---

## 👣 Run Steps API

### Lister les steps

**Backend:**
```python
result = unified_ai.list_run_steps(
    thread_id='thread_abc123',
    run_id='run_abc123',
    limit=10
)

for step in result['data']:
    print(f"Step {step['id']}")
    print(f"  Type: {step['type']}")
    print(f"  Status: {step['status']}")
    
    if step['step_details']['type'] == 'message_creation':
        msg_id = step['step_details']['message_creation']['message_id']
        print(f"  Message créé: {msg_id}")
    
    elif step['step_details']['type'] == 'tool_calls':
        for tool_call in step['step_details']['tool_calls']:
            print(f"  Tool: {tool_call['type']}")
    
    if step['usage']:
        print(f"  Tokens: {step['usage']['total_tokens']}")
```

**API:**
```bash
GET /api/ai/threads/thread_abc123/runs/run_abc123/steps?limit=10
```

---

## 📧 Cas d'usage Email

### Scenario 1: Assistant Email Pro

```python
# 1. Créer vector store avec FAQ
vs = unified_ai.create_vector_store(
    name="FAQ Emails",
    file_ids=["file-faq.pdf", "file-templates.docx"]
)

# 2. Créer assistant
assistant = unified_ai.create_assistant(
    model='gpt-4-turbo-preview',
    name='Assistant Email',
    instructions="""Tu es un assistant email professionnel.
    
Utilise la base de connaissances pour:
- Proposer des réponses adaptées
- Respecter les templates d'entreprise
- Maintenir un ton professionnel
""",
    tools=[{'type': 'file_search'}],
    tool_resources={
        'file_search': {
            'vector_store_ids': [vs['id']]
        }
    }
)

# 3. Pour chaque email reçu, créer thread
thread = unified_ai.create_thread(
    messages=[
        {
            'role': 'user',
            'content': f"Email reçu:\n\n{email_content}"
        }
    ],
    metadata={
        'email_id': email_id,
        'customer_id': customer_id
    }
)

# 4. Lancer run
run = unified_ai.create_run(
    thread_id=thread['id'],
    assistant_id=assistant['id'],
    instructions="Propose 3 réponses possibles avec ton adapté"
)

# 5. Attendre complétion
while True:
    run_status = unified_ai.get_run(thread['id'], run['id'])
    if run_status['status'] == 'completed':
        break
    time.sleep(1)

# 6. Récupérer réponse
messages = unified_ai.list_messages(thread['id'], limit=1)
response = messages['data'][0]['content'][0]['text']['value']

print(f"Réponse suggérée:\n{response}")
```

### Scenario 2: Classification emails

```python
# Assistant de classification
classifier = unified_ai.create_assistant(
    model='gpt-3.5-turbo',
    name='Email Classifier',
    instructions="""Classe les emails en catégories:
- urgent
- normal
- spam
- support
- commercial

Retourne JSON: {"category": "...", "priority": 1-5, "sentiment": "..."}
""",
    response_format={'type': 'json_object'}
)

# Pour chaque email
thread = unified_ai.create_thread()
unified_ai.create_message(
    thread_id=thread['id'],
    role='user',
    content=email_content
)

run = unified_ai.create_run(
    thread_id=thread['id'],
    assistant_id=classifier['id']
)

# Récupérer classification
# ... polling ...
messages = unified_ai.list_messages(thread['id'], limit=1)
classification = json.loads(messages['data'][0]['content'][0]['text']['value'])

print(f"Catégorie: {classification['category']}")
print(f"Priorité: {classification['priority']}/5")
```

### Scenario 3: Thread persistant client

```python
# 1 thread par client
customer_thread_id = get_or_create_thread(customer_id)

# Ajouter nouveau message
unified_ai.create_message(
    thread_id=customer_thread_id,
    role='user',
    content=f"Nouvel email du {date}:\n\n{content}"
)

# Lancer assistant avec context complet
run = unified_ai.create_run(
    thread_id=customer_thread_id,
    assistant_id=assistant_id,
    instructions="Tiens compte de l'historique complet de la conversation"
)

# L'assistant voit TOUS les messages précédents!
```

---

## 💡 Best Practices

### 1. Gestion des threads

```python
# ✅ BON: 1 thread par conversation logique
thread_per_customer = {
    'CUST_123': 'thread_abc',
    'CUST_456': 'thread_def'
}

# ❌ MAUVAIS: Nouveau thread pour chaque message
# Perte du contexte!
```

### 2. Métadonnées

```python
# ✅ BON: Métadonnées riches pour recherche
metadata = {
    'customer_id': 'CUST_123',
    'email_id': 'EMAIL_456',
    'topic': 'billing',
    'priority': 'high',
    'language': 'fr',
    'created_at': '2024-12-20T10:00:00Z',
    'tags': ['urgent', 'refund']
}

# ❌ MAUVAIS: Pas de métadonnées
metadata = {}
```

### 3. Instructions assistant

```python
# ✅ BON: Instructions claires et spécifiques
instructions = """Tu es un assistant email B2B professionnel.

RÔLE:
- Rédiger réponses professionnelles
- Analyser sentiment client
- Proposer actions

STYLE:
- Formel mais chaleureux
- Concis (max 200 mots)
- Français impeccable

CONTRAINTES:
- Ne jamais promettre ce que tu ne peux garantir
- Toujours proposer alternatives
- Escalader si > 1000€ en jeu
"""

# ❌ MAUVAIS: Instructions vagues
instructions = "Tu aides avec les emails"
```

### 4. Gestion erreurs

```python
# ✅ BON: Gestion complète
try:
    run = unified_ai.create_run(...)
    
    # Timeout après 60s
    start = time.time()
    while time.time() - start < 60:
        status = unified_ai.get_run(...)
        
        if status['status'] == 'completed':
            break
        elif status['status'] == 'failed':
            error = status['last_error']
            log_error(f"Run failed: {error['code']} - {error['message']}")
            # Fallback
            use_simple_completion()
            break
        
        time.sleep(1)
    else:
        # Timeout
        unified_ai.cancel_run(...)
        log_error("Run timeout")
        
except Exception as e:
    log_error(f"Exception: {e}")
    # Fallback
```

### 5. Optimisation coûts

```python
# ✅ BON: Limiter tokens
run = unified_ai.create_run(
    thread_id=thread_id,
    assistant_id=assistant_id,
    max_prompt_tokens=1000,      # Limite input
    max_completion_tokens=500,    # Limite output
    truncation_strategy={
        'type': 'last_messages',
        'last_messages': 10        # Garder que 10 derniers messages
    }
)

# ❌ MAUVAIS: Pas de limites
# Peut coûter très cher avec longs threads!
```

### 6. Tool calling

```python
# ✅ BON: Functions claires
tools = [
    {
        'type': 'function',
        'function': {
            'name': 'search_orders',
            'description': 'Recherche les commandes d\'un client',
            'parameters': {
                'type': 'object',
                'properties': {
                    'customer_id': {
                        'type': 'string',
                        'description': 'ID du client'
                    },
                    'status': {
                        'type': 'string',
                        'enum': ['pending', 'shipped', 'delivered']
                    }
                },
                'required': ['customer_id']
            }
        }
    }
]

# Gérer requires_action
if run['status'] == 'requires_action':
    tool_outputs = []
    for call in run['required_action']['submit_tool_outputs']['tool_calls']:
        if call['function']['name'] == 'search_orders':
            args = json.loads(call['function']['arguments'])
            result = search_orders(args['customer_id'])
            tool_outputs.append({
                'tool_call_id': call['id'],
                'output': json.dumps(result)
            })
    
    unified_ai.submit_tool_outputs(
        thread_id=thread_id,
        run_id=run_id,
        tool_outputs=tool_outputs
    )
```

---

## 🔧 Troubleshooting

### Run bloqué en 'in_progress'

```python
# Vérifier les steps
steps = unified_ai.list_run_steps(thread_id, run_id)

for step in steps['data']:
    if step['status'] == 'in_progress':
        print(f"Bloqué sur step: {step['type']}")
        
        if step['type'] == 'tool_calls':
            # Probablement en attente de tool outputs
            print("Requires tool outputs!")
```

### Erreur 'rate_limit_exceeded'

```python
# Attendre et réessayer
import time

max_retries = 3
for attempt in range(max_retries):
    try:
        result = unified_ai.create_run(...)
        break
    except Exception as e:
        if 'rate_limit' in str(e):
            wait = 2 ** attempt  # Exponential backoff
            print(f"Rate limited, attente {wait}s...")
            time.sleep(wait)
        else:
            raise
```

### Messages vides

```python
# Vérifier le content
messages = unified_ai.list_messages(thread_id)

for msg in messages['data']:
    if not msg['content']:
        print(f"Message vide: {msg['id']}")
    else:
        for content in msg['content']:
            if content['type'] == 'text':
                print(content['text']['value'])
            elif content['type'] == 'image_file':
                print(f"Image: {content['image_file']['file_id']}")
```

### Run failed

```python
run = unified_ai.get_run(thread_id, run_id)

if run['status'] == 'failed':
    error = run['last_error']
    
    if error['code'] == 'server_error':
        # Réessayer
        new_run = unified_ai.create_run(...)
    
    elif error['code'] == 'invalid_prompt':
        # Problème avec instructions/messages
        print(f"Prompt invalide: {error['message']}")
        # Modifier et réessayer
    
    elif error['code'] == 'rate_limit_exceeded':
        # Attendre
        time.sleep(60)
```

---

## 📊 Résumé des limites

| Ressource | Limite |
|-----------|--------|
| Assistants par organisation | 100 (plus si demandé) |
| Threads par assistant | Illimité |
| Messages par thread | 100,000 |
| Files par vector store | 10,000 |
| Vector stores | 100 |
| Instructions | 256,000 caractères |
| Metadata | 16 paires clé-valeur |
| Runs simultanés | 100 |

---

## 🚀 Prochaines étapes

1. **Tester** avec `test_assistants_complete.py`
2. **Intégrer** dans votre flux email
3. **Optimiser** les prompts
4. **Monitorer** les coûts
5. **Créer** UI pour gestion assistants

---

**Version:** 1.0  
**Date:** 20 décembre 2024  
**Auteur:** IAPosteManager Team
