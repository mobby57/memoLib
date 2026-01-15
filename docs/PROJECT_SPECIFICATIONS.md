# 📋 SPÉCIFICATIONS PROJET - iaPostemanage

> Documentation complète du projet de gestion juridique SaaS multi-tenant avec IA

---

## 1. Vision & Objectifs

### Vision Produit
Plateforme SaaS de gestion de dossiers juridiques pour avocats, intégrant l'IA pour automatiser le traitement des réclamations La Poste et autres litiges.

### Objectifs Stratégiques
- **Efficacité** : Réduire de 60% le temps de traitement des dossiers
- **Automatisation** : Analyse IA des documents et génération de courriers
- **Multi-tenant** : Supporter plusieurs cabinets d'avocats indépendants
- **Conformité** : RGPD, sécurité des données sensibles, audit trail complet
- **Scalabilité** : Architecture cloud-ready pour croissance rapide

### KPIs Cibles
- Taux de traitement : >80%
- Temps de réponse : <4h
- Satisfaction client : >4.5/5
- Disponibilité : 99.9%

---

## 2. Analyse du Besoin

### Problématiques Identifiées
1. **Gestion manuelle chronophage** : Les avocats passent 70% du temps sur des tâches administratives
2. **Données dispersées** : Documents, emails, factures stockés dans plusieurs outils
3. **Manque de suivi** : Difficile de connaître l'état d'avancement des dossiers clients
4. **Communication inefficace** : Pas de portail client pour consulter ses dossiers
5. **Analyse documentaire lente** : Lecture manuelle de dizaines de pages de documents

### Utilisateurs Cibles
- **Avocats (ADMIN)** : Gestion centralisée de tous les clients et dossiers
- **Clients (CLIENT)** : Portail d'accès à leurs dossiers, upload de documents
- **Super Admins (SUPER_ADMIN)** : Gestion des tenants et configuration globale

### Besoins Fonctionnels
- Dashboard multi-client pour avocats
- Portail client individuel
- Système de dossiers avec statuts et progression
- Upload et classification de documents
- Analyse IA des documents
- Génération automatique de courriers
- Gestion des factures et revenus
- Notifications email automatiques
- Monitoring des emails entrants (La Poste)

---

## 3. Périmètre Fonctionnel

### MVP (Minimum Viable Product)
✅ **Complété**
- [x] Authentification multi-rôles (NextAuth)
- [x] Gestion des tenants (cabinets d'avocats)
- [x] CRUD Clients
- [x] CRUD Dossiers avec statuts
- [x] Upload de documents
- [x] Dashboard avocat avec métriques
- [x] Navigation responsive avec sidebar

🚧 **En développement**
- [ ] Portail client
- [ ] Analyse IA des documents
- [ ] Génération de courriers
- [ ] Monitoring Gmail API

### Phase 2 (Q1 2026)
- [ ] Intégration IA avancée (analyse sémantique)
- [ ] Templates de documents par type de litige
- [ ] Workflow de validation multi-étapes
- [ ] Notifications push en temps réel
- [ ] Export PDF rapports mensuels
- [ ] API publique pour intégrations

### Phase 3 (Q2 2026)
- [ ] Mobile app (React Native)
- [ ] Signature électronique
- [ ] Intégration comptable (export factures)
- [ ] Chat en temps réel avocat-client
- [ ] Marketplace de templates juridiques

### Hors Périmètre
❌ Gestion RH des cabinets
❌ Comptabilité complète
❌ Gestion de planning/agenda
❌ Visioconférence intégrée

---

## 4. Contraintes & Hypothèses

### Contraintes Techniques
- **Stack imposée** : Next.js 14+, Prisma, PostgreSQL
- **Hébergement** : Compatible Vercel/Railway/AWS
- **Budget serveur** : <200€/mois pour 100 utilisateurs
- **Temps de réponse** : <2s pour 95% des requêtes

### Contraintes Réglementaires
- **RGPD** : Consentement, droit à l'oubli, portabilité
- **Secret professionnel avocat** : Chiffrement des données sensibles
- **Conservation légale** : Logs d'audit sur 5 ans minimum
- **Localisation données** : Serveurs UE obligatoire

### Hypothèses
- Les utilisateurs ont une connexion internet stable
- Les avocats sont formés aux outils numériques de base
- Les clients acceptent un portail web (pas d'app mobile MVP)
- Les documents sont majoritairement en PDF/images scannées

---

## 5. Architecture Générale

### Architecture Applicative

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Dashboard   │  │ Client Portal│  │  Admin Panel │ │
│  │    Avocat     │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  API ROUTES (Next.js)                   │
│  /api/auth  /api/tenant  /api/client  /api/admin       │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC                         │
│  Services: aiService, auditService, emailService        │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER (Prisma)                    │
│  Models: User, Tenant, Client, Dossier, Document        │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL / SQLite)             │
└─────────────────────────────────────────────────────────┘
```

### Architecture Multi-tenant

**Isolation par tenantId** : Chaque cabinet (tenant) a ses propres données isolées via une clé `tenantId` dans chaque table.

**Avantages** :
- Coût réduit (1 seule DB pour tous)
- Déploiement simplifié
- Facilité de backup global

**Sécurité** :
- Middleware vérifie `user.tenantId === resource.tenantId` sur chaque requête
- Index DB sur tenantId pour performance
- Audit logs séparés par tenant

---

## 6. Choix Technologiques

### Stack Technique

| Couche | Technologie | Version | Justification |
|--------|-------------|---------|---------------|
| **Framework** | Next.js | 16.1.1 | SSR, App Router, API routes intégrées |
| **Language** | TypeScript | 5.x | Type safety, meilleure DX |
| **Database** | SQLite (dev) / PostgreSQL (prod) | - | Prisma compatible, migration facile |
| **ORM** | Prisma | Latest | Type-safe queries, migrations auto |
| **Auth** | NextAuth.js | v5 | Session-based, multi-provider |
| **UI** | Tailwind CSS | 3.x | Utility-first, dark mode, responsive |
| **Icons** | Lucide React | Latest | Tree-shakable, cohérent |
| **Forms** | React Hook Form | 7.x | Performance, validation |
| **State** | React Hooks | - | useState, useEffect, custom hooks |
| **AI** | OpenAI API | v4 | GPT-4 pour analyse documents |
| **Email** | Gmail API | v1 | Monitoring emails La Poste |
| **Logs** | Winston | 3.x | Structured logging, niveaux |
| **Tests** | Jest + React Testing Library | - | Unit + integration tests |

### Dépendances Principales

```json
{
  "dependencies": {
    "next": "16.1.1",
    "react": "^19.0.0",
    "prisma": "^6.2.1",
    "next-auth": "^5.0.0-beta.25",
    "tailwindcss": "^3.4.17",
    "lucide-react": "^0.468.0",
    "zod": "^3.24.1",
    "winston": "^3.17.0"
  }
}
```

### Raisons des Choix

**Next.js** :
- ✅ SSR pour SEO et performance
- ✅ API routes = backend intégré
- ✅ Déploiement Vercel en 1 clic
- ✅ Hot reload, TypeScript natif

**Prisma** :
- ✅ Schéma déclaratif type-safe
- ✅ Migrations automatiques
- ✅ Support multi-DB (SQLite → PostgreSQL)
- ✅ Relations explicites

**NextAuth** :
- ✅ Session-based sécurisé
- ✅ Role-based access control
- ✅ Support OAuth + Credentials
- ✅ Middleware intégré Next.js

---

## 7. Modélisation des Données

### Schéma Prisma Complet

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?
  role          Role      @default(CLIENT)
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  dossiers      Dossier[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLogin     DateTime?
  
  @@index([tenantId])
  @@index([email])
}

model Tenant {
  id        String   @id @default(cuid())
  nom       String
  plan      Plan     @default(STARTER)
  users     User[]
  dossiers  Dossier[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Dossier {
  id          String     @id @default(cuid())
  numero      String     @unique
  titre       String
  type        TypeDossier
  statut      Statut     @default(EN_ATTENTE)
  description String?
  clientId    String
  client      User       @relation(fields: [clientId], references: [id])
  tenantId    String
  tenant      Tenant     @relation(fields: [tenantId], references: [id])
  documents   Document[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  @@index([tenantId])
  @@index([clientId])
  @@index([statut])
}

model Document {
  id         String   @id @default(cuid())
  nom        String
  type       String
  url        String
  taille     Int
  dossierId  String
  dossier    Dossier  @relation(fields: [dossierId], references: [id])
  uploadedAt DateTime @default(now())
  
  @@index([dossierId])
}

enum Role {
  SUPER_ADMIN
  ADMIN
  CLIENT
}

enum Plan {
  STARTER
  PRO
  ENTERPRISE
}

enum TypeDossier {
  RECLAMATION
  INDEMNISATION
  LITIGE
}

enum Statut {
  EN_ATTENTE
  DOCUMENTS_REQUIS
  EN_COURS
  ANALYSE_IA
  TERMINE
  ARCHIVE
}
```

### Relations

- **User → Tenant** : Many-to-One (plusieurs users par cabinet)
- **User → Dossier** : One-to-Many (un client a plusieurs dossiers)
- **Dossier → Document** : One-to-Many (un dossier contient plusieurs documents)
- **Tenant → Dossier** : One-to-Many (isolation des données)

### Index de Performance

- `tenantId` : Sur toutes les tables multi-tenant
- `email` : Pour authentification rapide
- `statut` : Pour filtres dashboard
- `clientId` : Pour requêtes dossiers d'un client

---

## 8. Gestion des Utilisateurs & Rôles

### Rôles & Permissions

| Rôle | Permissions | Cas d'usage |
|------|-------------|-------------|
| **SUPER_ADMIN** | - Créer/modifier tenants<br>- Gérer tous les users<br>- Accès global cross-tenant | Administrateur plateforme |
| **ADMIN** | - Gérer clients du tenant<br>- CRUD dossiers<br>- Voir métriques<br>- Configurer tenant | Avocat du cabinet |
| **CLIENT** | - Voir ses dossiers<br>- Upload documents<br>- Modifier ses infos<br>- Communiquer avec avocat | Client du cabinet |

### Matrice de Permissions

| Action | SUPER_ADMIN | ADMIN | CLIENT |
|--------|-------------|-------|--------|
| Créer tenant | ✅ | ❌ | ❌ |
| Créer client | ✅ | ✅ | ❌ |
| Créer dossier | ✅ | ✅ | ❌ |
| Voir tous dossiers | ✅ | ✅ (tenant) | ❌ (siens) |
| Upload document | ✅ | ✅ | ✅ (ses dossiers) |
| Analyse IA | ✅ | ✅ | ❌ |
| Voir métriques | ✅ | ✅ | ❌ |

### Flux d'Authentification

1. **Login** : POST `/api/auth/signin` avec email/password
2. **Session** : NextAuth crée cookie httpOnly sécurisé
3. **Vérification** : Middleware vérifie session sur chaque requête
4. **RBAC** : Vérification `user.role` et `user.tenantId`
5. **Logout** : DELETE session, redirect `/auth/login`

---

## 9. Sécurité & Gestion des Accès

### Authentification

- **NextAuth Session-based** : Cookies httpOnly, secure, sameSite
- **Hashing passwords** : bcrypt avec salt rounds = 12
- **Session duration** : 7 jours, refresh automatique
- **CSRF protection** : Tokens automatiques NextAuth

### Autorisation

```typescript
// Middleware Zero Trust
export async function middleware(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // 1. Vérifier authentification
  if (!session) return redirect('/auth/login');
  
  // 2. Vérifier rôle
  const path = req.nextUrl.pathname;
  if (path.startsWith('/admin') && session.user.role !== 'ADMIN') {
    return redirect('/unauthorized');
  }
  
  // 3. Vérifier tenantId sur API calls
  if (path.startsWith('/api/tenant/')) {
    const tenantId = path.split('/')[3];
    if (session.user.tenantId !== tenantId) {
      return new Response('Forbidden', { status: 403 });
    }
  }
  
  return NextResponse.next();
}
```

### Protection des Routes

| Route | Protection | Vérification |
|-------|------------|--------------|
| `/dashboard` | ADMIN only | Middleware + session check |
| `/client` | CLIENT only | Middleware + session check |
| `/super-admin` | SUPER_ADMIN only | Middleware + session check |
| `/api/tenant/[id]/*` | tenantId match | API route + session.user.tenantId |
| `/api/admin/*` | ADMIN/SUPER_ADMIN | API route + role check |

### Données Sensibles

**Chiffrement** :
- Passwords : bcrypt hash (1-way)
- Documents : Chiffrement at-rest si S3/storage externe
- Logs : Masquage emails/phones dans Winston

**Validation** :
- Zod schemas pour tous les inputs
- Sanitization XSS avec DOMPurify si render HTML
- SQL injection impossible (Prisma prepared statements)

---

## 10. Protection des Données & Vie Privée

### RGPD Compliance

**Principes appliqués** :
1. **Minimisation** : Collecte uniquement données nécessaires
2. **Finalité** : Usage limité à la gestion juridique
3. **Durée** : Conservation selon obligations légales avocat
4. **Sécurité** : Chiffrement, accès restreint, audit logs

**Droits utilisateurs** :
- ✅ Droit d'accès : Export JSON de toutes leurs données
- ✅ Droit de rectification : Modification profil
- ✅ Droit à l'oubli : Suppression compte + anonymisation
- ✅ Portabilité : Export CSV/JSON

### Gestion du Consentement

```typescript
// Lors de la création compte client
interface ConsentData {
  processingData: boolean;      // Traitement données
  emailNotifications: boolean;  // Notifications email
  dataRetention: boolean;       // Conservation selon durée légale
  consentDate: Date;
  ipAddress: string;
}
```

### Anonymisation

```typescript
// Suppression compte = anonymisation
async function anonymizeUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@anonymized.local`,
      name: 'Utilisateur supprimé',
      password: null,
      phone: null,
      // Garder dossiers pour historique légal
    }
  });
  
  await auditLog({
    action: 'USER_ANONYMIZED',
    userId,
    timestamp: new Date()
  });
}
```

---

## 11. Conformité Réglementaire

### Secret Professionnel Avocat

- **Isolation stricte** : Données client X invisibles pour client Y
- **Accès restreint** : Seul l'avocat et son client voient le dossier
- **Chiffrement** : Documents sensibles chiffrés at-rest
- **Audit trail** : Qui a accédé à quoi, quand

### Conservation des Données

| Type | Durée | Justification |
|------|-------|---------------|
| Dossiers terminés | 5 ans | Obligation légale avocat |
| Factures | 10 ans | Obligation comptable |
| Logs d'audit | 5 ans | Traçabilité RGPD |
| Documents clients | Selon accord | Consentement client |

### Localisation Géographique

- **Serveurs UE obligatoire** : Pour données sensibles avocats
- **Backup UE** : Réplication sur serveurs français/allemands
- **Pas de transfert hors UE** : Sauf consentement explicite

---

## 12. Accessibilité & Inclusivité

### Standards WCAG 2.1

**Niveau cible : AA**

- ✅ Contraste couleurs : Ratio min 4.5:1
- ✅ Navigation clavier : Tab, Enter, Esc
- ✅ ARIA labels : Sur tous les boutons/inputs
- ✅ Focus visible : Outline bleu sur focus
- ✅ Texte redimensionnable : Jusqu'à 200% sans perte

### Responsive Design

- **Mobile** : 320px - 768px
- **Tablet** : 768px - 1024px
- **Desktop** : 1024px+

**Breakpoints Tailwind** :
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet portrait */
lg: 1024px  /* Tablet landscape / Desktop */
xl: 1280px  /* Desktop large */
```

### Dark Mode

- ✅ Toggle automatique selon préférence système
- ✅ Persistance localStorage
- ✅ Classes Tailwind `dark:` sur tous composants

---

## 13. Expérience Utilisateur (UX)

### Personas

**1. Marie - Avocate (ADMIN)**
- 42 ans, cabinet de 3 avocats
- Gère 50+ clients simultanément
- Besoin : Vue centralisée, gain de temps, automatisation

**2. Pierre - Client (CLIENT)**
- 35 ans, victime colis perdu La Poste
- Première expérience juridique
- Besoin : Simplicité, transparence, suivi en temps réel

### User Flows

**Flow Avocat - Traitement dossier** :
1. Login → Dashboard
2. Alerte "3 dossiers non traités"
3. Clic sur dossier client
4. Voir documents uploadés par client
5. Lancer analyse IA
6. Générer courrier
7. Marquer "Terminé"

**Flow Client - Nouveau dossier** :
1. Login → Portail client
2. "Mes dossiers" → Liste vide
3. Attendre que l'avocat crée le dossier
4. Notification email "Nouveau dossier créé"
5. Login → Voir dossier "Action requise"
6. Upload documents + remplir formulaire
7. Validation → Statut "En cours"

### Principes UX

- **Progressive disclosure** : Afficher info au moment pertinent
- **Feedback immédiat** : Toast notifications sur actions
- **Undo possible** : Annuler suppression dans 30s
- **Consistency** : Même pattern boutons/modals partout
- **Performance** : <2s chargement page, skeleton loaders

---

## 14. Interface Utilisateur (UI)

### Design System

**Couleurs** :
```css
Primary (Blue): #3B82F6
Success (Green): #10B981
Warning (Orange): #F59E0B
Danger (Red): #EF4444
Gray: #6B7280
```

**Typography** :
```css
Font: Inter (Google Fonts)
Headings: font-bold
Body: font-normal
Labels: font-medium text-sm
```

**Spacing** :
```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
(Tailwind scale: p-1, p-2, p-3, p-4, p-6, p-8, p-12, p-16)
```

### Composants Réutilisables

- **Button** : Primary, Secondary, Danger, Ghost
- **Input** : Text, Email, Password, File upload
- **Modal** : Confirmation, Form, Info
- **Card** : Stat card, Client card, Dossier card
- **Badge** : Status, Role, Priority
- **Dropdown** : Filters, Actions
- **Sidebar** : Navigation fixe avec collapse mobile
- **Table** : Dossiers, Clients avec pagination

### Navigation

**Sidebar Avocat** :
```
📊 Dashboard
👥 Clients
📁 Dossiers
💰 Factures
⚙️ Paramètres
```

**Topbar Client** :
```
🏠 Mes dossiers
📄 Documents
💬 Messages
👤 Mon profil
```

---

## 15. Logique Métier

### Workflow Dossier

```
EN_ATTENTE (20%)
    ↓ Client upload documents
DOCUMENTS_REQUIS (30%)
    ↓ Avocat valide complétude
EN_COURS (40-65%)
    ↓ Analyse IA + génération courrier
ANALYSE_IA (80%)
    ↓ Avocat valide et envoie
TERMINE (100%)
    ↓ Archivage après 5 ans
ARCHIVE
```

### Calcul Progression

```typescript
function calculateProgression(dossier: Dossier): number {
  const hasDocuments = dossier.documents.length > 0;
  const hasDescription = dossier.description?.length > 50;
  const clientDataComplete = hasDocuments && hasDescription;
  
  switch (dossier.statut) {
    case 'EN_ATTENTE':
      return 20;
    case 'DOCUMENTS_REQUIS':
      return 30;
    case 'EN_COURS':
      return clientDataComplete ? 65 : 40;
    case 'ANALYSE_IA':
      return 80;
    case 'TERMINE':
      return 100;
    default:
      return 0;
  }
}
```

### Calcul Priorité

```typescript
function calculatePriority(dossier: Dossier): 'basse' | 'moyenne' | 'haute' {
  const daysSinceCreation = daysBetween(dossier.createdAt, new Date());
  
  if (daysSinceCreation > 14) return 'haute';
  if (daysSinceCreation > 7) return 'moyenne';
  return 'basse';
}
```

### Règles Métier

1. **Un dossier appartient à 1 seul client**
2. **Un client peut avoir N dossiers**
3. **Seul ADMIN peut créer/modifier dossiers**
4. **CLIENT peut uniquement upload documents et modifier description**
5. **Changement statut = log d'audit automatique**
6. **Suppression dossier = soft delete (archivage)**

---

## 16. API & Intégrations

### API Routes Structure

```
/api
  /auth
    /[...nextauth]         # NextAuth endpoints
    /signin                # Custom login
    /signout               # Logout
  /tenant/[tenantId]
    /clients
      /with-stats          # GET clients avec métriques
      /[clientId]
        /dossiers          # GET dossiers d'un client
    /dossiers
      /all                 # GET tous dossiers tenant
      /[id]                # GET/PUT/DELETE dossier
    /dashboard
      /stats               # GET statistiques globales
  /client
    /my-dossiers           # GET dossiers du client connecté
    /dossiers/[id]
      /documents           # POST upload document
      /update              # PUT update description
  /admin
    /clients               # CRUD clients
    /dossiers              # CRUD dossiers
  /super-admin
    /tenants               # CRUD tenants
```

### Intégrations Externes

**Gmail API** :
```typescript
// Monitoring emails La Poste
const gmailService = new GmailService(credentials);
const emails = await gmailService.listUnread({
  from: 'laposte.fr',
  hasAttachment: true
});
```

**OpenAI API** :
```typescript
// Analyse document
const aiService = new AIService(apiKey);
const analysis = await aiService.analyzeDocument({
  content: documentText,
  type: 'reclamation'
});
```

**Future** :
- Stripe API (paiements)
- Twilio (SMS notifications)
- DocuSign (signatures électroniques)

### Format Réponses API

```typescript
// Success
{
  success: true,
  data: { ... },
  message: "Dossier créé avec succès"
}

// Error
{
  success: false,
  error: "Validation failed",
  details: { field: "email", message: "Invalid format" }
}
```

---

## 17. Tests & Assurance Qualité

### Stratégie de Tests

**Pyramide de tests** :
```
     /\
    /  \  E2E (10%)
   /____\
  /      \ Integration (30%)
 /________\
/__________\ Unit (60%)
```

### Tests Unitaires (Jest)

```typescript
// hooks/useAuth.test.tsx
describe('useAuth', () => {
  it('should return isAdmin=true for ADMIN role', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAdmin).toBe(true);
  });
});

// components/Button.test.tsx
describe('Button', () => {
  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Tests d'Intégration

```typescript
// API route tests
describe('GET /api/tenant/[id]/clients/with-stats', () => {
  it('should return 403 if user not ADMIN', async () => {
    const res = await fetch('/api/tenant/123/clients/with-stats', {
      headers: { cookie: clientSessionCookie }
    });
    expect(res.status).toBe(403);
  });
  
  it('should return clients with calculated stats', async () => {
    const res = await fetch('/api/tenant/123/clients/with-stats', {
      headers: { cookie: adminSessionCookie }
    });
    const data = await res.json();
    expect(data.clients[0]).toHaveProperty('activeDossiers');
    expect(data.clients[0]).toHaveProperty('successRate');
  });
});
```

### Tests E2E (Playwright - Future)

```typescript
test('Lawyer can view untreated dossiers', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name=email]', 'avocat@test.fr');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=3 Dossiers nécessitent votre attention')).toBeVisible();
  
  await page.click('text=Afficher uniquement les non traités');
  await expect(page.locator('table tbody tr')).toHaveCount(3);
});
```

### Couverture Cible

- Unit tests : >70%
- Integration tests : >50%
- Critical paths E2E : 100%

---

## 18. Déploiement & Environnements

### Environnements

| Env | URL | Database | Usage |
|-----|-----|----------|-------|
| **Local** | localhost:3000 | SQLite | Développement |
| **Staging** | staging.iaposte.app | PostgreSQL | Tests pré-prod |
| **Production** | app.iaposte.fr | PostgreSQL | Clients réels |

### Pipeline CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: vercel/actions@v2
        with:
          token: ${{ secrets.VERCEL_TOKEN }}
          environment: production
```

### Variables d'Environnement

```bash
# .env.production
DATABASE_URL="postgresql://user:pass@host:5432/iaposte"
NEXTAUTH_SECRET="xxx"
NEXTAUTH_URL="https://app.iaposte.fr"
OPENAI_API_KEY="sk-xxx"
GMAIL_CLIENT_ID="xxx.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="xxx"
```

### Migrations Database

```bash
# Développement
npx prisma migrate dev --name add_metrics

# Production
npx prisma migrate deploy
```

---

## 19. Supervision & Monitoring

### Métriques Applicatives

**Dashboard Métriques** :
- Taux de traitement : % dossiers complétés
- Temps de réponse moyen : heures
- Temps de traitement moyen : jours
- Taux de succès : % dossiers gagnés
- Chiffre d'affaires mensuel : €
- Clients actifs : count
- Validations en attente : count
- Dossiers en retard : count

### Monitoring Technique

**Outils** :
- **Vercel Analytics** : Performance web vitals
- **Sentry** (future) : Error tracking
- **LogTail** (future) : Logs centralisés
- **Uptime Robot** : Disponibilité

**Alertes** :
- Temps réponse >3s : Email équipe tech
- Taux erreur >5% : Slack notification
- DB connexion failed : PagerDuty
- Disk usage >80% : Email admin

### Health Check

```typescript
// /api/health
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    }, { status: 503 });
  }
}
```

---

## 20. Journalisation & Audit

### Logs Applicatifs (Winston)

```typescript
import { logger } from '@/lib/logger';

// Niveaux: error, warn, info, debug
logger.info('User logged in', { userId, email, ip });
logger.error('Database connection failed', { error });
logger.warn('Rate limit exceeded', { userId, endpoint });
```

### Audit Trail

```typescript
// Chaque action sensible = log
interface AuditLog {
  id: string;
  userId: string;
  tenantId: string;
  action: AuditAction; // CREATE_DOSSIER, UPDATE_CLIENT, DELETE_DOCUMENT
  resourceType: 'DOSSIER' | 'CLIENT' | 'DOCUMENT';
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Conservation: 5 ans minimum
```

### Logs Formats

```json
{
  "level": "info",
  "message": "Dossier created",
  "timestamp": "2026-01-06T10:30:00.000Z",
  "userId": "cuid123",
  "tenantId": "tenant456",
  "dossierId": "dossier789",
  "metadata": {
    "type": "RECLAMATION",
    "clientId": "client999"
  }
}
```

---

## 21. Sauvegarde & Reprise d'Activité

### Stratégie de Backup

**Database** :
- Backup automatique quotidien (3h du matin)
- Rétention : 30 jours
- Test de restauration : mensuel
- Stockage : S3 / Vercel Postgres Backup

**Documents** :
- Upload = copie immédiate sur S3
- Versioning activé
- Lifecycle policy : Archive Glacier après 1 an

**Code** :
- Git repository : GitHub
- Branches protégées : main, staging
- Tags de release pour rollback

### RTO & RPO

- **RTO** (Recovery Time Objective) : <4h
- **RPO** (Recovery Point Objective) : <1h (données max perdues)

### Plan de Continuité

1. **Incident détecté** : Monitoring alerte équipe
2. **Basculement** : Deploy version stable précédente
3. **Communication** : Status page + email clients
4. **Investigation** : Logs + Sentry
5. **Fix** : Hotfix + deploy
6. **Post-mortem** : Document incident

---

## 22. Performance & Scalabilité

### Optimisations Actuelles

**Frontend** :
- ✅ Code splitting (Next.js automatique)
- ✅ Image optimization (next/image)
- ✅ Lazy loading composants lourds
- ✅ Memoization (React.memo, useMemo)

**Backend** :
- ✅ Index DB sur tenantId, clientId, statut
- ✅ Pagination (limit 100 dossiers)
- ✅ Promise.all pour requêtes parallèles
- ✅ Cache session NextAuth

**Database** :
- ✅ Connection pooling (Prisma)
- ✅ Query optimization (select only needed fields)
- ✅ Soft delete (pas de vraie suppression)

### Scalabilité Cible

| Métrique | Actuel | Cible 6 mois | Cible 1 an |
|----------|--------|--------------|------------|
| Tenants | 5 | 50 | 200 |
| Users | 20 | 500 | 2000 |
| Dossiers | 100 | 10,000 | 50,000 |
| Requêtes/min | 10 | 1000 | 5000 |
| DB size | 100MB | 5GB | 20GB |

### Stratégies Futures

- **Caching** : Redis pour sessions et requêtes fréquentes
- **CDN** : Cloudflare pour assets statiques
- **Read replicas** : PostgreSQL réplication pour lectures
- **Sharding** : Si >1M dossiers, séparer par région géographique

---

## 23. Gestion des Coûts

### Coûts Actuels (Dev)

| Service | Plan | Coût/mois |
|---------|------|-----------|
| Vercel | Hobby | 0€ |
| Database | SQLite local | 0€ |
| Gmail API | Free tier | 0€ |
| OpenAI API | Pay-as-go | ~20€ |
| **TOTAL** | | **~20€** |

### Coûts Prévus (Production 100 users)

| Service | Plan | Coût/mois |
|---------|------|-----------|
| Vercel | Pro | 20€ |
| PostgreSQL | Railway Starter | 5€ |
| OpenAI API | Usage | ~100€ |
| Gmail API | Free (1B calls) | 0€ |
| S3 Storage | 10GB | 0.25€ |
| Sentry | Team | 26€ |
| **TOTAL** | | **~151€** |

### Modèle Tarifaire SaaS

- **Starter** : 49€/mois (1 avocat, 20 clients max)
- **Pro** : 99€/mois (3 avocats, 100 clients)
- **Enterprise** : 249€/mois (illimité)

**Break-even** : 3 clients Pro = 297€ > 151€ coûts ✅

---

## 24. Maintenance & Support

### Maintenance Préventive

- **Weekly** : Review logs erreurs
- **Monthly** : Update dépendances (npm audit)
- **Quarterly** : Test backup restore
- **Yearly** : Audit sécurité externe

### Support Utilisateurs

**Canaux** :
- Email : support@iaposte.fr (réponse <24h)
- Live chat : Intercom (future)
- Documentation : docs.iaposte.fr
- Ticket system : Linear (interne)

**SLA** :
- Critique (app down) : <2h
- Haute (feature cassée) : <4h
- Moyenne (bug mineur) : <24h
- Basse (question) : <48h

---

## 25. Documentation Technique

### Docs Existantes

- ✅ `README.md` : Setup projet
- ✅ `GMAIL_API_SETUP.md` : Config Gmail
- ✅ `docs/SECURITE_CONFORMITE.md` : Sécurité
- ✅ `docs/DPIA.md` : RGPD
- ✅ `prisma/schema.prisma` : Modèle données

### Docs à Créer

- [ ] API Reference (Swagger/OpenAPI)
- [ ] Architecture Diagrams (C4 Model)
- [ ] Runbook (procédures incidents)
- [ ] Onboarding dev (nouveau dev setup)

---

## 26. Documentation Utilisateur

### Guides Utilisateur

**Pour Avocats** :
- [ ] Guide démarrage rapide
- [ ] Créer un client
- [ ] Traiter un dossier
- [ ] Utiliser l'IA
- [ ] Générer des rapports

**Pour Clients** :
- [ ] Premier login
- [ ] Consulter mes dossiers
- [ ] Uploader des documents
- [ ] Contacter mon avocat

### Vidéos Tutoriels (Future)

- [ ] Tour complet dashboard avocat (5min)
- [ ] Comment créer un dossier (2min)
- [ ] Client : uploader documents (2min)

---

## 27. Gouvernance du Projet

### Équipe

- **Product Owner** : Définit roadmap, priorise features
- **Tech Lead** : Architecture, code review, décisions techniques
- **Développeur Full-stack** : Implémentation features
- **Designer UI/UX** : Maquettes, design system

### Process Développement

1. **Feature request** : Issue GitHub
2. **Spec** : Product Owner valide
3. **Design** : Maquettes Figma (si UI)
4. **Dev** : Branch feature/xxx
5. **Review** : Pull request + tests
6. **QA** : Test staging
7. **Deploy** : Merge main → prod

### Réunions

- **Daily standup** : 15min, blockers
- **Sprint planning** : Bi-weekly, définir sprint
- **Sprint review** : Démo features
- **Retrospective** : Amélioration continue

---

## 28. Gestion des Risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Fuite données client** | Faible | Critique | Chiffrement, audit logs, tests sécu |
| **Panne DB prod** | Moyenne | Haute | Backup auto, monitoring, replica |
| **Dépendance OpenAI** | Moyenne | Moyenne | Fallback manuel, cache résultats |
| **Non-conformité RGPD** | Faible | Critique | Audit externe, DPO conseil |
| **Surcharge serveur** | Moyenne | Moyenne | Auto-scaling, rate limiting |
| **Bug critique prod** | Moyenne | Haute | Tests auto, rollback facile |

---

## 29. Continuité & Pérennité

### Licences Open Source

- Next.js : MIT
- Prisma : Apache 2.0
- React : MIT
- Tailwind : MIT

**Risques** : Abandon projet = fork possible ✅

### Vendor Lock-in

**Risques modérés** :
- Vercel : Migration possible vers Netlify/AWS
- PostgreSQL : Standard, portable
- NextAuth : Code open-source

**Recommandations** :
- Éviter features propriétaires Vercel
- Abstraire appels externes (services/)
- DB migrations versionnées Git

---

## 30. Évolution & Roadmap

### Q1 2026
- ✅ MVP Dashboard avocat
- ✅ Gestion dossiers multi-client
- ✅ Widgets métriques
- 🚧 Portail client
- 🚧 Analyse IA documents
- 🚧 Monitoring Gmail

### Q2 2026
- Templates documents par type litige
- Workflow validation multi-étapes
- Notifications push temps réel
- Export PDF rapports
- API publique intégrations

### Q3 2026
- Mobile app React Native
- Signature électronique DocuSign
- Intégration comptable
- Chat temps réel avocat-client
- Marketplace templates

### Q4 2026
- IA générative réponses automatiques
- Analyse prédictive succès dossier
- Intégration tribunal (API RPVA)
- White-label pour grands cabinets
- Expansion EU (multi-langue)

---

## 📊 Métriques de Succès

| KPI | Actuel | Cible 6 mois |
|-----|--------|--------------|
| Tenants actifs | 2 | 30 |
| Dossiers traités/mois | 10 | 500 |
| Temps traitement moyen | 12j | 5j |
| Satisfaction client | 4.2/5 | 4.7/5 |
| Uptime | 98% | 99.9% |
| Churn rate | N/A | <5% |

---

**Version** : 1.0  
**Dernière mise à jour** : 6 janvier 2026  
**Auteur** : Équipe iaPostemanage  
**Contact** : tech@iaposte.fr
