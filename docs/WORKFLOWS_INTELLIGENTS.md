# 🤖 SYSTÈME DE WORKFLOWS INTELLIGENTS - DOCUMENTATION COMPLÈTE

## 📧 Concept: Email → IA → Notification → Formulaire → Planning → Réponse

### Architecture Globale

```
┌─────────────────┐
│  Email Reçu     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Analyse IA     │◄── Ollama llama3.2
│  - Catégorie    │
│  - Urgence      │
│  - Questions    │
│  - Entités      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Notification   │◄── Obligatoire (non dismissible)
│  Contextuelle   │    avec actions interactives
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Formulaire     │◄── Généré dynamiquement
│  Dynamique      │    selon le contexte
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Actions Auto   │
│  - Planning     │
│  - Tâches       │
│  - Email reply  │
└─────────────────┘
```

---

## 🎯 6 WORKFLOWS INTELLIGENTS IMPLÉMENTÉS

### 1️⃣ WORKFLOW: Email Urgent

**Déclencheur:** Email avec urgence high/critical

**Flux:**
1. **Analyse IA** - Détermine nature de l'urgence
2. **Notification Critique** - Alerte non-dismissible
3. **Formulaire Contexte** - Questions spécifiques:
   - Niveau d'urgence réel
   - Type de problème
   - Action requise
   - Assignment
   - Planifier réunion?
4. **Planning Automatique** - Si réunion cochée
5. **Réponse IA** - Brouillon généré par l'IA

**Exemple d'utilisation:**
```
Email: "URGENT: Client menacé d'expulsion demain matin!"
↓
IA détecte: urgency=critical, category=client-urgent
↓
Notification: 🚨 Demande Client Urgente - Action Immédiate
↓
Formulaire: Traitement urgence + choix réunion aujourd'hui
↓
Calendrier: Bloque 14h-15h pour consultation urgente
↓
Email auto: "Nous avons bien reçu votre demande urgente..."
```

---

### 2️⃣ WORKFLOW: Facture Automatique

**Déclencheur:** Email catégorie "invoice" avec pièce jointe

**Flux:**
1. **OCR + Extraction IA** - Lit la facture
   - Montant
   - Date échéance
   - Fournisseur
2. **Notification Validation** - Requiert approbation
3. **Formulaire Validation**:
   - Montant correct?
   - Mode de paiement
   - Code budgétaire
   - Approbateur
4. **Échéance Calendrier** - Ajoute deadline paiement
5. **Tâche Approbation** - Workflow approval
6. **Email Confirmation** - À toutes les parties

**Exemple d'utilisation:**
```
Email: Facture Microsoft 1,250€ échéance 15/02
↓
IA extrait: amount=1250, dueDate=2026-02-15, vendor=Microsoft
↓
Notification: 💰 Facture Reçue - Validation Requise
↓
Formulaire: Valider 1,250€ - Budget IT - Approver: CFO
↓
Calendrier: Rappel paiement 08/02, 12/02, 14/02
↓
Email: "Facture validée, paiement programmé"
```

---

### 3️⃣ WORKFLOW: Nouveau Dossier

**Déclencheur:** Email "new-case"

**Flux:**
1. **Analyse Type Dossier** - Catégorisation automatique
2. **Notification Nouveau Client**
3. **Formulaire Intake**:
   - Type de dossier
   - Parties impliquées
   - Complexité
   - Budget
   - Documents nécessaires
4. **Création Dossier** - Dans le système
5. **Planning Consultation** - Premier RDV
6. **Tâches Ouverture**:
   - Vérification conflits
   - Collecte documents
   - Budget prévisionnel
7. **Email Bienvenue** - Avec formulaire intake

**Exemple d'utilisation:**
```
Email: "Bonjour, je souhaite divorcer à l'amiable"
↓
IA détecte: category=new-case, type=divorce, complexity=medium
↓
Notification: 📁 Nouveau Dossier à Traiter
↓
Formulaire: Intake divorce - Parties - Budget - Documents
↓
Dossier: #D2026-0042 créé automatiquement
↓
Calendrier: RDV intake 12/01 à 10h
↓
Email: "Bienvenue chez notre cabinet..."
```

---

### 4️⃣ WORKFLOW: Question Juridique

**Déclencheur:** Email catégorie "legal-question"

**Flux:**
1. **Catégorisation Juridique** - Domaine de droit
2. **Recherche IA** - Jurisprudence + doctrine
3. **Brouillon IA** - Réponse générée avec citations
4. **Notification Révision** - À avocat senior
5. **Formulaire Révision**:
   - Brouillon affiché
   - Édition possible
   - Approuver/Modifier/Rejeter
6. **Décision** - Validation finale
7. **Email Réponse** - Envoi au client

**Exemple d'utilisation:**
```
Email: "Puis-je résilier mon bail avant terme?"
↓
IA recherche: Loi 89-462, Article 15, jurisprudence récente
↓
Brouillon IA: "Selon l'article 15... vous pouvez résilier si..."
↓
Notification: ❓ Question Juridique - Révision Requise
↓
Avocat révise et approuve le brouillon
↓
Email envoyé: Réponse juridique complète
```

---

### 5️⃣ WORKFLOW: Gestion Délais

**Déclencheur:** Email "deadline-reminder"

**Flux:**
1. **Extraction Délai** - Parsing langage naturel
2. **Évaluation Impact** - Risque si dépassement
3. **Alerte Critique** - Son + vibration
4. **Formulaire Gestion**:
   - Plan d'action
   - Responsable
   - Jalons intermédiaires
   - Plan de contingence
5. **Mise à Jour Calendrier** - Countdown + milestones
6. **Tâches Préparation** - Backward planning
7. **Notifications Multiples** - Client, équipe, adversaire

**Exemple d'utilisation:**
```
Email: "Rappel: Mémoire en défense à déposer avant le 20/01"
↓
IA extrait: deadline=2026-01-20, document=mémoire, consequence=grave
↓
Notification: ⏰ DÉLAI CRITIQUE - 14 jours restants
↓
Formulaire: Plan préparation - Jalons - Responsables
↓
Calendrier: 
  - 10/01: Recherche terminée
  - 15/01: Draft complet
  - 18/01: Révision finale
  - 20/01: DÉPÔT
↓
Emails: Notifications à toutes les parties
```

---

### 6️⃣ WORKFLOW: Document Tribunal

**Déclencheur:** Email "court-document" avec PDF

**Flux:**
1. **OCR + Extraction IA**:
   - Dates d'audience
   - Parties
   - Obligations
2. **Analyse Implications** - Ce qu'on doit faire
3. **Alerte Document Tribunal**
4. **Formulaire Plan d'Action**:
   - Stratégie suggérée
   - Pièces à préparer
   - Recherche nécessaire
5. **Blocage Calendrier** - Dates + préparation
6. **Checklist Préparation**:
   - Recherche jurisprudence
   - Rédaction conclusions
   - Préparation plaidoirie
7. **Email Confirmation** - Client + équipe

**Exemple d'utilisation:**
```
Email: Document tribunal - Audience fixée au 15/03/2026
↓
IA extrait: date=2026-03-15, type=audience, jurisdiction=TGI
↓
Notification: ⚖️ Document Tribunal - Action Immédiate
↓
Formulaire: Stratégie - Pièces - Plan préparation
↓
Calendrier: 15/03 bloqué + 10/03 préparation
↓
Checklist: 12 tâches créées automatiquement
↓
Email: "Audience confirmée, préparation en cours"
```

---

## 🎨 FORMULAIRES DYNAMIQUES GÉNÉRÉS

### Exemple: Formulaire Client Urgent

```typescript
{
  formId: 'client-urgent-intake',
  title: 'Traitement Demande Urgente',
  fields: [
    {
      id: 'urgencyLevel',
      type: 'select',
      label: 'Niveau d\'urgence réel',
      required: true,
      options: ['Critique (< 24h)', 'Élevé (< 48h)', 'Moyen (< 1 semaine)'],
    },
    {
      id: 'scheduleMeeting',
      type: 'checkbox',
      label: 'Planifier une réunion avec le client',
    },
    {
      id: 'meetingDate',
      type: 'date',
      label: 'Date de réunion',
      conditional: {
        field: 'scheduleMeeting',
        value: true,
        operator: 'equals',
      },
    },
  ],
  onSubmit: {
    action: 'schedule',
    config: {
      createTask: true,
      sendEmail: true,
      updateDossier: true,
    },
  },
}
```

---

## 📊 ANALYSE IA CONTEXTUELLE

### Catégories Détectées

- `client-urgent` - Urgence client
- `new-case` - Nouveau dossier
- `deadline-reminder` - Rappel délai
- `invoice` - Facture
- `legal-question` - Question juridique
- `court-document` - Document tribunal
- `client-complaint` - Réclamation
- `document-request` - Demande documents
- `appointment-request` - Demande RDV
- `general-inquiry` - Demande générale

### Niveaux d'Urgence

- `critical` - < 24h
- `high` - < 48h
- `medium` - < 1 semaine
- `low` - > 1 semaine

### Sentiment Analysé

- `positive` - Client satisfait
- `neutral` - Neutre
- `negative` - Client mécontent/urgent

---

## 🔔 NOTIFICATIONS INTERACTIVES

### Types de Notifications

1. **email-action-required** - Email nécessite action
2. **form-required** - Formulaire à remplir
3. **approval-needed** - Approbation requise
4. **deadline-alert** - Alerte délai

### Actions Disponibles

- **Traiter la Demande** - Ouvre formulaire contextuel
- **Planifier Rendez-vous** - Accès calendrier
- **Répondre** - Brouillon IA pré-rempli
- **Déléguer** - Assigner à quelqu'un d'autre

---

## 🚀 UTILISATION

### 1. Déclencher un Workflow

```bash
POST /api/workflows/trigger

{
  "emailData": {
    "subject": "URGENT: Problème client",
    "body": "Le client XYZ menace de...",
    "from": "client@example.com",
    "receivedAt": "2026-01-06T10:00:00Z"
  }
}
```

### 2. Consulter les Notifications

```
http://localhost:3000/lawyer/notifications
```

### 3. Remplir le Formulaire Contextuel

```
http://localhost:3000/lawyer/workflows/form/{notificationId}
```

---

## 💡 AUTRES WORKFLOWS POSSIBLES

### 7. Email Réclamation → Analyse Sentiment → Escalade

### 8. Document Signature → Vérification → Stockage → Confirmation

### 9. Relance Paiement → Historique → Action Graduelle

### 10. Demande Info → Checklist Documents → Suivi Réception

---

## 📁 Fichiers Créés

```
src/lib/workflows/
├── email-intelligence.ts       ✅ Analyse IA emails
├── notification-engine.ts      ✅ Génération notifications
└── workflow-engine.ts          ✅ 6 workflows complets

src/app/api/workflows/
└── trigger/route.ts            ✅ API déclenchement

src/app/lawyer/
└── notifications/page.tsx      ✅ Interface notifications
```

---

**Système 100% opérationnel pour automation intelligente!** 🎯
