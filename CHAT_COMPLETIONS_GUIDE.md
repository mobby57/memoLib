# Chat Completions API - Guide Complet

## 📚 Vue d'ensemble

L'API Chat Completions permet de générer des réponses conversationnelles avec les modèles GPT d'OpenAI. C'est l'API principale pour créer des chatbots, assistants virtuels, et systèmes de génération de texte.

## 🎯 Cas d'usage

### 1. Génération automatique de réponses emails
```python
response = ai_service.create_chat_completion(
    messages=[
        {"role": "system", "content": "Tu es un assistant email professionnel."},
        {"role": "user", "content": "Rédige une réponse polie pour refuser une invitation."}
    ],
    model="gpt-4o-mini",
    temperature=0.7
)
```

### 2. Analyse d'emails
```python
response = ai_service.create_chat_completion(
    messages=[
        {"role": "system", "content": "Tu analyses des emails et extrais les points clés."},
        {"role": "user", "content": email_content}
    ],
    response_format={"type": "json_object"}
)
```

### 3. Suggestions de réponse
```python
response = ai_service.create_chat_completion(
    messages=[
        {"role": "system", "content": "Tu suggères des réponses courtes pour emails."},
        {"role": "user", "content": f"Email reçu: {email}"}
    ],
    n=3,  # 3 suggestions différentes
    temperature=0.9
)
```

## 🛠️ Méthodes disponibles

### 1. `create_chat_completion()`
Crée une nouvelle completion de chat.

**Paramètres:**
```python
ai_service.create_chat_completion(
    messages=[...],              # Liste des messages (REQUIS)
    model="gpt-4o",             # Modèle à utiliser
    temperature=1.0,            # 0-2: créativité (0=déterministe, 2=très créatif)
    max_tokens=None,            # Limite de tokens générés
    stream=False,               # Streaming pour réponses en temps réel
    store=False,                # Stocker pour récupération ultérieure
    metadata={},                # Métadonnées personnalisées
    
    # Paramètres avancés
    top_p=1.0,                 # Nucleus sampling
    frequency_penalty=0.0,      # -2 à 2: pénalise répétitions
    presence_penalty=0.0,       # -2 à 2: encourage nouveaux sujets
    stop=None,                  # Séquences d'arrêt
    n=1,                        # Nombre de complétions à générer
    logprobs=False,             # Probabilités log des tokens
    response_format=None,       # Format de réponse (json_object)
    tools=None,                 # Fonction calling
    tool_choice=None,           # Contrôle d'utilisation des outils
    seed=None,                  # Seed pour reproductibilité
    reasoning_effort=None       # Effort de raisonnement (GPT-4o uniquement)
)
```

**Retour:**
```python
{
    'success': True,
    'id': 'chatcmpl-ABC123',
    'model': 'gpt-4o-2024-08-06',
    'choices': [
        {
            'index': 0,
            'message': {
                'role': 'assistant',
                'content': 'Réponse générée...'
            },
            'finish_reason': 'stop'
        }
    ],
    'usage': {
        'prompt_tokens': 25,
        'completion_tokens': 150,
        'total_tokens': 175
    },
    'created': 1234567890
}
```

### 2. `get_chat_completion(completion_id)`
Récupère une completion stockée.

**Exemple:**
```python
result = ai_service.get_chat_completion("chatcmpl-ABC123")

if result['success']:
    print(result['choices'][0]['message']['content'])
    print(result['metadata'])
```

### 3. `list_chat_completions()`
Liste les completions stockées avec pagination.

**Paramètres:**
```python
result = ai_service.list_chat_completions(
    limit=20,              # 1-100 résultats
    order='asc',           # 'asc' ou 'desc'
    after='cursor_id',     # Pagination
    model_filter='gpt-4o', # Filtrer par modèle
    metadata_filter={}     # Filtrer par métadonnées
)
```

**Retour:**
```python
{
    'success': True,
    'completions': [
        {
            'id': 'chatcmpl-123',
            'model': 'gpt-4o',
            'created': 1234567890,
            'usage': {'total_tokens': 175}
        }
    ],
    'has_more': True,
    'last_id': 'chatcmpl-456'
}
```

### 4. `update_chat_completion()`
Met à jour les métadonnées d'une completion.

**Exemple:**
```python
result = ai_service.update_chat_completion(
    completion_id="chatcmpl-ABC123",
    metadata={
        "status": "reviewed",
        "rating": "5",
        "reviewed_by": "admin"
    }
)
```

### 5. `delete_chat_completion()`
Supprime une completion stockée.

**Exemple:**
```python
result = ai_service.delete_chat_completion("chatcmpl-ABC123")

if result['success'] and result['deleted']:
    print("Completion supprimée avec succès")
```

### 6. `get_chat_messages()`
Récupère les messages d'une completion stockée.

**Exemple:**
```python
result = ai_service.get_chat_messages(
    completion_id="chatcmpl-ABC123",
    limit=50,
    order='asc'
)

for message in result['messages']:
    print(f"{message['role']}: {message['content']}")
```

## 📡 API REST Endpoints

### POST `/api/ai/chat/completions`
Crée une completion.

**Request:**
```bash
curl -X POST http://localhost:5000/api/ai/chat/completions \
  -u user@example.com:password \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "Tu es un assistant email."},
      {"role": "user", "content": "Écris une réponse professionnelle."}
    ],
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 200,
    "store": true,
    "metadata": {
      "user_id": "123",
      "category": "email_response"
    }
  }'
```

### GET `/api/ai/chat/completions/{id}`
Récupère une completion.

**Request:**
```bash
curl -X GET http://localhost:5000/api/ai/chat/completions/chatcmpl-ABC123 \
  -u user@example.com:password
```

### GET `/api/ai/chat/completions`
Liste les completions.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/ai/chat/completions?limit=10&order=desc" \
  -u user@example.com:password
```

### POST `/api/ai/chat/completions/{id}`
Met à jour les métadonnées.

**Request:**
```bash
curl -X POST http://localhost:5000/api/ai/chat/completions/chatcmpl-ABC123 \
  -u user@example.com:password \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "status": "approved",
      "rating": "5"
    }
  }'
```

### DELETE `/api/ai/chat/completions/{id}`
Supprime une completion.

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/ai/chat/completions/chatcmpl-ABC123 \
  -u user@example.com:password
```

### GET `/api/ai/chat/completions/{id}/messages`
Récupère les messages.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/ai/chat/completions/chatcmpl-ABC123/messages?limit=20" \
  -u user@example.com:password
```

## 🎭 Modèles disponibles

| Modèle | Usage | Prix (Input/Output) | Context |
|--------|-------|---------------------|---------|
| **gpt-4o** | Production, tâches complexes | $2.50 / $10.00 par 1M tokens | 128K |
| **gpt-4o-mini** | Développement, tâches simples | $0.15 / $0.60 par 1M tokens | 128K |
| **gpt-4-turbo** | Haute performance | $10.00 / $30.00 par 1M tokens | 128K |
| **gpt-3.5-turbo** | Économique | $0.50 / $1.50 par 1M tokens | 16K |

## 💡 Exemples d'usage

### Conversation multi-tours
```python
conversation = [
    {"role": "system", "content": "Tu es un expert en email marketing."},
    {"role": "user", "content": "Quand envoyer des emails?"}
]

# Premier tour
response1 = ai_service.create_chat_completion(
    messages=conversation,
    model="gpt-4o-mini"
)

# Ajouter la réponse
conversation.append({
    "role": "assistant", 
    "content": response1['choices'][0]['message']['content']
})

# Continuer
conversation.append({"role": "user", "content": "Et pour les B2B?"})
response2 = ai_service.create_chat_completion(
    messages=conversation,
    model="gpt-4o-mini"
)
```

### Réponse structurée JSON
```python
response = ai_service.create_chat_completion(
    messages=[
        {
            "role": "system",
            "content": "Extrais les informations et retourne en JSON."
        },
        {
            "role": "user",
            "content": email_content
        }
    ],
    response_format={"type": "json_object"},
    temperature=0.3
)

import json
data = json.loads(response['choices'][0]['message']['content'])
```

### Function Calling
```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Envoie un email",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"}
                },
                "required": ["to", "subject", "body"]
            }
        }
    }
]

response = ai_service.create_chat_completion(
    messages=[
        {"role": "user", "content": "Envoie un email de bienvenue à john@example.com"}
    ],
    tools=tools,
    tool_choice="auto"
)

# Vérifier si une fonction a été appelée
if response['choices'][0]['message'].get('tool_calls'):
    # Exécuter la fonction...
    pass
```

### Streaming
```python
response = ai_service.create_chat_completion(
    messages=[...],
    stream=True
)

if response['success']:
    for chunk in response['stream']:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end='', flush=True)
```

## 📊 Contrôle de la créativité

### Temperature (0-2)
```python
# Déterministe (recommandations, extraction)
response = ai_service.create_chat_completion(
    messages=[...],
    temperature=0.0
)

# Équilibré (usage général)
response = ai_service.create_chat_completion(
    messages=[...],
    temperature=0.7
)

# Créatif (brainstorming, écriture)
response = ai_service.create_chat_completion(
    messages=[...],
    temperature=1.5
)
```

### Pénalités de fréquence
```python
response = ai_service.create_chat_completion(
    messages=[...],
    frequency_penalty=0.5,   # Réduit répétitions
    presence_penalty=0.3     # Encourage diversité
)
```

## 🔒 Sécurité et bonnes pratiques

### 1. Métadonnées pour traçabilité
```python
response = ai_service.create_chat_completion(
    messages=[...],
    store=True,
    metadata={
        "user_id": user.id,
        "session_id": session.id,
        "timestamp": datetime.now().isoformat(),
        "purpose": "email_generation"
    }
)
```

### 2. Gestion des erreurs
```python
result = ai_service.create_chat_completion(messages=[...])

if result['success']:
    content = result['choices'][0]['message']['content']
else:
    logger.error(f"Completion failed: {result['error']}")
    # Fallback...
```

### 3. Limites de tokens
```python
# Estimation tokens
def estimate_tokens(text):
    return len(text) / 4  # Approximation

# Éviter dépassement
MAX_TOKENS = 4000
prompt_tokens = estimate_tokens(prompt)
max_response = MAX_TOKENS - prompt_tokens - 100  # Buffer

response = ai_service.create_chat_completion(
    messages=[...],
    max_tokens=max_response
)
```

### 4. Gestion du contexte
```python
# Limiter historique conversation
MAX_HISTORY = 10
conversation = conversation[-MAX_HISTORY:]

response = ai_service.create_chat_completion(
    messages=conversation,
    model="gpt-4o-mini"
)
```

## 💰 Optimisation des coûts

### 1. Choix du modèle
```python
# Simple tâche: gpt-4o-mini (17x moins cher que gpt-4o)
response = ai_service.create_chat_completion(
    messages=[...],
    model="gpt-4o-mini"
)

# Tâche complexe: gpt-4o
response = ai_service.create_chat_completion(
    messages=[...],
    model="gpt-4o"
)
```

### 2. Contrôle tokens
```python
response = ai_service.create_chat_completion(
    messages=[...],
    max_tokens=150,  # Limiter génération
    temperature=0.3  # Plus déterministe = moins de tokens
)
```

### 3. Prompt engineering
```python
# Mauvais: prompt verbeux
messages = [
    {"role": "user", "content": "Pourrais-tu s'il te plaît m'aider à..."}
]

# Bon: prompt concis
messages = [
    {"role": "user", "content": "Rédige une réponse polie de refus."}
]
```

## 🎯 Cas d'usage IAPosteManager

### 1. Génération automatique de réponses
```python
def generate_email_response(email_content, tone="professional"):
    return ai_service.create_chat_completion(
        messages=[
            {
                "role": "system",
                "content": f"Tu génères des réponses d'emails en ton {tone}."
            },
            {
                "role": "user",
                "content": f"Email reçu:\n{email_content}\n\nGénère une réponse."
            }
        ],
        model="gpt-4o-mini",
        temperature=0.7,
        max_tokens=300
    )
```

### 2. Classification d'emails
```python
def classify_email(subject, content):
    return ai_service.create_chat_completion(
        messages=[
            {
                "role": "system",
                "content": "Classe les emails en: urgent, important, spam, marketing."
            },
            {
                "role": "user",
                "content": f"Sujet: {subject}\nContenu: {content}"
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.2
    )
```

### 3. Extraction d'informations
```python
def extract_meeting_info(email):
    return ai_service.create_chat_completion(
        messages=[
            {
                "role": "system",
                "content": "Extrais: date, heure, lieu, participants, sujet."
            },
            {"role": "user", "content": email}
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )
```

### 4. Suggestions de réponse rapide
```python
def quick_reply_suggestions(email):
    return ai_service.create_chat_completion(
        messages=[
            {
                "role": "system",
                "content": "Propose 3 réponses courtes (max 50 mots chacune)."
            },
            {"role": "user", "content": email}
        ],
        n=3,
        temperature=0.9,
        max_tokens=100
    )
```

## 📈 Monitoring et analytics

### Tracking des completions
```python
# Stocker avec métadonnées
response = ai_service.create_chat_completion(
    messages=[...],
    store=True,
    metadata={
        "user_id": user.id,
        "feature": "auto_reply",
        "timestamp": datetime.now().isoformat()
    }
)

# Analyser usage
completions = ai_service.list_chat_completions(
    limit=100,
    metadata_filter={"feature": "auto_reply"}
)

total_tokens = sum(c['usage']['total_tokens'] for c in completions['completions'])
print(f"Tokens utilisés: {total_tokens}")
```

## 🚀 Démarrage rapide

```python
# 1. Import
from backend.app import ai_service

# 2. Première completion
result = ai_service.create_chat_completion(
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
    model="gpt-4o-mini"
)

# 3. Afficher résultat
if result['success']:
    print(result['choices'][0]['message']['content'])
    print(f"Tokens: {result['usage']['total_tokens']}")
```

## 📚 Ressources

- [Documentation officielle OpenAI](https://platform.openai.com/docs/api-reference/chat)
- [Guide des modèles](https://platform.openai.com/docs/models)
- [Tarification](https://openai.com/pricing)
- Test script: `test_chat_completions.py`

---

**Auteur:** IAPosteManager Team  
**Version:** 1.0  
**Dernière mise à jour:** 2024
