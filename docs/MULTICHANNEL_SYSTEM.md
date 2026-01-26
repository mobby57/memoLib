# 📡 Système Multi-Canal - Documentation Technique

## Vue d'ensemble

Le système multi-canal centralise **tous les flux de communication** des cabinets d'avocats avec leurs clients, en garantissant :

- ✅ **Audit trail complet** - Horodatage et traçabilité de chaque message
- ✅ **Conformité RGPD** - Gestion des consentements par canal
- ✅ **Traitement IA** - Résumé, catégorisation, détection d'urgence
- ✅ **Sécurité Azure** - Secrets dans Key Vault, chiffrement E2E

---

## 📊 Canaux supportés

| Canal | Webhook | Provider | Fonctionnalités |
|-------|---------|----------|-----------------|
| **Email** | `/api/webhooks/channel/email` | IMAP/SMTP | Messages, pièces jointes, accusés |
| **WhatsApp** | `/api/webhooks/channel/whatsapp` | Meta Business API | Messages, médias, templates |
| **SMS** | `/api/webhooks/channel/sms` | Twilio | Entrants/sortants, accusés |
| **Voice** | `/api/webhooks/channel/voice` | Twilio | Appels, transcription, enregistrements |
| **Slack** | `/api/webhooks/channel/slack` | Slack API | Messages, threads, fichiers |
| **Teams** | `/api/webhooks/channel/teams` | Microsoft Graph | Messages, canaux, fichiers |
| **LinkedIn** | `/api/webhooks/channel/linkedin` | LinkedIn API | Messages directs |
| **Twitter** | `/api/webhooks/channel/twitter` | Twitter API | DMs |
| **Formulaires** | `/api/webhooks/channel/form` | Frontend | Soumissions avec consentement |
| **Documents** | `/api/webhooks/channel/document` | Blob Storage | Upload, OCR, analyse |
| **Declan** | `/api/webhooks/channel/declan` | Interne | Événements workflow |
| **Interne** | `/api/webhooks/channel/internal` | Interne | Communications internes |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CANAUX EXTERNES                    │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────┤
│Email │WApp  │ SMS  │Voice │Slack │Teams │ Forms... │
└──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴────┬─────┘
   │      │      │      │      │      │        │
   ▼      ▼      ▼      ▼      ▼      ▼        ▼
┌─────────────────────────────────────────────────────┐
│            WEBHOOKS API (Channel Adapters)           │
│  /api/webhooks/channel/[channel]                     │
│  • Validation signature                              │
│  • Parsing payload                                   │
│  • Normalisation                                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              MultiChannelService                     │
│  • Réception centralisée                             │
│  • Auto-linking client/dossier                       │
│  • Stockage PostgreSQL                               │
└──────────────────────┬──────────────────────────────┘
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   AIService     │ │  AuditService   │ │ NotificationSvc │
│ • Résumé        │ │ • Hash chain    │ │ • Alertes       │
│ • Catégorie     │ │ • RGPD          │ │ • Urgences      │
│ • Urgence       │ │ • Export/Delete │ │ • Escalade      │
│ • Entités       │ │ • Retention     │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  /admin/multichannel                                 │
│  • Dashboard unifié                                  │
│  • Filtres par canal/statut/urgence                 │
│  • Actions rapides                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Variables d'environnement requises

```env
# Base de données
DATABASE_URL=postgresql://...

# IA
OPENAI_API_KEY=sk-...
AZURE_OPENAI_ENDPOINT=https://...openai.azure.com

# WhatsApp Business
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id

# Twilio (SMS/Voice)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WEBHOOK_URL=https://iapostemanager.vercel.app/api/webhooks/channel

# Slack
SLACK_SIGNING_SECRET=...
SLACK_BOT_TOKEN=xoxb-...

# Microsoft Teams
TEAMS_APP_ID=...
TEAMS_APP_SECRET=...

# Canaux secrets (pour validation webhook)
CHANNEL_EMAIL_SECRET=...
CHANNEL_WHATSAPP_SECRET=...
CHANNEL_SMS_SECRET=...
# etc.
```

### Azure Key Vault

Tous les secrets doivent être stockés dans Azure Key Vault :

```bash
az keyvault secret set --vault-name iapostemanager-kv \
  --name "WHATSAPP-ACCESS-TOKEN" \
  --value "your-token"
```

---

## 📨 Format de message normalisé

```typescript
interface NormalizedMessage {
  id: string;                    // UUID unique
  channel: ChannelType;          // EMAIL, WHATSAPP, SMS...
  direction: 'INBOUND' | 'OUTBOUND';
  status: MessageStatus;         // RECEIVED, PROCESSING, PROCESSED...
  
  sender: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    externalId?: string;
  };
  
  recipient: {...};
  
  subject?: string;
  body: string;
  bodyHtml?: string;
  attachments: Attachment[];
  
  aiAnalysis?: {
    summary: string;
    category: string;
    tags: string[];
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    entities: ExtractedEntity[];
    suggestedActions: SuggestedAction[];
  };
  
  timestamps: {
    received: Date;
    processed?: Date;
    archived?: Date;
  };
  
  consent: {
    status: 'PENDING' | 'GRANTED' | 'REVOKED';
    grantedAt?: Date;
  };
  
  tenantId?: string;
  clientId?: string;
  dossierId?: string;
  
  auditTrail: AuditEntry[];
}
```

---

## 🔐 Sécurité

### Validation des webhooks

Chaque canal a sa propre méthode de validation :

| Canal | Méthode | Header |
|-------|---------|--------|
| WhatsApp | HMAC-SHA256 | `x-hub-signature-256` |
| Slack | HMAC-SHA256 | `x-slack-signature` |
| Twilio | HMAC-SHA1 | `x-twilio-signature` |
| Teams | JWT Bearer | `Authorization` |
| Autres | API Key | `x-api-key` |

### Audit Trail

Chaque action est loggée avec chaînage cryptographique :

```typescript
{
  id: "uuid",
  timestamp: "2026-01-25T12:00:00Z",
  action: "MESSAGE_RECEIVED",
  hash: "sha256...",           // Hash de l'entrée
  previousHash: "sha256...",   // Chaînage immutable
  details: {...}
}
```

---

## 📋 Conformité RGPD

### Consentements

```typescript
// Enregistrer un consentement
await auditService.recordConsent({
  clientId: 'client-123',
  channel: 'WHATSAPP',
  purpose: 'Communication juridique',
  granted: true,
  expiresAt: new Date('2027-01-01'),
  ipAddress: '192.168.1.1'
});

// Vérifier le consentement
const hasConsent = await auditService.checkConsent(
  'client-123', 
  'WHATSAPP', 
  'Communication juridique'
);
```

### Droit d'accès

```typescript
// Exporter toutes les données d'un client
const exportData = await auditService.exportClientData('client-123');
// Retourne: { client, messages, consents, auditLogs, exportedAt }
```

### Droit à l'oubli

```typescript
// Supprimer toutes les données d'un client
const result = await auditService.deleteClientData('client-123', {
  keepAuditLogs: true,  // Garder les logs anonymisés
  reason: 'Demande RGPD',
  requestedBy: 'admin-user-id'
});
```

### Politique de rétention

```typescript
await auditService.applyRetentionPolicy({
  channel: 'EMAIL',
  retentionDays: 365,
  autoArchive: true,
  autoDelete: false
});
```

---

## 🚀 Déploiement

### Workflow GitHub Actions

Le workflow `production-multichannel.yml` inclut :

1. **Security Scan** - TruffleHog, Snyk, CodeQL
2. **Build & Test** - Tests unitaires avec PostgreSQL/Redis
3. **E2E Tests** - Playwright pour tous les canaux
4. **Deploy Staging** - Test sur environnement preview
5. **Deploy Production** - Avec secrets Key Vault
6. **Health Checks** - Vérification tous les endpoints
7. **Notifications** - Slack pour succès/échec
8. **Audit Log** - Entrée de déploiement

### Commandes

```bash
# Développement local
npm run dev

# Tests
npm run test:ci

# Build production
npm run build

# Déploiement manuel
npx vercel --prod --force
```

---

## 📊 APIs

### GET /api/multichannel/messages

Récupérer les messages avec filtrage.

```
GET /api/multichannel/messages?channel=EMAIL&status=RECEIVED&page=1&limit=50
```

### GET /api/multichannel/stats

Statistiques multi-canal.

```
GET /api/multichannel/stats?period=7d
```

### POST /api/multichannel/rgpd

Enregistrer un consentement RGPD.

```json
{
  "clientId": "client-123",
  "channel": "WHATSAPP",
  "purpose": "Communication juridique",
  "granted": true
}
```

### GET /api/multichannel/rgpd?clientId=xxx

Exporter les données client (droit d'accès).

### DELETE /api/multichannel/rgpd?clientId=xxx

Supprimer les données client (droit à l'oubli).

---

## 🧪 Tests

### Tests webhooks

```bash
# Test webhook WhatsApp
curl -X POST https://iapostemanager.vercel.app/api/webhooks/channel/whatsapp \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=..." \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"33612345678","text":{"body":"Test message"}}]}}]}]}'

# Test webhook SMS (Twilio)
curl -X POST https://iapostemanager.vercel.app/api/webhooks/channel/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=+33612345678&Body=Test SMS&MessageSid=SM123"
```

---

## 📞 Support

Pour toute question sur l'intégration multi-canal :

- 📧 Email: support@iapostemanager.com
- 📚 Docs: https://docs.iapostemanager.com
- 🐛 Issues: https://github.com/mobby57/iapostemanager/issues
