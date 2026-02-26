# API Webhook Pattern Adapter Multi-Canal

## Vue d'ensemble

L'endpoint `/api/webhooks/test-multichannel` normalise les messages provenant de multiples canaux (Email, WhatsApp, SMS, Formulaires) vers un format unifié.

**URL de base**: `http://localhost:3000`

---

## Endpoints

### GET /api/webhooks/test-multichannel

Retourne la documentation et des exemples de payloads pour chaque canal.

**Réponse (200 OK)**:

```json
{
  "endpoint": "/api/webhooks/test-multichannel",
  "method": "POST",
  "description": "Test webhook pour Pattern Adapter Multi-Canal",
  "examples": {
    "email": { ... },
    "whatsapp": { ... },
    "sms": { ... },
    "form": { ... }
  }
}
```

---

### POST /api/webhooks/test-multichannel

Traite un message entrant d'un canal quelconque.

**Headers requis**:

```
Content-Type: application/json
```

**Réponse (200 OK) - Succès**:

```json
{
  "success": true,
  "messageId": "uuid-unique",
  "externalId": "msg_123456789",
  "checksum": "abc123def456...",
  "channel": "EMAIL",
  "status": "RECEIVED",
  "timestamp": "2026-02-06T19:30:00Z"
}
```

**Réponse (409 Conflict) - Doublon détecté**:

```json
{
  "success": false,
  "error": "DUPLICATE_MESSAGE",
  "message": "Ce message a déjà été traité (doublon détecté)",
  "checksum": "abc123def456..."
}
```

**Réponse (400 Bad Request) - Erreur de traitement**:

```json
{
  "error": "Description de l'erreur"
}
```

---

## Format des payloads par canal

### Email

```json
{
  "channel": "EMAIL",
  "messageId": "msg_1234567890",
  "from": "client@example.com",
  "to": "cabinet@example.com",
  "subject": "Question urgente",
  "text": "Bonjour, j'ai une question juridique..."
}
```

**Champs extraits**:

- `sender.email`: `from`
- `body`: `text`
- `subject`: `subject`

---

### WhatsApp

```json
{
  "channel": "WHATSAPP",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "id": "wamid_1234567890",
                "from": "+33612345678",
                "type": "text",
                "text": { "body": "Message via WhatsApp" }
              }
            ],
            "contacts": [{ "profile": { "name": "Marie Client" } }]
          }
        }
      ]
    }
  ]
}
```

**Champs extraits**:

- `sender.phone`: `messages[0].from`
- `sender.name`: `contacts[0].profile.name`
- `body`: `messages[0].text.body`
- `externalId`: `messages[0].id`

---

### SMS

```json
{
  "channel": "SMS",
  "MessageSid": "SM1234567890",
  "From": "+33612345678",
  "To": "+33698765432",
  "Body": "Message urgent via SMS"
}
```

**Champs extraits**:

- `sender.phone`: `From`
- `body`: `Body`
- `externalId`: `MessageSid`

---

### Formulaire Web

```json
{
  "channel": "FORM",
  "submissionId": "form_1234567890",
  "email": "client@example.com",
  "name": "John Doe",
  "subject": "Contact formulaire",
  "message": "Demande via formulaire web",
  "consentGiven": true
}
```

**Champs extraits**:

- `sender.email`: `email`
- `sender.name`: `name`
- `subject`: `subject`
- `body`: `message`
- `externalId`: `submissionId`

---

## Déduplication

Chaque message reçoit un **checksum SHA-256** basé sur le contenu normalisé.

- ✅ Premier message avec un checksum unique → **Status 200**
- ❌ Deuxième message avec le même checksum → **Status 409 DUPLICATE**

**Exemple**:

```bash
# 1ère requête
curl -X POST http://localhost:3000/api/webhooks/test-multichannel \
  -H "Content-Type: application/json" \
  -d '{"channel":"EMAIL","from":"test@example.com","text":"Hello"}'

# Réponse
{ "success": true, "checksum": "abc123..." }

# 2ème requête identique
curl -X POST http://localhost:3000/api/webhooks/test-multichannel \
  -H "Content-Type: application/json" \
  -d '{"channel":"EMAIL","from":"test@example.com","text":"Hello"}'

# Réponse
{ "success": false, "error": "DUPLICATE_MESSAGE", "checksum": "abc123..." }
```

---

## Cycle de vie des messages

1. **RECEIVED** (par défaut) - Message reçu et validé
2. **PROCESSING** - En cours de traitement IA
3. **CATEGORIZED** - Catégorisé automatiquement
4. **ASSIGNED** - Assigné à un avocat
5. **RESOLVED** - Répondu

---

## Codes de réponse

| Code    | Signification                         |
| ------- | ------------------------------------- |
| **200** | Message traité avec succès            |
| **409** | Doublon détecté (même checksum)       |
| **400** | Erreur de validation ou de traitement |
| **500** | Erreur serveur interne                |

---

## Exemples avec cURL

### Tester GET

```bash
curl http://localhost:3000/api/webhooks/test-multichannel
```

### Envoyer un email

```bash
curl -X POST http://localhost:3000/api/webhooks/test-multichannel \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "EMAIL",
    "from": "client@example.com",
    "to": "cabinet@example.com",
    "subject": "Question urgente",
    "text": "Besoin d'aide juridique"
  }'
```

### Envoyer un SMS

```bash
curl -X POST http://localhost:3000/api/webhooks/test-multichannel \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "SMS",
    "From": "+33612345678",
    "To": "+33698765432",
    "Body": "Message urgent"
  }'
```

---

## Base de données

Les messages sont stockés dans la table `ChannelMessage` avec les champs:

- `id` (UUID)
- `externalId` (ID source du canal)
- `checksum` (SHA-256, unique)
- `channel` (EMAIL | WHATSAPP | SMS | FORM)
- `status` (RECEIVED, PROCESSING, CATEGORIZED, ASSIGNED, RESOLVED)
- `senderData` (JSON)
- `body` (texte)
- `subject` (optionnel)
- `channelMetadata` (JSON brut)
- `createdAt`, `updatedAt`

---

## Performance

- ⚡ Checksum: < 1ms
- ⚡ Vérification doublons: < 10ms
- ⚡ Stockage DB: < 50ms
- **Temps total**: < 100ms par message

---

## Sécurité

- ✅ Validation JSON stricte
- ✅ Limitation de taille de payload (5MB)
- ✅ Déduplication obligatoire
- ✅ Logging anonymisé (pas de contenu sensible)
- ✅ HTTPS en production

---

## Support

Pour les questions ou bugs, contactez l'équipe de développement.
