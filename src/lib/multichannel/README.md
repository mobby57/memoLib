# Module Multi-Canal — Architecture Adapter Pattern

## 🎯 Objectif

Normaliser **tous les flux d'information entrants** (emails, WhatsApp, SMS, formulaires, etc.) vers un **format unique** (`NormalizedMessage`) avant traitement, garantissant **conformité légale**, **traçabilité** et **scalabilité**.

## 📐 Architecture

### Pattern Adapter

Chaque **source externe** dispose d'un **adapter dédié** qui transforme le payload natif en `NormalizedMessage`.

```
Source externe (Gmail, WhatsApp, Twilio...)
        ↓
   [Adapter spécifique]
        ↓
   NormalizedMessage (format unique)
        ↓
   MultiChannelService (orchestrateur)
        ↓
   Base de données + IA + Audit
```

### Structure du module

```bash
src/lib/multichannel/
├── types.ts                 # Contrat: NormalizedMessage
├── adapters/
│   └── index.ts             # 12 adapters (Email, WhatsApp, SMS, etc.)
├── adapter-factory.ts       # Factory pattern
├── channel-service.ts       # Service orchestrateur
├── ai-processor.ts          # Traitement IA
├── audit-service.ts         # Traçabilité blockchain
└── index.ts                 # Point d'entrée
```

## 🔑 Concepts clés

### 1. NormalizedMessage

Interface unique pour tous les canaux :

```ts
interface NormalizedMessage {
  id: string;
  externalId?: string;      // ID source (Gmail messageId, WhatsApp msgId...)
  checksum: string;          // SHA-256 pour déduplication
  channel: ChannelType;
  sender: {...};
  recipient: {...};
  body: string;
  attachments: Attachment[];
  channelMetadata: {...};    // Métadonnées source préservées
  timestamps: {...};
  consent: {...};            // RGPD
  auditTrail: AuditEntry[];
}
```

### 2. ChannelAdapter

Interface commune pour tous les adapters :

```ts
interface ChannelAdapter {
  // Extraction ID unique source
  extractExternalId(payload: Record<string, unknown>): string | undefined;

  // Transformation payload → NormalizedMessage
  parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>>;

  // Validation signature (optionnelle)
  validateSignature?(signature: string, payload: string, secret: string): boolean;

  // Envoi message (optionnel)
  sendMessage?(message: NormalizedMessage): Promise<{...}>;
}
```

### 3. AdapterFactory

Gestion centralisée des adapters (singleton par canal) :

```ts
const adapter = AdapterFactory.getAdapter('EMAIL');
const externalId = adapter.extractExternalId(payload);
```

### 4. Déduplication automatique

Calcul de checksum déterministe :

```ts
checksum = SHA-256({
  channel,
  externalId,
  sender,
  body,
  subject,
  timestamp (arrondi à la minute)
})
```

Rejet avant stockage si checksum existe déjà.

## 🚀 Utilisation

### Recevoir un message

```ts
import { multiChannelService } from '@/lib/multichannel';

const result = await multiChannelService.receiveMessage({
  channel: 'EMAIL',
  payload: {
    messageId: 'msg_123',
    from: 'client@example.com',
    subject: 'Question urgente',
    text: 'Bonjour...',
  },
  signature: 'sha256=...',
  timestamp: new Date().toISOString(),
});
```

### Ajouter un nouveau canal

1. **Créer l'adapter** dans `adapters/index.ts` :

```ts
export class CustomAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return payload.messageId as string;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: { email: payload.from },
      body: payload.content,
    };
  }
}
```

2. **Ajouter le type** dans `types.ts` :

```ts
export type ChannelType =
  | 'EMAIL'
  | 'CUSTOM'  // ← Nouveau
  | ...
```

3. **Enregistrer dans la Factory** (`adapter-factory.ts`) :

```ts
case 'CUSTOM':
  return new CustomAdapter();
```

## 🔐 Conformité légale

### RGPD

- ✅ **Consentement explicite** : champ `consent.status`
- ✅ **Finalité** : `consent.purpose`
- ✅ **Traçabilité** : `auditTrail` immuable
- ✅ **Déduplication légale** : économie stockage + anti-spam

### CNIL

- ✅ **Séparation claire** : normalisation ≠ modification contenu
- ✅ **Métadonnées préservées** : `channelMetadata` garde payload original
- ✅ **Justification** : "Normalisation pour traitement uniforme"

### Audit

Chaque action est tracée avec hash blockchain-style :

```ts
{
  action: 'MESSAGE_RECEIVED',
  timestamp: Date,
  actor: { type: 'SYSTEM' },
  hash: SHA-256(data + previousHash),
  previousHash: '...'
}
```

## 📊 Adapters disponibles

| Canal    | Source      | externalId                 | Validation signature |
| -------- | ----------- | -------------------------- | -------------------- |
| EMAIL    | Gmail, SMTP | `messageId`                | ❌                   |
| WHATSAPP | Meta        | `message.id`               | ✅ HMAC-SHA256       |
| SMS      | Twilio      | `MessageSid`               | ✅ HMAC-SHA1         |
| VOICE    | Twilio      | `CallSid`                  | ❌                   |
| SLACK    | Slack       | `client_msg_id` ou `ts`    | ✅ HMAC-SHA256       |
| TEAMS    | Microsoft   | `id`                       | ❌                   |
| LINKEDIN | LinkedIn    | `messageId`                | ❌                   |
| TWITTER  | Twitter     | `dm.id`                    | ❌                   |
| FORM     | Custom      | `submissionId`             | ❌                   |
| DOCUMENT | Azure Blob  | `documentId` ou `blobPath` | ❌                   |
| DECLAN   | Custom      | `eventId`                  | ❌                   |
| INTERNAL | System      | `internalMessageId`        | ❌                   |

## 🧪 Tests

```bash
npm test src/lib/multichannel
```

Tests couverts :

- ✅ Déduplication (même checksum = rejet)
- ✅ Extraction externalId par canal
- ✅ Validation signatures (WhatsApp, SMS, Slack)
- ✅ Calcul checksum déterministe
- ✅ Factory (singleton par canal)

## 📚 Références

- [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) : Vue d'ensemble système
- [copilot-instructions.md](../../../.github/copilot-instructions.md) : Règles IA agents
- [RGPD Compliance](./audit-service.ts) : Traçabilité

---

**Dernière mise à jour** : 5 février 2026
**Auteur** : Équipe MemoLib
