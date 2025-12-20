# Guide Realtime API OpenAI - IAPosteManager

## 🎙️ Vue d'ensemble

L'**API Realtime d'OpenAI** permet la communication multimodale en temps réel avec les modèles GPT-4o via **WebRTC**, **WebSocket** et **SIP**. Supportant nativement la **parole-à-parole** ainsi que les entrées/sorties **texte**, **image** et **audio**.

## 🎯 Cas d'usage

- **Assistants vocaux**: Conversations vocales naturelles en temps réel
- **Support client**: Assistance téléphonique automatisée via SIP
- **Traduction simultanée**: Traduction audio en direct
- **Transcription live**: Convertir la parole en texte en temps réel
- **Applications de conférence**: Intégration dans des systèmes de visioconférence
- **Interfaces multimodales**: Combiner texte, audio et images

## 🚀 Démarrage rapide

### 1. Créer un appel WebRTC

```python
import requests

# SDP Offer généré par le client WebRTC
sdp_offer = """
v=0
o=- 4227147428 1719357865 IN IP4 127.0.0.1
s=-
c=IN IP4 0.0.0.0
...
"""

response = requests.post('http://localhost:5000/api/realtime/calls', json={
    'sdp': sdp_offer,
    'session': {
        'model': 'gpt-4o-realtime-preview',
        'modalities': ['text', 'audio'],
        'voice': 'alloy',
        'instructions': 'Tu es un assistant vocal utile.'
    }
})

data = response.json()
print(f"Call ID: {data['call_id']}")
print(f"SDP Answer: {data['sdp_answer']}")
```

### 2. Terminer un appel

```python
response = requests.delete(f'http://localhost:5000/api/realtime/calls/{call_id}')
print(response.json())
```

## 📋 API Endpoints

### Créer un Appel

```http
POST /api/realtime/calls
Content-Type: multipart/form-data

sdp=<offer.sdp>
session={
    "type": "realtime",
    "model": "gpt-4o-realtime-preview",
    "modalities": ["text", "audio"],
    "voice": "alloy",
    "instructions": "Tu es un assistant vocal.",
    "temperature": 0.8
}
```

**Réponse:**
```json
{
    "success": true,
    "call_id": "call_1234567890",
    "sdp_answer": "v=0\no=- 4227147428...",
    "model": "gpt-4o-realtime-preview",
    "status": "active",
    "created_at": 1734700000,
    "session": {
        "model": "gpt-4o-realtime-preview",
        "voice": "alloy",
        "modalities": ["text", "audio"]
    }
}
```

### Récupérer un Appel

```http
GET /api/realtime/calls/{call_id}
```

**Réponse:**
```json
{
    "success": true,
    "call": {
        "call_id": "call_1234567890",
        "model": "gpt-4o-realtime-preview",
        "status": "active",
        "created_at": 1734700000,
        "voice": "alloy",
        "modalities": ["text", "audio"],
        "duration_seconds": null
    }
}
```

### Terminer un Appel

```http
DELETE /api/realtime/calls/{call_id}
```

**Réponse:**
```json
{
    "success": true,
    "call": {
        "call_id": "call_1234567890",
        "status": "ended",
        "ended_at": 1734700300,
        "duration_seconds": 300
    },
    "message": "Appel terminé"
}
```

### Lister les Appels

```http
GET /api/realtime/calls?limit=20&offset=0&status=active
```

**Réponse:**
```json
{
    "success": true,
    "data": [
        {
            "call_id": "call_1234567890",
            "model": "gpt-4o-realtime-preview",
            "status": "active",
            "created_at": 1734700000,
            "voice": "alloy"
        }
    ],
    "count": 1
}
```

### Événements d'un Appel

```http
GET /api/realtime/calls/{call_id}/events?limit=100&event_type=call.created
```

**Réponse:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "call_id": "call_1234567890",
            "event_type": "call.created",
            "timestamp": 1734700000,
            "event_data": {
                "model": "gpt-4o-realtime-preview",
                "voice": "alloy"
            }
        },
        {
            "id": 2,
            "call_id": "call_1234567890",
            "event_type": "call.ended",
            "timestamp": 1734700300,
            "event_data": {
                "duration_seconds": 300
            }
        }
    ],
    "count": 2
}
```

### Statistiques

```http
GET /api/realtime/stats
```

**Réponse:**
```json
{
    "success": true,
    "stats": {
        "total_calls": 42,
        "active_calls": 3,
        "ended_calls": 39,
        "avg_duration_seconds": 245.5,
        "total_events": 168,
        "calls_by_model": {
            "gpt-4o-realtime-preview": 42
        },
        "calls_by_voice": {
            "alloy": 20,
            "echo": 15,
            "shimmer": 7
        }
    }
}
```

## 🔧 Configuration de Session

### Paramètres disponibles

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `model` | string | Modèle à utiliser | `gpt-4o-realtime-preview` |
| `modalities` | array | Types d'entrée/sortie | `['text', 'audio']` |
| `voice` | string | Voix pour audio (alloy, echo, shimmer) | `alloy` |
| `instructions` | string | Instructions système | - |
| `temperature` | float | Créativité (0.6-1.2) | `0.8` |
| `max_response_output_tokens` | int | Limite tokens par réponse | - |

### Exemple de configuration complète

```json
{
    "model": "gpt-4o-realtime-preview",
    "modalities": ["text", "audio"],
    "voice": "shimmer",
    "instructions": "Tu es un assistant vocal expert en français. Réponds de manière concise et claire.",
    "temperature": 0.9,
    "max_response_output_tokens": 4096
}
```

## 🎨 Interface Web

Accédez à l'interface: **http://localhost:5000/realtime-api.html**

### Fonctionnalités

- ✅ Créer des appels WebRTC
- ✅ Visualiser tous les appels (actifs et terminés)
- ✅ Terminer des appels en cours
- ✅ Voir les événements par appel
- ✅ Statistiques globales en temps réel
- ✅ Demo WebRTC avec code exemple

## 💡 Exemples pratiques

### Exemple 1: Assistant vocal simple

```javascript
// Côté client JavaScript

// 1. Créer la connexion WebRTC
const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// 2. Obtenir l'accès au microphone
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
stream.getTracks().forEach(track => pc.addTrack(track, stream));

// 3. Créer l'offre SDP
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

// 4. Envoyer à l'API Realtime
const response = await fetch('http://localhost:5000/api/realtime/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        sdp: pc.localDescription.sdp,
        session: {
            model: 'gpt-4o-realtime-preview',
            modalities: ['text', 'audio'],
            voice: 'alloy',
            instructions: 'Tu es un assistant vocal utile.'
        }
    })
});

const data = await response.json();
const callId = data.call_id;

// 5. Appliquer la réponse SDP
await pc.setRemoteDescription({
    type: 'answer',
    sdp: data.sdp_answer
});

// 6. Écouter l'audio distant
pc.ontrack = (event) => {
    const audioElement = new Audio();
    audioElement.srcObject = event.streams[0];
    audioElement.play();
};

console.log('Connexion établie! Call ID:', callId);
```

### Exemple 2: Support téléphonique SIP

```python
# Configuration pour intégration SIP (Twilio, Vonage, etc.)

import requests

# Les appels SIP utilisent le même endpoint
response = requests.post('http://localhost:5000/api/realtime/calls', json={
    'sdp': sip_sdp_offer,  # SDP généré par le système SIP
    'session': {
        'model': 'gpt-4o-realtime-preview',
        'modalities': ['audio'],
        'voice': 'echo',
        'instructions': '''
            Tu es un agent de support client pour une entreprise.
            - Sois poli et professionnel
            - Pose des questions claires pour comprendre le problème
            - Fournis des solutions étape par étape
            - Si tu ne peux pas aider, propose de transférer à un humain
        ''',
        'temperature': 0.7
    }
})

call_id = response.json()['call_id']
print(f"Appel SIP créé: {call_id}")
```

### Exemple 3: Traduction en temps réel

```javascript
// Configuration pour traduction simultanée

const response = await fetch('http://localhost:5000/api/realtime/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        sdp: localSDP,
        session: {
            model: 'gpt-4o-realtime-preview',
            modalities: ['audio'],
            voice: 'shimmer',
            instructions: `
                Tu es un traducteur en temps réel.
                Écoute l'audio en français et traduis instantanément en anglais.
                Conserve le ton et le style de l'orateur.
            `,
            temperature: 0.6
        }
    })
});
```

### Exemple 4: Monitoring et gestion d'appels

```python
import requests
import time

class RealtimeCallManager:
    def __init__(self, api_base='http://localhost:5000/api/realtime'):
        self.api_base = api_base
        self.active_calls = []
    
    def create_call(self, sdp_offer, config):
        """Crée un nouvel appel"""
        response = requests.post(f'{self.api_base}/calls', json={
            'sdp': sdp_offer,
            'session': config
        })
        data = response.json()
        
        if data['success']:
            self.active_calls.append(data['call_id'])
            return data['call_id']
        return None
    
    def monitor_calls(self):
        """Surveille tous les appels actifs"""
        for call_id in self.active_calls[:]:
            response = requests.get(f'{self.api_base}/calls/{call_id}')
            call = response.json()['call']
            
            if call['status'] == 'ended':
                print(f"Appel {call_id} terminé - Durée: {call['duration_seconds']}s")
                self.active_calls.remove(call_id)
            else:
                print(f"Appel {call_id} en cours")
    
    def hangup_all(self):
        """Termine tous les appels actifs"""
        for call_id in self.active_calls[:]:
            requests.delete(f'{self.api_base}/calls/{call_id}')
            print(f"Appel {call_id} terminé")
            self.active_calls.remove(call_id)
    
    def get_stats(self):
        """Récupère les statistiques"""
        response = requests.get(f'{self.api_base}/stats')
        return response.json()['stats']


# Utilisation
manager = RealtimeCallManager()

# Créer un appel
call_id = manager.create_call(sdp_offer, {
    'model': 'gpt-4o-realtime-preview',
    'voice': 'alloy',
    'modalities': ['audio']
})

# Surveiller
while manager.active_calls:
    manager.monitor_calls()
    time.sleep(5)

# Stats finales
stats = manager.get_stats()
print(f"Total appels: {stats['total_calls']}")
print(f"Durée moyenne: {stats['avg_duration_seconds']}s")
```

## 🔍 Voix disponibles

| Voix | Caractéristiques | Cas d'usage |
|------|------------------|-------------|
| **alloy** | Neutre, polyvalente | Usage général, assistant |
| **echo** | Claire, professionnelle | Support client, business |
| **shimmer** | Douce, amicale | Narration, éducation |

## 📊 Modalités supportées

### Text
- Entrée: Messages texte
- Sortie: Réponses texte
- Use case: Chat, commandes texte

### Audio
- Entrée: Parole en temps réel
- Sortie: Synthèse vocale (TTS)
- Use case: Conversations vocales, téléphonie

### Multimodal (Text + Audio)
- Entrée: Texte ET audio simultanés
- Sortie: Texte ET audio
- Use case: Applications riches, accessibilité

## ⚠️ Bonnes pratiques

### 1. Gestion des connexions
- ✅ Toujours appeler `DELETE /calls/{id}` pour libérer les ressources
- ✅ Implémenter un timeout pour les appels inactifs
- ✅ Gérer les reconnexions en cas de déconnexion réseau

### 2. Qualité audio
- Utiliser des codecs audio de qualité (Opus recommandé)
- Activer la suppression d'écho côté client
- Tester avec différentes bandes passantes

### 3. Instructions efficaces
- Soyez spécifique sur le comportement attendu
- Incluez des exemples de réponses
- Définissez les limites (ex: "ne parle pas de politique")

### 4. Sécurité
- Validez toujours les SDP offers côté serveur
- Limitez la durée maximale des appels
- Loggez tous les événements pour audit

### 5. Performance
- Utilisez STUN/TURN servers appropriés
- Optimisez la latence réseau
- Surveillez les métriques (durée, erreurs)

## 🐛 Dépannage

### Connexion WebRTC échoue
```javascript
// Vérifier les ICE candidates
pc.onicecandidate = (event) => {
    if (event.candidate) {
        console.log('ICE Candidate:', event.candidate);
    }
};

// Vérifier l'état de la connexion
pc.onconnectionstatechange = () => {
    console.log('Connection state:', pc.connectionState);
};
```

### Pas d'audio
```javascript
// Vérifier les permissions micro
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => console.log('Micro OK'))
    .catch(err => console.error('Erreur micro:', err));

// Vérifier les tracks
pc.getSenders().forEach(sender => {
    console.log('Track:', sender.track);
});
```

### SDP invalide
- Vérifier que le SDP est bien formaté
- S'assurer que les codecs sont supportés
- Valider la structure avec un parser SDP

## 💰 Coûts

Les coûts de l'API Realtime sont basés sur:
- **Durée de l'appel**: Facturation à la minute
- **Tokens utilisés**: Entrée + sortie
- **Modalités**: Audio généralement plus coûteux que texte

Consultez la [tarification OpenAI](https://openai.com/pricing) pour les détails.

## 📞 Support

- Documentation OpenAI: https://platform.openai.com/docs/guides/realtime
- Interface web: http://localhost:5000/realtime-api.html
- Statistiques: http://localhost:5000/api/realtime/stats
- WebRTC Documentation: https://webrtc.org/getting-started/overview

## 🔗 Ressources

### Code exemples
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [Simple Peer (library)](https://github.com/feross/simple-peer)
- [PeerJS](https://peerjs.com/)

### Intégrations
- **Twilio**: Pour intégration téléphonique SIP
- **Vonage**: Pour SMS et Voice API
- **Socket.IO**: Pour signaling WebRTC

---

**Créé pour IAPosteManager v3.0** | Utilise l'API OpenAI Realtime avec cache local SQLite
