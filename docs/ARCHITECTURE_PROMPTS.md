# 🤖 PROMPTS ARCHITECTURE - iaPostemanage

> Collection de prompts pour générer automatiquement le code et l'architecture du projet

**Comment utiliser** : Copiez le prompt correspondant à la section que vous voulez générer et collez-le dans votre IA (GitHub Copilot, Cursor, ChatGPT, Claude, etc.)

---

## 1. Vision & Objectifs

```
Génère un document de vision produit pour un SaaS de gestion juridique multi-tenant destiné aux avocats.

Inclure :
- Vision à 3 ans
- Objectifs SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- KPIs principaux (taux traitement, temps réponse, satisfaction client, revenus)
- USP (Unique Selling Propositions) vs concurrence
- Personas cibles (avocat, client)

Format : Markdown avec sections claires
```

---

## 2. Analyse du Besoin

```
Génère une analyse complète du besoin pour une plateforme SaaS de gestion de dossiers juridiques.

Contexte :
- Avocats gérant 50-100 clients simultanément
- Processus manuel chronophage (emails, documents, factures)
- Besoin de centralisation et automatisation

Inclure :
- Problématiques identifiées (5 minimum)
- Pain points utilisateurs
- Solutions attendues
- Critères de succès
- Contraintes métier

Format : Liste structurée avec priorités
```

---

## 3. Périmètre Fonctionnel

```
Définis le périmètre fonctionnel d'un MVP pour un SaaS juridique multi-tenant.

Features MVP (must-have) :
- Authentification multi-rôles (ADMIN, CLIENT, SUPER_ADMIN)
- Gestion tenants (cabinets d'avocats)
- CRUD Clients et Dossiers
- Upload documents
- Dashboard avec métriques

Features Phase 2 (should-have) :
- Analyse IA documents
- Templates courriers
- Notifications temps réel

Features Phase 3 (nice-to-have) :
- Mobile app
- Signature électronique
- Marketplace

Format : Roadmap avec timeline Q1-Q4 2026
```

---

## 4. Contraintes & Hypothèses

```
Liste toutes les contraintes techniques, budgétaires et réglementaires pour un SaaS juridique en France.

Contraintes :
- Stack : Next.js 14+, Prisma, PostgreSQL
- Budget serveur : <200€/mois pour 100 users
- Hébergement : Vercel/Railway
- Conformité RGPD obligatoire
- Secret professionnel avocat

Hypothèses :
- Connexion internet stable
- Avocats formés outils numériques
- Documents en PDF/images

Format : Tableau avec colonnes (Contrainte, Type, Impact, Mitigation)
```

---

## 5. Architecture Générale

```
Génère l'architecture complète d'une application SaaS multi-tenant Next.js.

Stack :
- Frontend : Next.js 16 App Router, TypeScript, Tailwind
- Backend : Next.js API routes
- Database : Prisma ORM + PostgreSQL
- Auth : NextAuth v5

Exigences :
- Architecture 3-tiers (Présentation, Logique, Données)
- Multi-tenant avec isolation par tenantId
- Scalabilité horizontale
- Sécurité zero-trust

Générer :
1. Diagramme architecture (format Mermaid)
2. Description flux de données
3. Patterns utilisés (Repository, Service, Middleware)

Format : Markdown + diagrammes Mermaid
```

---

## 6. Choix Technologiques

```
Justifie les choix technologiques pour un SaaS Next.js TypeScript.

Technologies :
- Next.js 16.1.1 (vs Remix, SvelteKit)
- Prisma (vs TypeORM, Drizzle)
- NextAuth (vs Auth0, Clerk)
- Tailwind CSS (vs MUI, Chakra)
- Jest (vs Vitest)

Pour chaque choix, inclure :
- Avantages / Inconvénients
- Alternatives considérées
- Raison du choix
- Risques potentiels

Format : Tableau comparatif
```

---

## 7. Modélisation des Données

```
Génère le schéma Prisma complet pour un SaaS de gestion juridique multi-tenant.

Entités :
- User (id, email, name, password, role, tenantId)
- Tenant (id, nom, plan, createdAt)
- Client (hérite de User avec role=CLIENT)
- Dossier (id, numero, titre, type, statut, clientId, tenantId, documents)
- Document (id, nom, type, url, taille, dossierId)

Relations :
- User → Tenant (Many-to-One)
- User → Dossier (One-to-Many)
- Dossier → Document (One-to-Many)

Enums :
- Role : SUPER_ADMIN, ADMIN, CLIENT
- Plan : STARTER, PRO, ENTERPRISE
- Statut : EN_ATTENTE, DOCUMENTS_REQUIS, EN_COURS, ANALYSE_IA, TERMINE

Inclure :
- Index de performance (tenantId, clientId, statut)
- Contraintes (unique, foreign keys)
- Timestamps (createdAt, updatedAt)

Format : Fichier prisma/schema.prisma complet
```

---

## 8. Gestion des Utilisateurs & Rôles

```
Implémente un système RBAC (Role-Based Access Control) pour Next.js avec NextAuth.

Rôles :
- SUPER_ADMIN : Gérer tous tenants, accès global
- ADMIN : Gérer clients/dossiers de son tenant
- CLIENT : Voir ses dossiers, uploader documents

Générer :
1. Type TypeScript pour Role
2. Matrice permissions (tableau Role x Action)
3. Hook useAuth() avec isAdmin, isClient, hasPermission()
4. Middleware de protection routes
5. API route guard avec vérification tenantId

Technologies : NextAuth v5, TypeScript

Format : Code TypeScript commenté
```

---

## 9. Sécurité & Gestion des Accès

```
Implémente les mécanismes de sécurité pour une application Next.js multi-tenant.

Exigences :
- Authentification session-based (NextAuth)
- Password hashing (bcrypt)
- Protection CSRF
- Validation tenantId sur chaque requête API
- Rate limiting (100 req/min par IP)
- XSS protection
- SQL injection prevention (Prisma)

Générer :
1. Middleware security headers
2. API route avec vérification session + tenantId
3. Fonction validateTenantAccess()
4. Rate limiter avec Map ou Redis
5. Input validation avec Zod

Format : Code TypeScript Next.js 14+
```

---

## 10. Protection des Données & Vie Privée

```
Implémente la conformité RGPD pour un SaaS juridique français.

Features RGPD :
- Consentement tracking (date, IP, type)
- Export données utilisateur (JSON)
- Droit à l'oubli (anonymisation)
- Portabilité (CSV/JSON)
- Logs accès données sensibles

Générer :
1. Table Consent dans Prisma
2. API route /api/user/export-data
3. Fonction anonymizeUser(userId)
4. Page consentement UI avec checkboxes
5. Audit log service

Technologies : Prisma, Next.js API routes

Format : Code complet avec commentaires RGPD
```

---

## 11. Conformité Réglementaire

```
Documente les exigences de conformité pour un SaaS juridique français.

Réglementations :
- RGPD (protection données)
- Secret professionnel avocat (article 66-5 loi 1971)
- Conservation légale (5 ans dossiers, 10 ans factures)
- Localisation données UE

Générer :
1. Checklist conformité (format markdown)
2. Durées de conservation par type de donnée
3. Process d'audit trimestriel
4. Template DPA (Data Processing Agreement)
5. Registre des traitements RGPD

Format : Markdown + templates
```

---

## 12. Accessibilité & Inclusivité

```
Rends une application Next.js conforme WCAG 2.1 niveau AA.

Composants à auditer :
- Navigation sidebar
- Formulaires (login, création dossier)
- Tableaux (liste dossiers)
- Modals
- Boutons

Générer :
1. Checklist WCAG 2.1 AA
2. ARIA labels sur tous inputs
3. Focus management (trap modal, restore)
4. Contraste couleurs (ratio 4.5:1 minimum)
5. Navigation clavier (Tab, Enter, Esc)
6. Tests avec screen reader (exemple NVDA)

Format : Code React + JSX commenté
```

---

## 13. Expérience Utilisateur (UX)

```
Conçois l'UX complète pour un dashboard avocat multi-client.

Features :
- Vue globale : stats (totalClients, dossiersActifs, pendingActions)
- Liste clients avec recherche et filtres
- Détails client : mini stats + dossiers
- Table tous dossiers avec progression
- Alertes visuelles (dossiers non traités)

Principes UX :
- Progressive disclosure
- Feedback immédiat (toasts)
- Skeleton loaders
- Actions rapides (shortcuts)

Générer :
1. User flow avocat (diagramme Mermaid)
2. Wireframes ASCII art
3. Micro-interactions (hover, click, load)
4. Error states & messages
5. Empty states & onboarding

Format : Markdown + diagrammes
```

---

## 14. Interface Utilisateur (UI)

```
Génère un design system complet pour une application SaaS juridique.

Inclure :
- Palette couleurs (Primary Blue, Success Green, Warning Orange, Danger Red)
- Typographie (Google Fonts, scales, weights)
- Spacing system (4px, 8px, 16px, 24px, 32px, 48px)
- Composants (Button, Input, Modal, Card, Badge, Table)
- Dark mode variants
- Responsive breakpoints (sm, md, lg, xl)

Technologies : Tailwind CSS 3.x

Générer :
1. tailwind.config.js avec theme extend
2. Composants React réutilisables
3. Storybook stories (optionnel)
4. CSS variables pour dark mode

Format : Code JavaScript + React + TypeScript
```

---

## 15. Logique Métier

```
Implémente la logique métier pour un système de dossiers juridiques.

Workflow :
EN_ATTENTE (20%) → DOCUMENTS_REQUIS (30%) → EN_COURS (40-65%) → ANALYSE_IA (80%) → TERMINE (100%)

Règles :
- Progression = f(statut, clientDataComplete)
- Priorité = f(age dossier) : >14j = haute, >7j = moyenne, else basse
- clientDataComplete = hasDocuments && hasDescription
- Changement statut = audit log

Générer :
1. Fonction calculateProgression(dossier): number
2. Fonction calculatePriority(dossier): Priority
3. Fonction updateDossierStatus(id, newStatus)
4. Tests unitaires (Jest)
5. Type guards TypeScript

Format : Code TypeScript + tests
```

---

## 16. API & Intégrations

```
Génère les API routes Next.js pour un SaaS multi-tenant.

Routes :
- GET /api/tenant/[id]/clients/with-stats
- GET /api/tenant/[id]/dossiers/all
- POST /api/tenant/[id]/dossiers
- PUT /api/tenant/[id]/dossiers/[dossierId]
- DELETE /api/tenant/[id]/dossiers/[dossierId]

Sécurité :
- Vérifier session NextAuth
- Vérifier user.tenantId === params.id
- Vérifier rôle ADMIN pour mutations

Response format :
{ success: boolean, data?: any, error?: string }

Générer :
1. API routes avec TypeScript
2. Error handling (try/catch)
3. Validation Zod schemas
4. Tests API (supertest)

Format : Fichiers route.ts Next.js App Router
```

---

## 17. Tests & Assurance Qualité

```
Génère une stratégie de tests complète pour Next.js + Prisma.

Niveaux :
- Unit (60%) : Hooks, composants, utils
- Integration (30%) : API routes, DB queries
- E2E (10%) : User flows critiques

Technologies :
- Jest + React Testing Library (unit)
- Supertest (API)
- Playwright (E2E)

Générer :
1. Configuration Jest (jest.config.js)
2. Tests composants (Button, Form)
3. Tests hooks (useAuth, useDossiers)
4. Tests API routes
5. Test E2E login → dashboard
6. Coverage report setup

Format : Code tests + config files
```

---

## 18. Déploiement & Environnements

```
Configure les environnements et le déploiement pour Next.js sur Vercel.

Environnements :
- Local (localhost:3000, SQLite)
- Staging (staging.iaposte.app, PostgreSQL)
- Production (app.iaposte.fr, PostgreSQL)

CI/CD :
- GitHub Actions
- Tests automatiques
- Deploy Vercel on merge main

Générer :
1. Fichiers .env.local, .env.staging, .env.production
2. GitHub Actions workflow (.github/workflows/deploy.yml)
3. vercel.json configuration
4. Script migration DB
5. Healthcheck endpoint /api/health

Format : YAML + JSON + Shell scripts
```

---

## 19. Supervision & Monitoring

```
Implémente le monitoring pour Next.js en production.

Métriques :
- Performance (Web Vitals : LCP, FID, CLS)
- Erreurs (rate, types, stack traces)
- Business (taux traitement, temps réponse moyen)
- Infrastructure (uptime, latency, DB queries)

Outils :
- Vercel Analytics (performance)
- Sentry (errors)
- Custom dashboard métriques (React)

Générer :
1. Integration Vercel Analytics
2. Sentry setup (sentry.client.config.ts)
3. Composant MetricsWidgets avec KPIs
4. API /api/metrics (stats temps réel)
5. Alertes email si error rate >5%

Format : Code TypeScript + config
```

---

## 20. Journalisation & Audit

```
Implémente un système de logs et audit trail pour Next.js.

Exigences :
- Logs structurés (JSON)
- Niveaux : error, warn, info, debug
- Audit trail (qui a fait quoi, quand)
- Rétention 5 ans
- Recherche et filtrage

Technologies :
- Winston (logging)
- Prisma (audit table)
- LogTail ou Datadog (centralization)

Générer :
1. Configuration Winston (lib/logger.ts)
2. Modèle AuditLog Prisma
3. Middleware logging requêtes
4. Service auditLog(action, userId, resourceId)
5. API /api/admin/audit-logs (lecture)

Format : Code TypeScript + Prisma schema
```

---

## 21. Sauvegarde & Reprise d'Activité

```
Documente la stratégie de backup et disaster recovery pour un SaaS.

Exigences :
- Backup DB quotidien (3h du matin)
- Rétention 30 jours
- Test restauration mensuel
- RTO <4h, RPO <1h

Générer :
1. Script backup PostgreSQL (cron job)
2. Script restore DB
3. Plan de continuité (runbook)
4. Checklist disaster recovery
5. Tests de restauration automatisés

Format : Shell scripts + markdown runbook
```

---

## 22. Performance & Scalabilité

```
Optimise les performances d'une application Next.js multi-tenant.

Problèmes :
- Temps chargement page >3s
- Requêtes DB N+1
- Images non optimisées
- Pas de caching

Solutions :
- Code splitting (Next.js auto)
- DB indexes (tenantId, clientId)
- Pagination (limit 100)
- Promise.all (requêtes parallèles)
- Redis caching (sessions, stats)

Générer :
1. Prisma queries optimisées (select, include)
2. API route avec caching Redis
3. React.memo sur composants lourds
4. next/image pour images
5. Load testing script (k6)

Format : Code TypeScript + benchmark results
```

---

## 23. Gestion des Coûts

```
Calcule et optimise les coûts d'infrastructure pour un SaaS.

Stack :
- Vercel Pro : 20€/mois
- PostgreSQL (Railway) : 5€/mois
- OpenAI API : ~100€/mois (usage)
- S3 Storage : 10GB = 0.25€/mois
- Sentry : 26€/mois

Total : ~151€/mois pour 100 users

Modèle tarifaire :
- Starter : 49€/mois (1 avocat, 20 clients)
- Pro : 99€/mois (3 avocats, 100 clients)
- Enterprise : 249€/mois (illimité)

Générer :
1. Tableau coûts par service
2. Break-even analysis
3. ROI par plan
4. Optimisations possibles (reduce OpenAI calls)
5. Alertes budget dépassé

Format : Excel/Google Sheets ou markdown tables
```

---

## 24. Maintenance & Support

```
Documente le processus de maintenance et support pour un SaaS.

Tâches :
- Hebdo : Review logs erreurs
- Mensuel : Update dépendances (npm audit)
- Trimestriel : Test backup restore
- Annuel : Audit sécurité externe

Support :
- Email : support@iaposte.fr (<24h)
- Live chat : Intercom (future)
- Docs : docs.iaposte.fr
- Tickets : Linear

SLA :
- Critique (app down) : <2h
- Haute : <4h
- Moyenne : <24h
- Basse : <48h

Générer :
1. Calendrier maintenance
2. Checklist update dépendances
3. Template réponse support
4. Escalation process
5. SLA dashboard

Format : Markdown + calendrier
```

---

## 25. Documentation Technique

```
Génère la documentation technique complète pour Next.js + Prisma.

Sections :
- Architecture overview
- Setup local (prerequisites, install, run)
- Database schema
- API Reference (endpoints, params, responses)
- Authentication flow
- Environment variables
- Deployment

Format :
- README.md principal
- /docs folder avec sous-pages
- Diagrammes Mermaid
- Code examples

Technologies :
- Markdown
- Docusaurus ou VitePress (optionnel)
- Swagger/OpenAPI pour API

Générer :
1. README.md structure
2. API.md avec tous endpoints
3. ARCHITECTURE.md avec diagrammes
4. DEPLOYMENT.md step-by-step

Format : Markdown files
```

---

## 26. Documentation Utilisateur

```
Crée la documentation utilisateur pour un SaaS juridique.

Guides :
- Avocat : Démarrage rapide, Créer client, Traiter dossier, Utiliser IA
- Client : Premier login, Uploader documents, Suivre dossier

Features :
- Screenshots annotés
- Step-by-step tutorials
- Vidéos courtes (2-5min)
- FAQ (10 questions courantes)

Générer :
1. Guide avocat (markdown)
2. Guide client (markdown)
3. FAQ (Q&A format)
4. Scripts vidéos tutoriels
5. Tooltips in-app (React components)

Format : Markdown + React components
```

---

## 27. Gouvernance du Projet

```
Définis la gouvernance pour un projet SaaS en équipe.

Équipe :
- Product Owner (roadmap, priorisation)
- Tech Lead (architecture, code review)
- Dev Full-stack (features)
- Designer UI/UX (maquettes)

Process :
1. Feature request → Issue GitHub
2. Spec → Product Owner validation
3. Design → Maquettes Figma
4. Dev → Branch feature/xxx
5. Review → Pull request + tests
6. QA → Test staging
7. Deploy → Merge main → prod

Réunions :
- Daily standup : 15min
- Sprint planning : Bi-weekly
- Sprint review : Démo features
- Retrospective : Amélioration

Générer :
1. CONTRIBUTING.md
2. PR template
3. Issue templates (bug, feature)
4. Definition of Done
5. Code review checklist

Format : Markdown templates GitHub
```

---

## 28. Gestion des Risques

```
Identifie et mitige les risques pour un SaaS juridique.

Risques :
- Fuite données client (Probabilité: Faible, Impact: Critique)
- Panne DB prod (Moyenne, Haute)
- Dépendance OpenAI (Moyenne, Moyenne)
- Non-conformité RGPD (Faible, Critique)

Mitigation :
- Chiffrement, audit logs, tests sécu
- Backup auto, monitoring, replica
- Fallback manuel, cache résultats
- Audit externe, DPO conseil

Générer :
1. Registre des risques (tableau)
2. Plan mitigation par risque
3. Plan contingence (si risque se réalise)
4. Process review mensuel
5. Assurance cyber recommandations

Format : Markdown table + runbooks
```

---

## 29. Continuité & Pérennité

```
Assure la pérennité technique d'un SaaS sur 5+ ans.

Risques :
- Abandon Next.js/Prisma (faible)
- Vendor lock-in Vercel (moyen)
- Équipe réduite (bus factor = 1)

Solutions :
- Technologies open-source MIT/Apache
- Abstraction couche déploiement
- Documentation exhaustive
- Code escrow pour clients enterprise
- Formation équipe (au moins 2 devs compétents)

Générer :
1. Analyse dépendances (licenses)
2. Plan migration Vercel → AWS
3. Documentation onboarding dev
4. Succession technique (knowledge transfer)
5. Archive code releases (Git tags)

Format : Markdown + checklists
```

---

## 30. Évolution & Roadmap

```
Génère une roadmap produit Q1-Q4 2026 pour un SaaS juridique.

MVP (Q1) :
- Dashboard avocat multi-client
- Portail client
- Analyse IA documents
- Monitoring Gmail

Phase 2 (Q2) :
- Templates documents
- Workflow validation
- Notifications push
- Export PDF rapports

Phase 3 (Q3) :
- Mobile app React Native
- Signature électronique
- Chat temps réel
- Marketplace templates

Phase 4 (Q4) :
- IA générative réponses
- Analyse prédictive
- White-label
- Expansion EU

Générer :
1. Roadmap visuelle (Gantt chart ASCII)
2. Estimation efforts (story points)
3. Priorités MoSCoW (Must, Should, Could, Won't)
4. Dépendances entre features
5. Milestones & releases

Format : Markdown + diagramme Mermaid timeline
```

---

## 🎯 Prompts Bonus

### Génération Composant React

```
Génère un composant React TypeScript pour [DESCRIPTION].

Props :
- [prop1]: [type] (description)
- [prop2]: [type] (description)

Features :
- Responsive mobile/desktop
- Dark mode support
- Accessibility (ARIA labels)
- Loading state
- Error state

Technologies :
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons

Format : Fichier .tsx avec types + composant + export
```

### Génération Hook Custom

```
Génère un hook React custom use[Name]() pour [DESCRIPTION].

Fonctionnalités :
- [feature 1]
- [feature 2]
- Error handling
- Loading state

Return type :
{
  data: [type],
  loading: boolean,
  error: Error | null,
  [method1]: () => void,
  [method2]: (param) => Promise<void>
}

Technologies : React 19, TypeScript

Format : hooks/use[Name].ts avec types + tests
```

### Génération API Route

```
Génère une API route Next.js App Router pour [DESCRIPTION].

Method : [GET/POST/PUT/DELETE]
Path : /api/[path]

Security :
- NextAuth session required
- Role : [ADMIN/CLIENT]
- TenantId verification

Request :
- Params : [param1, param2]
- Body : { [field1]: type, [field2]: type }

Response :
- Success : { success: true, data: {...} }
- Error : { success: false, error: string }

Technologies : Next.js 14+, Prisma, NextAuth

Format : app/api/[path]/route.ts
```

---

**Note** : Adaptez les prompts selon vos besoins spécifiques. Plus le prompt est détaillé, meilleure sera la génération de code.

**Dernière mise à jour** : 6 janvier 2026  
**Auteur** : iaPostemanage Tech Team
