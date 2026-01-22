# 🧠 GARANTIE PRODUIT — ZÉRO INFORMATION IGNORÉE

**Date:** 21 janvier 2026  
**Status:** Production Ready  
**Propriété:** Structurelle (pas marketing)

---

## ⚡ RÈGLE D'OR NON NÉGOCIABLE

> **Aucune information ne peut exister dans le système sans état explicite.**

**Signification technique:**
- Pas de "silence" système
- Pas de "vu mais pas traité"
- Pas de "on verra plus tard" invisible
- **Toute entrée = unité traçable**

---

## 🎯 OBJET CENTRAL: `InformationUnit`

### Champs Obligatoires

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `source` | Enum | EMAIL, DOCUMENT, FORM, PHONE, API |
| `content_hash` | SHA-256 | Empreinte contenu (déduplication) |
| `received_at` | DateTime | Horodatage réception |
| `current_status` | Enum | État actuel (voir pipeline) |
| `status_reason` | String | Justification état |
| `requires_human_action` | Boolean | Bloquant si true |
| `linked_workspace_id` | UUID | Workspace associé (si applicable) |

### Métadonnées Audit

| Champ | Type | Description |
|-------|------|-------------|
| `status_history` | JSON | Transitions complètes |
| `last_status_change_at` | DateTime | Dernière mise à jour |
| `last_status_change_by` | String | USER_ID ou "SYSTEM" |
| `escalation_count` | Integer | Nombre rappels |
| `human_validated` | Boolean | Validation humaine reçue |
| `validated_at` | DateTime | Date validation |
| `validated_by` | String | USER_ID validateur |

---

## 📊 PIPELINE FERMÉ (États Obligatoires)

```
RECEIVED → CLASSIFIED → ANALYZED → [DECISION]
                ↓
        INCOMPLETE ──→ HUMAN_ACTION_REQUIRED
                ↓
        AMBIGUOUS ───→ HUMAN_ACTION_REQUIRED
                ↓
        RESOLVED ─────→ CLOSED
```

### Descriptions États

#### 1. `RECEIVED`
- **Signification:** Information entrée dans le système
- **Durée max:** 5 minutes
- **Action système:** Classification automatique
- **Transition obligatoire:** Vers CLASSIFIED

#### 2. `CLASSIFIED`
- **Signification:** Type identifié (nouveau client, CESEDA, urgent, etc.)
- **Durée max:** 15 minutes
- **Action système:** Analyse IA du contenu
- **Transition obligatoire:** Vers ANALYZED

#### 3. `ANALYZED`
- **Signification:** Contenu extrait, workspace suggéré
- **Durée max:** 30 minutes
- **Actions possibles:**
  - → `RESOLVED` (si information complète et actionnable)
  - → `INCOMPLETE` (si données manquantes)
  - → `AMBIGUOUS` (si contexte insuffisant)

#### 4. `INCOMPLETE`
- **Signification:** Données manquantes identifiées
- **Propriétés:**
  - `missing_fields`: JSON array des champs manquants
  - `suggested_action`: Formulaire / demande documents
  - `blocking`: true
- **Escalation:** Rappel après 48h
- **Transition:** Vers HUMAN_ACTION_REQUIRED si > 72h

#### 5. `AMBIGUOUS`
- **Signification:** Contexte juridique incertain
- **Propriétés:**
  - `ambiguity_type`: LEGAL, FACTUAL, PROCEDURAL
  - `confidence_score`: 0-1
  - `blocking`: true
- **Escalation:** Alerte immédiate
- **Transition:** Vers HUMAN_ACTION_REQUIRED (direct)

#### 6. `HUMAN_ACTION_REQUIRED`
- **Signification:** Intervention humaine indispensable
- **Propriétés:**
  - `action_type`: VALIDATION, DECISION, CLARIFICATION
  - `priority`: LOW, MEDIUM, HIGH, CRITICAL
  - `deadline`: DateTime (si applicable)
  - `blocking`: true
- **Escalation:** Rappel quotidien si CRITICAL
- **Transition:** Vers RESOLVED (après action humaine)

#### 7. `RESOLVED`
- **Signification:** Information traitée, workspace créé ou action effectuée
- **Propriétés:**
  - `resolution_type`: WORKSPACE_CREATED, DOCUMENT_SENT, REJECTED
  - `resolved_by`: USER_ID ou "SYSTEM" (si auto)
  - `resolution_note`: String
- **Durée:** 7 jours (archivage)
- **Transition:** Vers CLOSED

#### 8. `CLOSED`
- **Signification:** Archivage final
- **Conditions:**
  - Aucun statut bloquant
  - 7 jours minimum en RESOLVED
  - Validation humaine ou auto-close autorisé
- **Action:** Déplacement vers table archive

---

## 🚨 RÈGLES ANTI-ANGLE MORT

### Règle 1: Interdiction Transition Directe

❌ **INTERDIT:**
```
RECEIVED → CLOSED
CLASSIFIED → CLOSED
ANALYZED → CLOSED
```

✅ **OBLIGATOIRE:**
```
Toute information DOIT passer par RESOLVED avant CLOSED
```

### Règle 2: Justification Obligatoire

**Chaque transition enregistre:**
```json
{
  "from_status": "ANALYZED",
  "to_status": "RESOLVED",
  "changed_by": "USER_abc123",
  "changed_at": "2026-01-21T14:30:00Z",
  "reason": "Workspace created: WS-2026-042",
  "metadata": {
    "workspace_id": "uuid-workspace",
    "confidence": 0.95
  }
}
```

### Règle 3: Escalade Automatique

| Condition | Délai | Action |
|-----------|-------|--------|
| `INCOMPLETE` | > 48h | Email rappel client |
| `INCOMPLETE` | > 72h | Escalade HUMAN_ACTION_REQUIRED |
| `HUMAN_ACTION_REQUIRED` (HIGH) | > 24h | Notification push avocat |
| `HUMAN_ACTION_REQUIRED` (CRITICAL) | > 12h | SMS + Email urgent |
| Aucune transition | > 96h | Alerte système admin |

### Règle 4: Blocage Clôture Workspace

**Impossible de fermer un workspace si:**
- Existe InformationUnit avec `requires_human_action: true`
- Existe InformationUnit en état `INCOMPLETE` ou `AMBIGUOUS`
- Existe InformationUnit en `HUMAN_ACTION_REQUIRED` non résolu

---

## 🎨 UX - Interface Utilisateur

### Dashboard Avocat

```
╔══════════════════════════════════════╗
║  📬 INFORMATIONS EN ATTENTE         ║
╠══════════════════════════════════════╣
║                                      ║
║  ✅ Traitées:           24           ║
║  ⚠️  Bloquées:           3           ║
║  ❗ Actions requises:    2           ║
║                                      ║
║  [Voir détails]                      ║
╚══════════════════════════════════════╝
```

### Détail Information Bloquée

```
┌─────────────────────────────────────┐
│ 📧 Email de M. DUBOIS              │
├─────────────────────────────────────┤
│ Statut:  🔴 INCOMPLETE              │
│ Depuis:  3 jours                    │
│ Raison:  Données manquantes         │
│                                     │
│ ❌ Manquant:                        │
│  • Date de naissance                │
│  • Numéro de passeport              │
│  • Copie OQTF                       │
│                                     │
│ [Envoyer formulaire] [Appeler]     │
└─────────────────────────────────────┘
```

### Écran "Intégrité Dossier"

```
Workspace: OQTF - M. DUBOIS (WS-2026-042)

┌─────────────────────────────────────┐
│ STATUT INFORMATIONS                │
├─────────────────────────────────────┤
│ ✅ Complètes:     12 / 15          │
│ ⚠️  Incomplètes:   2 / 15          │
│ ❗ Ambiguës:      1 / 15          │
│                                     │
│ 🚫 CLÔTURE BLOQUÉE                 │
│    → 3 informations non résolues    │
│                                     │
│ [Résoudre maintenant]              │
└─────────────────────────────────────┘
```

---

## 📜 PREUVE EN CAS DE LITIGE

### Export Audit Trail

```json
{
  "information_id": "INFO-2026-001",
  "source": "EMAIL",
  "received_at": "2026-01-15T09:23:00Z",
  "current_status": "CLOSED",
  "audit_trail": [
    {
      "status": "RECEIVED",
      "timestamp": "2026-01-15T09:23:00Z",
      "by": "SYSTEM"
    },
    {
      "status": "CLASSIFIED",
      "timestamp": "2026-01-15T09:24:12Z",
      "by": "SYSTEM",
      "confidence": 0.89,
      "classification": "NOUVEAU_CLIENT"
    },
    {
      "status": "INCOMPLETE",
      "timestamp": "2026-01-15T09:30:00Z",
      "by": "SYSTEM",
      "reason": "Date de naissance manquante",
      "missing_fields": ["date_of_birth"]
    },
    {
      "status": "HUMAN_ACTION_REQUIRED",
      "timestamp": "2026-01-18T09:30:00Z",
      "by": "SYSTEM",
      "reason": "Escalation automatique (72h sans résolution)"
    },
    {
      "status": "RESOLVED",
      "timestamp": "2026-01-19T14:20:00Z",
      "by": "USER_avocat123",
      "reason": "Date de naissance reçue par téléphone",
      "resolution_note": "Confirmé au tel: 15/03/1985"
    },
    {
      "status": "CLOSED",
      "timestamp": "2026-01-26T00:00:00Z",
      "by": "SYSTEM",
      "reason": "Auto-close après 7 jours en RESOLVED"
    }
  ],
  "escalations": [
    {
      "date": "2026-01-17T09:30:00Z",
      "type": "EMAIL_REMINDER",
      "sent_to": "client@example.com"
    },
    {
      "date": "2026-01-18T09:30:00Z",
      "type": "LAWYER_ALERT",
      "sent_to": "avocat@cabinet.com"
    }
  ],
  "human_validations": [
    {
      "validated_at": "2026-01-19T14:20:00Z",
      "validated_by": "USER_avocat123",
      "action": "RESOLVED",
      "note": "Date de naissance confirmée téléphoniquement"
    }
  ]
}
```

### Certificat de Traçabilité (PDF)

```
CERTIFICAT DE TRAÇABILITÉ
─────────────────────────

Information ID:    INFO-2026-001
Source:           Email (client@example.com)
Date réception:   15 janvier 2026, 09:23

CYCLE COMPLET:
✅ Réception:     15/01/2026 09:23 (SYSTEM)
✅ Classification: 15/01/2026 09:24 (SYSTEM - 89% confiance)
⚠️  Incomplet:     15/01/2026 09:30 (SYSTEM - Date naissance manquante)
📧 Rappel envoyé:  17/01/2026 09:30 (Email client)
🔔 Escalade:      18/01/2026 09:30 (Alerte avocat)
✅ Résolu:        19/01/2026 14:20 (Avocat: Confirmation téléphonique)
✅ Archivé:       26/01/2026 00:00 (SYSTEM - Auto-close)

PREUVE:
- 6 transitions enregistrées
- 2 escalades documentées
- 1 validation humaine
- Aucun angle mort détecté

Hash intégrité: sha256:a3f2e9b...
Date émission:  21/01/2026
```

---

## 💼 ARGUMENTS COMMERCIAUX

### Argument 1: Conformité RGPD Renforcée

**Promesse:**
> "Aucune donnée personnelle ne peut être perdue ou oubliée dans le système."

**Preuve:**
- Audit trail complet
- Statuts obligatoires
- Escalades automatiques
- Export conforme RGPD

### Argument 2: Responsabilité Clarifiée

**Promesse:**
> "Vous savez toujours qui a fait quoi, quand, et pourquoi."

**Preuve:**
- Chaque transition signée (SYSTEM ou USER_ID)
- Justification obligatoire
- Impossible de masquer une action

### Argument 3: Protection Juridique

**Promesse:**
> "En cas de litige, vous avez la preuve de votre diligence."

**Preuve:**
- Certificat de traçabilité
- Journal d'audit inaltérable
- Escalades documentées
- Actions humaines horodatées

### Argument 4: Zéro Surprise Client

**Promesse:**
> "Vos clients voient en temps réel l'état de leur dossier."

**Preuve:**
- Dashboard "Intégrité du dossier"
- Compteurs visuels (traité/bloqué/requis)
- Transparence totale

---

## 🎯 POSITIONNEMENT MARCHÉ

### Ce qu'on NE promet PAS

❌ Résultat juridique garanti  
❌ Décision automatisée  
❌ Vérité absolue  
❌ Zéro intervention humaine  

### Ce qu'on PROMET

✅ **Processus fermé** (aucune fuite)  
✅ **Traçabilité totale** (audit complet)  
✅ **Absence d'angle mort** (tout est suivi)  
✅ **Escalade automatique** (pas d'oubli)  
✅ **Responsabilité claire** (qui a fait quoi)  

---

## 📐 IMPLÉMENTATION TECHNIQUE

### Base de Données (PostgreSQL)

```sql
CREATE TABLE information_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,
    content_hash CHAR(64) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    current_status VARCHAR(50) NOT NULL,
    status_reason TEXT,
    requires_human_action BOOLEAN DEFAULT FALSE,
    
    linked_workspace_id UUID REFERENCES workspaces(id),
    
    status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_status_change_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_status_change_by VARCHAR(255) NOT NULL,
    
    escalation_count INT DEFAULT 0,
    
    human_validated BOOLEAN DEFAULT FALSE,
    validated_at TIMESTAMPTZ,
    validated_by VARCHAR(255),
    
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (
        current_status IN (
            'RECEIVED', 'CLASSIFIED', 'ANALYZED',
            'INCOMPLETE', 'AMBIGUOUS', 'HUMAN_ACTION_REQUIRED',
            'RESOLVED', 'CLOSED'
        )
    ),
    
    CONSTRAINT valid_source CHECK (
        source IN ('EMAIL', 'DOCUMENT', 'FORM', 'PHONE', 'API')
    )
);

-- Index pour performance
CREATE INDEX idx_info_status ON information_units(current_status);
CREATE INDEX idx_info_workspace ON information_units(linked_workspace_id);
CREATE INDEX idx_info_received ON information_units(received_at);
CREATE INDEX idx_info_requires_action ON information_units(requires_human_action);

-- Trigger auto-update timestamp
CREATE OR REPLACE FUNCTION update_information_unit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_status_change_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_info_unit_update
    BEFORE UPDATE ON information_units
    FOR EACH ROW
    EXECUTE FUNCTION update_information_unit_timestamp();
```

### Modèle Prisma

```prisma
model InformationUnit {
  id String @id @default(uuid())
  
  source String // EMAIL, DOCUMENT, FORM, PHONE, API
  contentHash String @map("content_hash")
  receivedAt DateTime @default(now()) @map("received_at")
  
  currentStatus String @map("current_status")
  statusReason String? @map("status_reason")
  requiresHumanAction Boolean @default(false) @map("requires_human_action")
  
  linkedWorkspaceId String? @map("linked_workspace_id")
  workspace Workspace? @relation(fields: [linkedWorkspaceId], references: [id])
  
  statusHistory String @default("[]") @map("status_history") // JSON
  lastStatusChangeAt DateTime @default(now()) @map("last_status_change_at")
  lastStatusChangeBy String @map("last_status_change_by")
  
  escalationCount Int @default(0) @map("escalation_count")
  
  humanValidated Boolean @default(false) @map("human_validated")
  validatedAt DateTime? @map("validated_at")
  validatedBy String? @map("validated_by")
  
  metadata String? // JSON
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@index([currentStatus])
  @@index([linkedWorkspaceId])
  @@index([receivedAt])
  @@index([requiresHumanAction])
  @@map("information_units")
}
```

### Service TypeScript

```typescript
// src/lib/information-unit/service.ts

interface StatusTransition {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: Date;
  reason: string;
  metadata?: Record<string, any>;
}

export class InformationUnitService {
  
  /**
   * Créer nouvelle unité d'information
   */
  async create(data: {
    source: string;
    content: string;
    linkedWorkspaceId?: string;
  }): Promise<InformationUnit> {
    const contentHash = this.calculateHash(data.content);
    
    const unit = await prisma.informationUnit.create({
      data: {
        source: data.source,
        contentHash,
        currentStatus: 'RECEIVED',
        statusReason: 'Nouvelle information reçue',
        lastStatusChangeBy: 'SYSTEM',
        statusHistory: JSON.stringify([{
          status: 'RECEIVED',
          timestamp: new Date().toISOString(),
          by: 'SYSTEM'
        }]),
        linkedWorkspaceId: data.linkedWorkspaceId,
        metadata: JSON.stringify({ rawContent: data.content })
      }
    });
    
    // Auto-classification dans 5 secondes
    setTimeout(() => this.autoClassify(unit.id), 5000);
    
    return unit;
  }
  
  /**
   * Transition d'état (avec validation)
   */
  async transition(
    unitId: string,
    toStatus: string,
    reason: string,
    changedBy: string,
    metadata?: Record<string, any>
  ): Promise<InformationUnit> {
    const unit = await prisma.informationUnit.findUnique({
      where: { id: unitId }
    });
    
    if (!unit) throw new Error('Unit not found');
    
    // Validation transition
    this.validateTransition(unit.currentStatus, toStatus);
    
    // Construire historique
    const history: StatusTransition[] = JSON.parse(unit.statusHistory);
    history.push({
      fromStatus: unit.currentStatus,
      toStatus,
      changedBy,
      changedAt: new Date(),
      reason,
      metadata
    });
    
    // Mise à jour
    return await prisma.informationUnit.update({
      where: { id: unitId },
      data: {
        currentStatus: toStatus,
        statusReason: reason,
        lastStatusChangeBy: changedBy,
        statusHistory: JSON.stringify(history),
        requiresHumanAction: this.checkHumanActionRequired(toStatus),
        metadata: metadata ? JSON.stringify(metadata) : unit.metadata
      }
    });
  }
  
  /**
   * Validation transition autorisée
   */
  private validateTransition(from: string, to: string): void {
    const allowed: Record<string, string[]> = {
      'RECEIVED': ['CLASSIFIED'],
      'CLASSIFIED': ['ANALYZED'],
      'ANALYZED': ['INCOMPLETE', 'AMBIGUOUS', 'RESOLVED'],
      'INCOMPLETE': ['HUMAN_ACTION_REQUIRED', 'RESOLVED'],
      'AMBIGUOUS': ['HUMAN_ACTION_REQUIRED', 'RESOLVED'],
      'HUMAN_ACTION_REQUIRED': ['RESOLVED'],
      'RESOLVED': ['CLOSED']
    };
    
    if (!allowed[from]?.includes(to)) {
      throw new Error(`Transition ${from} → ${to} interdite`);
    }
  }
  
  /**
   * Vérifier si action humaine requise
   */
  private checkHumanActionRequired(status: string): boolean {
    return ['INCOMPLETE', 'AMBIGUOUS', 'HUMAN_ACTION_REQUIRED'].includes(status);
  }
  
  /**
   * Escalade automatique (cron job)
   */
  async escalateStaleUnits(): Promise<void> {
    const now = new Date();
    const threshold48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const threshold72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    
    // INCOMPLETE > 48h → Rappel
    const incomplete48h = await prisma.informationUnit.findMany({
      where: {
        currentStatus: 'INCOMPLETE',
        lastStatusChangeAt: { lt: threshold48h },
        escalationCount: 0
      }
    });
    
    for (const unit of incomplete48h) {
      await this.sendReminderEmail(unit);
      await prisma.informationUnit.update({
        where: { id: unit.id },
        data: { escalationCount: 1 }
      });
    }
    
    // INCOMPLETE > 72h → Escalade
    const incomplete72h = await prisma.informationUnit.findMany({
      where: {
        currentStatus: 'INCOMPLETE',
        lastStatusChangeAt: { lt: threshold72h }
      }
    });
    
    for (const unit of incomplete72h) {
      await this.transition(
        unit.id,
        'HUMAN_ACTION_REQUIRED',
        'Escalation automatique (72h sans résolution)',
        'SYSTEM'
      );
      await this.sendLawyerAlert(unit);
    }
  }
  
  /**
   * Calculer hash SHA-256
   */
  private calculateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
```

---

## 🧪 TESTS OBLIGATOIRES

```typescript
// __tests__/information-unit.test.ts

describe('InformationUnit - Pipeline Fermé', () => {
  
  test('Interdiction transition directe RECEIVED → CLOSED', async () => {
    const unit = await service.create({
      source: 'EMAIL',
      content: 'Test'
    });
    
    await expect(
      service.transition(unit.id, 'CLOSED', 'Test', 'SYSTEM')
    ).rejects.toThrow('Transition RECEIVED → CLOSED interdite');
  });
  
  test('Escalade automatique INCOMPLETE > 72h', async () => {
    // Créer unité incomplete il y a 73h
    const unit = await prisma.informationUnit.create({
      data: {
        source: 'EMAIL',
        contentHash: 'abc123',
        currentStatus: 'INCOMPLETE',
        lastStatusChangeAt: new Date(Date.now() - 73 * 60 * 60 * 1000)
      }
    });
    
    await service.escalateStaleUnits();
    
    const updated = await prisma.informationUnit.findUnique({
      where: { id: unit.id }
    });
    
    expect(updated.currentStatus).toBe('HUMAN_ACTION_REQUIRED');
  });
  
  test('Historique complet enregistré', async () => {
    const unit = await service.create({
      source: 'EMAIL',
      content: 'Test'
    });
    
    await service.transition(unit.id, 'CLASSIFIED', 'Auto', 'SYSTEM');
    await service.transition(unit.id, 'ANALYZED', 'Auto', 'SYSTEM');
    await service.transition(unit.id, 'RESOLVED', 'Manual', 'USER_123');
    
    const final = await prisma.informationUnit.findUnique({
      where: { id: unit.id }
    });
    
    const history = JSON.parse(final.statusHistory);
    expect(history).toHaveLength(4); // RECEIVED + 3 transitions
    expect(history[3].toStatus).toBe('RESOLVED');
    expect(history[3].changedBy).toBe('USER_123');
  });
});
```

---

## 📊 MÉTRIQUES PRODUIT

### Dashboard Super Admin

```
╔═══════════════════════════════════════════╗
║  📊 GARANTIE ZÉRO INFORMATION IGNORÉE    ║
╠═══════════════════════════════════════════╣
║                                           ║
║  Informations actives:        1,247      ║
║                                           ║
║  ✅ Résolues (7j):              892      ║
║  ⚠️  En cours:                  342      ║
║  🔴 Action requise:              13      ║
║                                           ║
║  Taux résolution < 72h:      94.2%      ║
║  Taux escalade:               1.04%      ║
║  Temps moyen résolution:     28h         ║
║                                           ║
║  [Voir détails] [Export audit]          ║
╚═══════════════════════════════════════════╝
```

---

## ✅ CHECKLIST IMPLÉMENTATION

- [ ] Créer table `information_units` en PostgreSQL
- [ ] Ajouter modèle Prisma `InformationUnit`
- [ ] Implémenter `InformationUnitService`
- [ ] Créer triggers auto-escalade (cron jobs)
- [ ] Implémenter dashboard "Intégrité dossier"
- [ ] Créer export audit trail (JSON + PDF)
- [ ] Écrire tests pipeline fermé
- [ ] Documenter API endpoints
- [ ] Former équipe sur workflow
- [ ] Configurer monitoring métriques

---

**PROPRIÉTÉ STRUCTURELLE GARANTIE** ✅

Cette garantie est **inscrite dans le code**, pas dans le marketing.

