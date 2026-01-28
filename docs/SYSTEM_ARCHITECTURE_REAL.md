# 🏗️ ARCHITECTURE SYSTÈME RÉELLE — IA POSTE MANAGER

> **Version exécutable** — Ce document décrit EXACTEMENT ce qui est implémenté dans le repo.

---

## 📊 VUE D'ENSEMBLE

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTS FINAUX                                │
│  👤 Avocats    👥 Clients du cabinet    🏢 Administrations          │
└────────┬────────────────────┬────────────────────┬──────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CANAUX D'ENTRÉE (12 canaux)                       │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────────┤
│  Email   │ WhatsApp │   SMS    │  Voice   │  Slack   │   Teams     │
│  Forms   │ LinkedIn │ Twitter  │ Document │ Declan   │  Internal   │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬────────┘
     │          │          │          │          │          │
     └──────────┴──────────┴──────────┴──────────┴──────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              WEBHOOK ROUTER — /api/webhooks/channel/[channel]        │
│  • Validation signature (HMAC-SHA256, JWT, API Key)                 │
│  • Parsing payload spécifique par canal                             │
│  • Normalisation vers format unifié                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   MULTI-CHANNEL SERVICE                              │
│  src/lib/multichannel/channel-service.ts                             │
│                                                                      │
│  ✓ Réception centralisée                                            │
│  ✓ Auto-linking client/dossier (email/phone)                        │
│  ✓ Stockage PostgreSQL (table: channelMessage)                      │
│  ✓ Déclenchement traitement IA asynchrone                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   AI PROCESSOR   │ │  AUDIT SERVICE   │ │ NOTIFICATION SVC │
│                  │ │                  │ │                  │
│ • Résumé auto    │ │ • Hash chain     │ │ • Alertes temps  │
│ • Catégorie      │ │ • RGPD trail     │ │   réel           │
│ • Urgence        │ │ • Consentements  │ │ • Escalade       │
│ • Entités        │ │ • Export/Delete  │ │ • WebSocket      │
│ • Actions        │ │ • Rétention      │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BASE DE DONNÉES                                 │
│  PostgreSQL (Prisma ORM)                                             │
│                                                                      │
│  Tables principales:                                                 │
│  • channelMessage      — Messages normalisés                        │
│  • client              — Clients du cabinet                         │
│  • dossier             — Dossiers juridiques                        │
│  • auditLog            — Audit trail immutable                      │
│  • consent             — Consentements RGPD                         │
│  • notification        — Alertes système                            │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND NEXT.JS                             │
│                                                                      │
│  /admin/multichannel       — Dashboard unifié tous canaux           │
│  /client/messages          — Vue client (ses messages)              │
│  /dossiers/[id]            — Dossier avec historique messages       │
│  /analytics                — Stats par canal                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUX DE TRAITEMENT D'UN MESSAGE

### Exemple concret : Email reçu

```
1️⃣ CLIENT ENVOIE EMAIL
   └─> client@example.com → cabinet@memoLib.com

2️⃣ WEBHOOK DÉCLENCHÉ
   └─> POST /api/webhooks/channel/email
       Headers: x-signature, content-type
       Body: { from, to, subject, body, attachments }

3️⃣ VALIDATION & PARSING
   └─> EmailAdapter.parseWebhook()
       ✓ Signature validée
       ✓ Payload normalisé

4️⃣ STOCKAGE IMMÉDIAT
   └─> prisma.channelMessage.create()
       Status: RECEIVED
       Timestamp: 2026-01-25T12:00:00Z

5️⃣ TRAITEMENT IA (async)
   └─> AIService.analyzeMessage()
       ✓ Résumé: "Demande de RDV pour titre de séjour"
       ✓ Catégorie: IMMIGRATION
       ✓ Urgence: HIGH (deadline détectée)
       ✓ Entités: [Date: 2026-02-15, Type: Titre de séjour]

6️⃣ AUTO-LINKING
   └─> Recherche client par email
       ✓ Client trouvé: client-123
       ✓ Dossier actif: dossier-456
       ✓ Message lié automatiquement

7️⃣ ALERTE SI URGENT
   └─> notification.create()
       Type: URGENT_MESSAGE
       Destinataire: Avocat assigné
       Canal: WebSocket + Email

8️⃣ AUDIT TRAIL
   └─> auditLog.create()
       Action: MESSAGE_PROCESSED
       Hash: sha256(...)
       PreviousHash: sha256(...)

9️⃣ AFFICHAGE FRONTEND
   └─> Dashboard avocat mis à jour en temps réel
       Badge rouge "1 message urgent"
```

---

## 📡 CANAUX IMPLÉMENTÉS

### 1. EMAIL

**Endpoint:** `/api/webhooks/channel/email`

**Provider:** IMAP/SMTP (Resend, SendGrid, Nodemailer)

**Fonctionnalités:**
- ✅ Réception emails entrants
- ✅ Parsing pièces jointes
- ✅ Envoi emails sortants (templates)
- ✅ Accusés de lecture

**Variables requises:**
```env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@memoLib.com
```

---

### 2. WHATSAPP

**Endpoint:** `/api/webhooks/channel/whatsapp`

**Provider:** Meta Business API

**Fonctionnalités:**
- ✅ Messages texte
- ✅ Médias (images, vidéos, documents)
- ✅ Templates pré-approuvés
- ✅ Validation signature HMAC-SHA256

**Variables requises:**
```env
WHATSAPP_VERIFY_TOKEN=your-token
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789
```

**Validation webhook:**
```typescript
GET /api/webhooks/channel/whatsapp?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx
→ Retourne: challenge (pour vérification Meta)
```

---

### 3. SMS

**Endpoint:** `/api/webhooks/channel/sms`

**Provider:** Twilio

**Fonctionnalités:**
- ✅ SMS entrants/sortants
- ✅ Accusés de livraison
- ✅ Validation signature Twilio (HMAC-SHA1)

**Variables requises:**
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WEBHOOK_URL=https://memoLib.vercel.app/api/webhooks/channel
```

---

### 4. VOICE

**Endpoint:** `/api/webhooks/channel/voice`

**Provider:** Twilio Voice

**Fonctionnalités:**
- ✅ Appels entrants
- ✅ Enregistrements
- ✅ Transcription automatique
- ✅ Stockage audio (Azure Blob)

---

### 5. SLACK

**Endpoint:** `/api/webhooks/channel/slack`

**Provider:** Slack API

**Fonctionnalités:**
- ✅ Messages directs
- ✅ Threads
- ✅ Fichiers partagés
- ✅ Validation signature Slack

**Variables requises:**
```env
SLACK_SIGNING_SECRET=xxxxx
SLACK_BOT_TOKEN=xoxb-xxxxx
```

---

### 6. TEAMS

**Endpoint:** `/api/webhooks/channel/teams`

**Provider:** Microsoft Graph API

**Fonctionnalités:**
- ✅ Messages canaux
- ✅ Conversations privées
- ✅ Fichiers OneDrive
- ✅ Validation JWT Bearer

**Variables requises:**
```env
TEAMS_APP_ID=xxxxx
TEAMS_APP_SECRET=xxxxx
```

---

### 7-12. AUTRES CANAUX

| Canal | Endpoint | Provider | Status |
|-------|----------|----------|--------|
| LinkedIn | `/api/webhooks/channel/linkedin` | LinkedIn API | ✅ Implémenté |
| Twitter | `/api/webhooks/channel/twitter` | Twitter API | ✅ Implémenté |
| Forms | `/api/webhooks/channel/form` | Frontend | ✅ Implémenté |
| Document | `/api/webhooks/channel/document` | Azure Blob | ✅ Implémenté |
| Declan | `/api/webhooks/channel/declan` | Interne | ✅ Implémenté |
| Internal | `/api/webhooks/channel/internal` | Interne | ✅ Implémenté |

---

## 🧠 TRAITEMENT IA

**Fichier:** `src/lib/multichannel/ai-processor.ts`

### Analyse automatique

Pour chaque message reçu :

```typescript
{
  summary: "Client demande RDV pour renouvellement titre de séjour",
  category: "IMMIGRATION",
  tags: ["titre-séjour", "rdv", "préfecture"],
  urgency: "HIGH",
  sentiment: "NEUTRAL",
  entities: [
    { type: "DATE", value: "2026-02-15", confidence: 0.95 },
    { type: "DOCUMENT", value: "Titre de séjour", confidence: 0.98 }
  ],
  suggestedActions: [
    { type: "CREATE_DOSSIER", priority: "HIGH" },
    { type: "SCHEDULE_APPOINTMENT", priority: "MEDIUM" }
  ],
  missingInfo: ["Numéro de titre actuel", "Date d'expiration"],
  confidence: 0.87
}
```

### Détection d'urgence

Critères automatiques :
- ✅ Mots-clés urgents : "urgent", "deadline", "expiration"
- ✅ Dates proches (< 7 jours)
- ✅ Sentiment négatif fort
- ✅ Mentions légales critiques

---

## 🔐 SÉCURITÉ & CONFORMITÉ

### Validation webhooks

Chaque canal a sa propre méthode :

```typescript
// WhatsApp (HMAC-SHA256)
const crypto = require('crypto');
const expectedSig = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');
return signature === `sha256=${expectedSig}`;

// Twilio (HMAC-SHA1)
const data = url + sortedParams;
const computedSig = crypto
  .createHmac('sha1', secret)
  .update(Buffer.from(data, 'utf-8'))
  .digest('base64');
return signature === computedSig;

// Slack (HMAC-SHA256 avec timestamp)
const baseString = `${version}:${timestamp}:${payload}`;
const computedHash = crypto
  .createHmac('sha256', secret)
  .update(baseString)
  .digest('hex');
return hash === computedHash;
```

### Audit Trail immutable

Chaque action génère une entrée avec chaînage cryptographique :

```typescript
{
  id: "uuid",
  timestamp: "2026-01-25T12:00:00Z",
  action: "MESSAGE_RECEIVED",
  actor: { type: "SYSTEM" },
  hash: "sha256(id + timestamp + action + details + previousHash)",
  previousHash: "sha256(...)",  // Chaînage blockchain-like
  details: { channel: "EMAIL", messageId: "msg-123" }
}
```

### RGPD

**Consentements:**
```typescript
await auditService.recordConsent({
  clientId: 'client-123',
  channel: 'WHATSAPP',
  purpose: 'Communication juridique',
  granted: true,
  expiresAt: new Date('2027-01-01'),
  ipAddress: req.ip
});
```

**Droit d'accès:**
```typescript
GET /api/multichannel/rgpd?clientId=client-123
→ Export JSON complet (messages, consents, audit logs)
```

**Droit à l'oubli:**
```typescript
DELETE /api/multichannel/rgpd?clientId=client-123
→ Suppression + anonymisation audit trail
```

---

## 📊 APIS DISPONIBLES

### GET /api/multichannel/messages

Récupérer les messages avec filtres.

**Query params:**
- `channel` — EMAIL, WHATSAPP, SMS...
- `status` — RECEIVED, PROCESSING, PROCESSED, FAILED
- `clientId` — Filtrer par client
- `dossierId` — Filtrer par dossier
- `urgency` — LOW, MEDIUM, HIGH, CRITICAL
- `startDate` / `endDate` — Période
- `page` / `limit` — Pagination

**Exemple:**
```bash
GET /api/multichannel/messages?channel=EMAIL&urgency=HIGH&page=1&limit=50
```

**Réponse:**
```json
{
  "messages": [...],
  "total": 127,
  "page": 1,
  "pages": 3
}
```

---

### GET /api/multichannel/stats

Statistiques par canal.

**Query params:**
- `period` — 7d, 30d, 90d, 1y

**Réponse:**
```json
{
  "period": "7d",
  "channels": [
    { "channel": "EMAIL", "count": 45, "urgent": 3 },
    { "channel": "WHATSAPP", "count": 23, "urgent": 1 },
    { "channel": "SMS", "count": 12, "urgent": 0 }
  ],
  "totalMessages": 80,
  "urgentMessages": 4,
  "avgResponseTime": "2h 15min"
}
```

---

### POST /api/multichannel/rgpd

Enregistrer un consentement.

**Body:**
```json
{
  "clientId": "client-123",
  "channel": "WHATSAPP",
  "purpose": "Communication juridique",
  "granted": true
}
```

---

## 🚀 DÉPLOIEMENT

### Variables d'environnement PROD

**Obligatoires:**
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://memoLib.vercel.app
OPENAI_API_KEY=sk-...
```

**Canaux (optionnels selon usage):**
```env
WHATSAPP_ACCESS_TOKEN=...
TWILIO_ACCOUNT_SID=...
SLACK_BOT_TOKEN=...
TEAMS_APP_ID=...
```

**Sécurité:**
```env
CHANNEL_EMAIL_SECRET=...
CHANNEL_WHATSAPP_SECRET=...
CHANNEL_SMS_SECRET=...
```

### Azure Key Vault

Tous les secrets doivent être dans Key Vault :

```bash
az keyvault secret set \
  --vault-name memoLib-kv \
  --name "WHATSAPP-ACCESS-TOKEN" \
  --value "EAAxxxxx"
```

---

## 🧪 TESTS

### Test webhook local

```bash
# WhatsApp
curl -X POST http://localhost:3000/api/webhooks/channel/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"33612345678","text":{"body":"Test"}}]}}]}]}'

# SMS (Twilio)
curl -X POST http://localhost:3000/api/webhooks/channel/sms \
  -d "From=+33612345678&Body=Test&MessageSid=SM123"

# Email
curl -X POST http://localhost:3000/api/webhooks/channel/email \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","subject":"Test","text":"Message test"}'
```

---

## 📈 MONITORING

### Health checks

```bash
GET /api/health
→ { status: "ok", database: "connected", channels: [...] }
```

### Logs

Tous les événements sont loggés :
- ✅ Réception message
- ✅ Traitement IA
- ✅ Auto-linking
- ✅ Alertes créées
- ✅ Erreurs

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Pipeline CI/CD corrigé** (fait)
2. ✅ **Schéma fonctionnel** (ce document)
3. ⏳ **Architecture légale & RGPD** (à faire)
4. ⏳ **Plan évolution IA** (à faire)

---

## 📞 SUPPORT

- 📧 Email: support@memoLib.com
- 📚 Docs: https://docs.memoLib.com
- 🐛 Issues: https://github.com/mobby57/memoLib/issues
