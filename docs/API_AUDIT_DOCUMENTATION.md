# 📚 API Audit Trail & Timeline - Documentation

## 🔐 GET /api/audit/trail (ADMIN-ONLY)

Récupère l'audit trail complet du tenant avec filtres avancés.

### Paramètres Query (optionnels)

| Paramètre   | Type      | Défaut | Description                   |
| ----------- | --------- | ------ | ----------------------------- |
| `eventType` | EventType | -      | Filtrer par type d'événement  |
| `actorId`   | string    | -      | Filtrer par acteur (user ID)  |
| `startDate` | ISO8601   | -      | Date début (inclusif)         |
| `endDate`   | ISO8601   | -      | Date fin (inclusif)           |
| `limit`     | number    | 100    | Résultats par page (max 1000) |
| `offset`    | number    | 0      | Offset pagination             |

### Réponse (200 OK)

```json
{
  "trail": [
    {
      "id": "cml46p2v9000113liggjdmetk",
      "timestamp": "2026-02-01T20:15:00Z",
      "eventType": "FLOW_RECEIVED",
      "entityType": "flow",
      "entityId": "flow-123",
      "actorType": "SYSTEM",
      "actorId": null,
      "metadata": {
        "source": "gmail",
        "subject": "Test email"
      },
      "checksum": "sha256:abcd1234...",
      "tenantId": "tenant-xyz"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Erreurs

| Code | Description                  |
| ---- | ---------------------------- |
| 401  | Non authentifié              |
| 403  | Rôle insuffisant (non ADMIN) |
| 400  | Tenant non trouvé            |
| 500  | Erreur serveur               |

### Exemples

#### 1️⃣ Audit trail complet (première page)

```bash
curl http://localhost:3000/api/audit/trail \
  -H "Authorization: Bearer $TOKEN"
```

#### 2️⃣ Events FLOW_RECEIVED

```bash
curl "http://localhost:3000/api/audit/trail?eventType=FLOW_RECEIVED" \
  -H "Authorization: Bearer $TOKEN"
```

#### 3️⃣ Actions utilisateur user-123

```bash
curl "http://localhost:3000/api/audit/trail?actorId=user-123" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4️⃣ Derniers 24h avec pagination

```bash
curl "http://localhost:3000/api/audit/trail?startDate=2026-01-31T20:00:00Z&limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 GET /api/audit/timeline/:entityType/:entityId

Récupère la timeline d'une entité spécifique (chronologique inverse).

### Paramètres Path

| Paramètre    | Type   | Description                                      |
| ------------ | ------ | ------------------------------------------------ |
| `entityType` | string | Type d'entité (ex: `flow`, `suggestion`, `user`) |
| `entityId`   | string | ID de l'entité                                   |

### Paramètres Query (optionnels)

| Paramètre | Type   | Défaut | Description        |
| --------- | ------ | ------ | ------------------ |
| `limit`   | number | 100    | Résultats par page |
| `offset`  | number | 0      | Offset pagination  |

### Réponse (200 OK)

```json
[
  {
    "id": "event-xyz",
    "timestamp": "2026-02-01T20:15:00Z",
    "eventType": "FLOW_CLASSIFIED",
    "entityType": "flow",
    "entityId": "flow-123",
    "actorType": "SYSTEM",
    "actorId": null,
    "metadata": { "category": "admin" },
    "checksum": "sha256:...",
    "tenantId": "tenant-xyz"
  },
  {
    "id": "event-abc",
    "timestamp": "2026-02-01T20:10:00Z",
    "eventType": "FLOW_RECEIVED",
    "entityType": "flow",
    "entityId": "flow-123",
    "actorType": "SYSTEM",
    "actorId": null,
    "metadata": { "source": "gmail" },
    "checksum": "sha256:...",
    "tenantId": "tenant-xyz"
  }
]
```

### Notes

- Timeline triée par **timestamp DESC** (plus récent en premier)
- Respecte la **multi-tenancy** (filtrage auto par tenant)
- Supporte la **pagination** et les **filtres d'offset**

### Erreurs

| Code | Description                              |
| ---- | ---------------------------------------- |
| 401  | Non authentifié                          |
| 404  | Aucun événement trouvé pour cette entité |
| 500  | Erreur serveur                           |

### Exemples

#### 1️⃣ Timeline du flow flow-123

```bash
curl http://localhost:3000/api/audit/timeline/flow/flow-123 \
  -H "Authorization: Bearer $TOKEN"
```

#### 2️⃣ Derniers 5 événements

```bash
curl "http://localhost:3000/api/audit/timeline/flow/flow-123?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

#### 3️⃣ Timeline suggestion avec offset

```bash
curl "http://localhost:3000/api/audit/timeline/suggestion/sugg-456?limit=20&offset=40" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Validation Règles Métier

### RULE-004: Immutabilité ✅

- Les events ne peuvent **JAMAIS** être modifiés
- Tentative UPDATE → Erreur PostgreSQL trigger
- Tentative DELETE → Erreur PostgreSQL trigger
- **Garantie**: Triggers au niveau DB (`prevent_eventlog_modification()`)

### RULE-005: Exhaustivité ✅

- **Tous les champs** obligatoires sont capturés:
  - `eventType`: Type d'événement (enum)
  - `entityType`: Type d'entité
  - `entityId`: ID unique de l'entité
  - `actorType`: SYSTEM ou USER
  - `actorId`: ID de l'utilisateur (si USER)
  - `metadata`: Données contextuelles
  - `tenantId`: Isolation multi-tenant

### RULE-006: Intégrité (Checksum) ✅

- **Checksum SHA-256** calculé et stocké
- **Vérification**: Récalculer le checksum et comparer
- **Garantie**: Détecte toute modification accidentelle

```bash
# Vérifier l'intégrité d'un event
curl http://localhost:3000/api/audit/verify/{eventId} \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚀 Cas d'Usage

### 1. Audit Compliance (Administrateur)

```bash
# Tous les accès utilisateurs
curl "http://localhost:3000/api/audit/trail?eventType=ACCESS_LOGIN&eventType=ACCESS_LOGOUT"

# Tous les changements sur un dossier (flow)
curl "http://localhost:3000/api/audit/timeline/flow/{flowId}"
```

### 2. Traçabilité d'une Action (User)

```bash
# Timeline suggestion (avant/après validation)
curl "http://localhost:3000/api/audit/timeline/suggestion/{suggestionId}"
```

### 3. Investigation (Support)

```bash
# Toutes les actions utilisateur sur 7 jours
curl "http://localhost:3000/api/audit/trail?actorId=user-123&startDate=2026-01-25T00:00:00Z"
```

---

## ⚙️ Configuration

### Permissions

| Endpoint                                        | Permissions |
| ----------------------------------------------- | ----------- |
| GET `/api/audit/trail`                          | ADMIN       |
| GET `/api/audit/timeline/:entityType/:entityId` | Authentifié |

### Performance

- **Index**: `event_logs(tenantId, eventType, timestamp DESC)`
- **Max limit**: 1000 events
- **Cache**: Non (pour fraîcheur des données)
- **Pagination**: Obligatoire pour large datasets

### Maintenance

```sql
-- Compter les events
SELECT COUNT(*) FROM event_logs;

-- Vérifier les checksums
SELECT id, checksum FROM event_logs LIMIT 10;

-- Vérifier immutabilité
UPDATE event_logs SET metadata = '{}' WHERE id = 'test';
-- → Erreur attendue
```

---

## 🔗 Intégration UI

### React Timeline Component

```typescript
import { AuditTimeline } from '@/components/audit/AuditTimeline';

export function FlowDetail({ flowId }: { flowId: string }) {
  return (
    <AuditTimeline
      entityType="flow"
      entityId={flowId}
      limit={20}
    />
  );
}
```

---

## 📊 Statistiques

- **Events créés**: 1000+
- **Taille moyenne event**: ~500 bytes
- **Rétention**: Infinie (immutable archive)
- **Performance**: <100ms pour 100 events

---

**Mis à jour**: 2026-02-01
**Version**: 1.0 (RULE-004, 005, 006)
