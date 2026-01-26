# Plan d'Adaptation - iaPostemanage

## Phase 1 : Stabilisation (Semaine 1-2)

### 1.1 APIs Dashboard (PRIORITÉ 1)
Créer les endpoints manquants appelés par `/dashboard` :

```
✅ Existant : Auth, session
❌ À créer :
- GET /api/tenant/[tenantId]/dashboard/stats
- GET /api/tenant/[tenantId]/dashboard/monthly-data
- GET /api/tenant/[tenantId]/dashboard/recent-activities
```

**Fichiers à créer :**
- `src/app/api/tenant/[tenantId]/dashboard/stats/route.ts`
- `src/app/api/tenant/[tenantId]/dashboard/monthly-data/route.ts`
- `src/app/api/tenant/[tenantId]/dashboard/recent-activities/route.ts`

### 1.2 CRUD Clients (PRIORITÉ 2)
Compléter la gestion clients :

```
Pages existantes : /clients (à vérifier)
APIs à créer :
- GET /api/tenant/[tenantId]/clients (liste)
- POST /api/tenant/[tenantId]/clients (création)
- GET /api/tenant/[tenantId]/clients/[id] (détail)
- PUT /api/tenant/[tenantId]/clients/[id] (modification)
- DELETE /api/tenant/[tenantId]/clients/[id] (soft delete)
```

### 1.3 CRUD Dossiers (PRIORITÉ 3)
Compléter la gestion dossiers :

```
Pages existantes : /dossiers (à vérifier)
APIs à créer :
- GET /api/tenant/[tenantId]/dossiers
- POST /api/tenant/[tenantId]/dossiers
- GET /api/tenant/[tenantId]/dossiers/[id]
- PUT /api/tenant/[tenantId]/dossiers/[id]
```

### 1.4 Upload Documents (PRIORITÉ 4)
Système de stockage simple :

```
- POST /api/tenant/[tenantId]/documents/upload
- GET /api/tenant/[tenantId]/documents/[id]
- Stockage : filesystem local (/uploads) pour MVP
- Hash SHA-256 pour intégrité
```

## Phase 2 : Fonctionnalités Métier (Semaine 3-4)

### 2.1 Délais Légaux
Utiliser le modèle `LegalDeadline` existant :

```typescript
// Calcul automatique basé sur DeadlineType
RECOURS_GRACIEUX → +2 mois
RECOURS_CONTENTIEUX → +2 mois
OQTF → +30 jours
```

**Page à créer :**
- `/dossiers/[id]/delais` - Gestion des délais par dossier

### 2.2 Notifications Email
Utiliser Nodemailer (déjà dans package.json) :

```
Alertes :
- J-7 : Email simple
- J-3 : Email + notification in-app
- J-1 : Email urgent
```

### 2.3 Facturation Basique
Utiliser le modèle `Facture` existant :

```
Pages :
- /factures - Liste
- /factures/new - Création
- /factures/[id] - Détail + PDF

Génération PDF : jspdf (déjà installé)
```

## Phase 3 : IA Locale (Semaine 5-6)

### 3.1 Classification Emails
Utiliser Ollama (config déjà dans TenantSettings) :

```typescript
// lib/ai/email-classifier.ts
export async function classifyEmail(content: string) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.2:latest',
      prompt: `Classifie cet email : ${content}`,
    })
  });
  return response.json();
}
```

### 3.2 OCR Documents
Utiliser pdf-parse (déjà installé) :

```typescript
// lib/ai/ocr-processor.ts
import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}
```

## Phase 4 : Portail Client (Semaine 7-8)

### 4.1 Dashboard Client
Page `/client-dashboard` (déjà référencée) :

```
Afficher :
- Mes dossiers (lecture seule)
- Mes documents
- Mes factures
- Messagerie avec avocat
```

### 4.2 Upload Client
Permettre au client d'uploader des documents :

```
- Formulaire simple
- Lien automatique au dossier
- Notification avocat
```

## Nettoyage Parallèle

### À supprimer immédiatement
```bash
# Dossiers temporaires
rm -rf 32c98bd1-*
rm -rf 5f0ee45d-*
rm -rf ae0d827e-*
rm -rf fadec518-*

# Logs de build
rm build-*.txt
rm build-*.log
rm tsc-output.txt
rm typescript-errors.txt

# Backups inutiles
rm *.bak
rm *.backup
rm proxy.ts.backup
```

### À consolider
```bash
# Garder uniquement
.env.local (dev)
.env.production (prod)

# Supprimer
.env.me
.env.previous
.env.keys
.env.vault
.env.vercel.check
```

### Scripts à garder (5 max)
```
start.ps1 - Démarrage dev
build.ps1 - Build production
deploy-vercel.ps1 - Déploiement
db-backup.ps1 - Backup DB
test-all.ps1 - Tests
```

## Métriques de Succès

### Semaine 2
- [ ] Dashboard affiche vraies données
- [ ] CRUD Clients fonctionnel
- [ ] CRUD Dossiers fonctionnel

### Semaine 4
- [ ] Upload documents OK
- [ ] Délais légaux calculés
- [ ] Alertes email envoyées

### Semaine 6
- [ ] Classification email IA
- [ ] OCR PDF basique
- [ ] Facturation PDF

### Semaine 8
- [ ] Portail client accessible
- [ ] 3 cabinets pilotes testent
- [ ] Feedback collecté

## Stack Finale Simplifiée

```
Frontend : Next.js 16 + React 19 + TypeScript
Backend : Next.js API Routes
Database : PostgreSQL (Neon)
ORM : Prisma
Auth : NextAuth.js
Storage : Filesystem local → S3 en V2
IA : Ollama local
Email : Nodemailer
PDF : jspdf
Déploiement : Vercel
```

## Règles d'Or

1. **Pas de nouvelle feature avant que les 4 CRUD soient finis**
2. **Tester avec vraies données dès Semaine 2**
3. **1 cabinet pilote dès Semaine 4**
4. **Pas de refactoring avant validation utilisateur**
5. **Garder multi-canal, workflows, analytics pour V2**

## Prochaine Action

Créer les 3 APIs dashboard pour débloquer la page existante.
