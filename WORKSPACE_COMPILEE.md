# 📘 WORKSPACE COMPILÉ — iaPosteManager

## VERSION DE RÉFÉRENCE (27 janv 2026)

---

## SECTION 1 — IDENTITÉ DU PROJET

### 1.1 Dénomination Officielle

- **Nom commercial :** **iaPosteManager**
- **Acronyme :** IPM
- **Nature juridique :** Plateforme SaaS (Software as a Service)
- **Secteur :** Logiciels pour professions réglementées
- **Cible primaire :** Cabinets d'avocats (France, spécialisés droit des étrangers CESEDA)
- **Statut actuel :** En développement (MVP/Beta)

### 1.2 Propriété & Gouvernance

- **Propriétaire repo :** mobby57 (GitHub)
- **Branche de production :** main
- **Licence :** Proprietary (droits réservés)
- **Accès :** Privé (repo fermé)

---

## SECTION 2 — LE PROBLÈME ADRESSÉ

### 2.1 Contexte : Cabinets d'Avocats Français

Les cabinets d'avocats font face à :

| Problème                            | Illustration                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| **Dispersion des communications**   | Emails, WhatsApp, SMS, formulaires web, appels → pas de centralisation                        |
| **Perte de mémoire opérationnelle** | Pas d'historique indexé ; recherche manuelle coûteuse                                         |
| **Délais légaux critiques**         | CESEDA impose des délais impératifs (ex. recours OQTF = 30j) ; un délai manqué = irréversible |
| **Charge administrative coûteuse**  | Reclassement manuel, rappels, suivi documentaire = 10-15h/semaine/avocat                      |
| **Risque juridique élevé**          | Manque de traçabilité ; pas de preuve d'accusé réception ; responsabilité personnelle engagée |
| **Variabilité qualité**             | Sans IA, classement dépend de l'humain : erreurs, oublis, inconsistances                      |

### 2.2 Effet Domino

> Un seul délai manqué = perte définitive du droit d'agir → condamnation du client

---

## SECTION 3 — LA SOLUTION (PROMESSE PRODUIT)

### 3.1 Encadrement Fondamental

**iaPosteManager ne remplace pas le jugement humain.**

C'est un **système d'assistance à la décision juridique** qui :

- ✅ **Centralise** les flux (12 canaux)
- ✅ **Documente** automatiquement
- ✅ **Alerte** sur les urgences et délais
- ✅ **Assiste** la recherche et la stratégie
- ❌ **N'automatise jamais** la décision juridique
- ❌ **N'émet jamais** de conseil légal
- ❌ **N'engage jamais** la responsabilité du système

### 3.2 Promesse Précise

**"Zero information ignorée, zero délai manqué"**

1. **Capture omnicanal**
   - Email (boîte dédiée monitorée en temps réel)
   - WhatsApp / SMS (via Twilio)
   - Upload documents
   - Formulaires web
   - API externes (PISTE, Légifrance)

2. **Traitement intelligent**
   - Normalisation automatique
   - Classification IA (catégories métier)
   - Extraction d'entités (dates, noms, délais légaux)
   - Horodatage inviolable

3. **Supervision humaine intégrée**
   - **Workspace Reasoning** : Raisonnement guidé IA
   - États : Reçu → Faits → Contextes → Obligations → Manques → Risques → Actions → Prêt
   - Chaque étape demande validation humaine avant progression
   - Pas de saut d'étape possible

4. **Aide à la décision**
   - Résumés contextuels
   - Identification des obligations légales applicables
   - Matrice risques/actions
   - Suggestions (jamais d'impositions)

5. **Audit & Conformité**
   - Logs immuables (immutable audit trail)
   - RGPD-compliant (export/suppression/consentements)
   - Zéro donnée sensible non filtrée
   - Preuve légale en cas de litige

---

## SECTION 4 — ARCHITECTURE TECHNIQUE (CIBLE)

### 4.1 Stack Global

```
FRONTEND                    BACKEND                    DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next.js 16                  Node.js (API Routes)       PostgreSQL 15+
├─ React 19                 ├─ Prisma ORM              ├─ Neon / Azure
├─ TailwindCSS              ├─ Zod (validation)        ├─ Chiffrement au repos
├─ TypeScript               ├─ NextAuth (SSO)          └─ Backup automatisé
└─ Shadcn/UI                └─ rate-limit (Upstash)

CANAUX                      SERVICES IA                MONITORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email (Resend)              Python (microservice)      Sentry (errors)
WhatsApp (Twilio)           ├─ Ollama (local LLM)      Datadog (logs)
SMS (Twilio)                ├─ OpenAI (GPT-4 fallback) Uptime monitoring
Slack / Teams (webhooks)    └─ Document parsing        Alert rules

SÉCURITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ Zero Trust (Cloudflare)
├─ RBAC (Role-Based Access Control)
├─ 2FA (TOTP + backup codes)
├─ JWT (tokens signés)
└─ CORS restrictif (prod)
```

### 4.2 Déploiement

| Env         | Frontend               | Backend           | DB              | Status     |
| ----------- | ---------------------- | ----------------- | --------------- | ---------- |
| **Dev**     | Vercel (preview)       | Next.js local     | localhost       | ✅ Actif   |
| **Staging** | Vercel (staging)       | Azure Container   | Neon staging    | ✅ Actif   |
| **Prod**    | Vercel (custom domain) | Azure App Service | PostgreSQL (UE) | ⏳ En prép |

### 4.3 Multitenancy

- **Isolation :** Données cloisonnées par `tenantId` (cabinet)
- **Authentification :** NextAuth + JWT signé
- **Audit :** Chaque action loggée avec tenant + utilisateur

---

## SECTION 5 — CORE FUNCTIONAL SYSTEM (CFS)

### 5.1 Pipeline Multicanal

```
ENTRANT
  ↓
[Canal spécifique : Email / WhatsApp / Upload / API...]
  ↓
[Webhook → Queue → Traitement asynchrone]
  ↓
NORMALISATION (timestamp, expéditeur, contenu, format)
  ↓
CLASSIFICATION IA (catégorie métier, urgence, type)
  ↓
EXTRACTION ENTITÉS (dates, noms, délais légaux, obligations)
  ↓
INDEXATION (Elasticsearch / Upstash)
  ↓
WORKSPACE CRÉÉ (état = RECEIVED)
  ↓
NOTIFICATION (avocat alerté)
```

### 5.2 Workspace Reasoning (Cœur de l'IA)

**Objectif :** Guider l'avocat à travers 7 états vers une décision complète et traçable.

```
┌─────────────────────────────────────────────────────────┐
│                   WORKSPACE REASONING                   │
└─────────────────────────────────────────────────────────┘

État 1: RECEIVED
├─ Message brut reçu
├─ Validation basique
└─ Next → FACTS_EXTRACTED

État 2: FACTS_EXTRACTED ✓
├─ Extraction de faits certains (avec sources)
├─ Confidence > 0.9 (sinon "incertain")
├─ Horodatage source
└─ Next → CONTEXT_IDENTIFIED

État 3: CONTEXT_IDENTIFIED ✓
├─ Identification cadres légaux (CESEDA, CEDH, etc.)
├─ Cadres administratifs (préfecture, OFII, etc.)
├─ Délais applicables
└─ Next → OBLIGATIONS_DEDUCED

État 4: OBLIGATIONS_DEDUCED ✓
├─ Déduction des obligations légales
├─ Actions obligatoires vs. recommandées
├─ Validation humaine requise
└─ Next → MISSING_IDENTIFIED

État 5: MISSING_IDENTIFIED ✓
├─ Identification éléments manquants
├─ Bloquants vs. non-bloquants
├─ Plan résolution (qui ? quand ?)
└─ Next → RISKS_EVALUATED (si bloquants résolus)

État 6: RISKS_EVALUATED ✓
├─ Matrice risques (probabilité × impact)
├─ Actions de mitigation
├─ Documentation risques
└─ Next → ACTION_PROPOSED

État 7: ACTION_PROPOSED ✓
├─ Actions listées (priorité, responsable)
├─ Suivi exécution
└─ Next → READY_FOR_HUMAN

État 8: READY_FOR_HUMAN ✓ [FINAL]
├─ Tous critères validés
├─ Incertitude < 20%
├─ Locked for decision (avocat peut agir)
├─ Audit trail complet
└─ [Fin du raisonnement assisté]

│ Retours possibles à tout moment (révision)
```

### 5.3 Règles Non-Négociables (Règle #5)

**Jamais d'automation aveugle.**

- ❌ Pas de réponse email automatique sans validation
- ❌ Pas de création action sans accord humain
- ❌ Pas de modification délai sans vérification juridique
- ❌ Pas de suppression données sans audit
- ✅ Chaque action laisse une trace immutable
- ✅ Humain peut toujours intervenir/corriger

---

## SECTION 6 — CAPACITÉS FONCTIONNELLES

### 6.1 MVP (Janvier-Mars 2026)

| Domaine       | Fonctionnalités                                     |
| ------------- | --------------------------------------------------- |
| **Auth**      | Login, roles (avocat/admin/clerk), isolation tenant |
| **Clients**   | CRUD complet, historique communications             |
| **Dossiers**  | CRUD, liaison client, délais CESEDA manuels         |
| **Documents** | Upload, hash SHA-256, visualisation (PDF/DOCX)      |
| **Alertes**   | Email délais proches, notifications temps réel      |
| **Dashboard** | Stats basiques, liste dossiers, vue d'ensemble      |

### 6.2 V1 (Avril-Juin 2026)

| Domaine            | Fonctionnalités                         |
| ------------------ | --------------------------------------- |
| **IA**             | Classification emails, OCR, résumés     |
| **Facturation**    | Génération PDF, suivi clients, exports  |
| **Calendrier**     | Sync externe (Google Calendar, Outlook) |
| **Chat**           | Messaging client-avocat temps réel      |
| **Portail Client** | Accès lectures, upload documents, suivi |
| **Rapports**       | Export PDF/Excel auditables             |

### 6.3 V2 (Juillet-Décembre 2026)

| Domaine                 | Fonctionnalités                                 |
| ----------------------- | ----------------------------------------------- |
| **Workspace Reasoning** | 7 états complets, validation progressive        |
| **PISTE API**           | Intégration légifrance, recherche jurisprudence |
| **Predictive AI**       | Estimation délais, probabilité succès           |
| **Learning Loop**       | Feedback → amélioration IA                      |
| **Multi-langue**        | Support anglais, espagnol                       |
| **Intégrations**        | Slack, Teams, Discord, webhooks                 |

---

## SECTION 7 — MODÈLE ÉCONOMIQUE

### 7.1 Tiers (Pricing)

| Tier           | Cible               | Prix (€/mois) | Utilisateurs | Dossiers | Canaux           | IA                      |
| -------------- | ------------------- | ------------- | ------------ | -------- | ---------------- | ----------------------- |
| **Starter**    | Solo avocat         | 49            | 1            | 100      | Email + WhatsApp | Classification          |
| **Pro**        | Petit cabinet (2-5) | 149           | 5            | 500      | Tous (12)        | Full reasoning          |
| **Enterprise** | Cabinet (10+)       | 449+          | ∞            | ∞        | Custom           | Private LLM + SLA 99.9% |

### 7.2 Modèle Revenu

- **SaaS mensuel** : Facturation par cabinet (multi-utilisateur)
- **Dépassements** : Utilisateurs additionnels (+20€), dossiers supplémentaires
- **Premium Support** : +50€/mois (SLA 4h)
- **Custom Integration** : Devis à la demande

### 7.3 Cibles Expansion

1. **Courts 2026** : France (CESEDA) → 50 cabinets → 5K€ MRR
2. **Mi 2026** : Europe (GDPR translation) → 150 clients → 20K€ MRR
3. **2027** : Secteur public (préfectures, OFII) → Enterprise

---

## SECTION 8 — CONFORMITÉ & GOUVERNANCE

### 8.1 RGPD

| Aspect                 | Mesure                                                     |
| ---------------------- | ---------------------------------------------------------- |
| **Consentement**       | Opt-in explicite ; refus possible de certaines données     |
| **Durée conservation** | Configurable par cabinet (1-7 ans)                         |
| **Droit d'accès**      | Export JSON complètes possible                             |
| **Droit à l'oubli**    | Suppression logique + destruction physique (90j)           |
| **Data Minimization**  | Zéro donnée sensible stockée sans filtre                   |
| **Chiffrement**        | AES-256 au repos ; TLS 1.3 en transit                      |
| **Responsable**        | Cabinet = responsable de traitement ; IPM = co-responsable |

### 8.2 Responsabilité Juridique

**Principes non-négociables :**

1. **IPM ≠ Conseil juridique**
   - Aucun avis légal fourni
   - Disclaimers obligatoires dans l'UI
   - CGU explicites

2. **Humain responsable**
   - Avocat reste responsable de ses actes
   - IPM = outil, pas remplaçant
   - Traçabilité complète (qui a décidé quoi)

3. **Réclamations**
   - Assurance RC Pro requise (cabinet responsable)
   - IPM couvert par cyber-assurance

### 8.3 Conformité Technique

- ✅ **ISO 27001** (visé 2026)
- ✅ **SOC 2 Type II** (visé 2026)
- ✅ **OWASP Top 10** (tests réguliers)
- ✅ **Pen-test annuel** (mandatory)
- ✅ **Code audit** (avant chaque déploiement prod)

### 8.4 Audit Trail

**Immuable et incontestable :**

```json
{
  "timestamp": "2026-01-27T15:30:00Z",
  "actor": "avocat@cabinet.fr",
  "tenantId": "cabinet-xyz",
  "action": "workspace_state_changed",
  "from": "FACTS_EXTRACTED",
  "to": "CONTEXT_IDENTIFIED",
  "reason": "Contextes CESEDA identifiés",
  "dataHash": "sha256:abc123...",
  "signature": "ed25519:xyz789..."
}
```

---

## SECTION 9 — SÉCURITÉ (DÉTAIL)

### 9.1 Authentification & Autorisation

- **AuthN** : NextAuth + SSO (Google, Microsoft, SAML optional)
- **AuthZ** : RBAC (roles: SUPER_ADMIN, TENANT_ADMIN, LAWYER, CLERK, CLIENT)
- **2FA** : TOTP obligatoire (admin/lawyer) ; backups codes en DB
- **Session** : JWT signé 1h ; refresh token 30j

### 9.2 Secrets Management

| Secret               | Stockage                | Rotation | Accès           |
| -------------------- | ----------------------- | -------- | --------------- |
| DB password          | Azure Key Vault         | 90j      | Deployment only |
| API keys (3rd party) | GitHub Secrets + Vault  | 180j     | CI/CD + backend |
| JWT secret           | Environment (K8s/Azure) | 30d      | Runtime only    |
| Encryption keys      | HSM (visé)              | Annual   | Audit logged    |

**Jamais de clé en clair dans le code.**

### 9.3 Network Security

- **Cloudflare WAF** : DDoS, IP filtering, rate-limiting
- **CORS** : Restrictif en prod (localhost en dev)
- **HTTPS** : Obligatoire ; CSP headers ; HSTS
- **VPN** : Accès infra via Cloudflare Access (Zero Trust)

### 9.4 Data Protection

- **At Rest** : AES-256 (sensible fields)
- **In Transit** : TLS 1.3 ; certificate pinning (mobile)
- **Backup** : Encrypted, replicated, daily tests
- **Deletion** : Cryptographic erasure (keys destroyed)

---

## SECTION 10 — INFRASTRUCTURE & DÉPLOIEMENT

### 10.1 Environments

| Env         | Frontend           | Backend          | Database        | Monitoring      |
| ----------- | ------------------ | ---------------- | --------------- | --------------- |
| **Dev**     | localhost:3000     | localhost:3000   | localhost:5432  | Console         |
| **Staging** | \*.staging.iapm.io | Azure (staging)  | Neon (staging)  | Sentry, Datadog |
| **Prod**    | iapostemanager.fr  | Azure App (prod) | PostgreSQL (FR) | Full stack      |

### 10.2 Scalability

- **Frontend** : Vercel (infinite) + CDN edge
- **Backend** : Azure Container Instances (auto-scale 1-20)
- **Database** : Neon autoscaling ; connection pooling (Upstash Redis)
- **Queue** : Bull + Redis (pour async jobs)

### 10.3 Disaster Recovery

| Aspect              | RTO   | RPO           | Test       |
| ------------------- | ----- | ------------- | ---------- |
| **DB crash**        | 15min | 1min          | Monthly    |
| **Regional outage** | 4h    | 1h            | Quarterly  |
| **Code bug**        | 30min | 0min (revert) | Per deploy |
| **Ransomware**      | 24h   | 24h           | Annual     |

---

## SECTION 11 — ÉQUIPE & RESSOURCES

### 11.1 Composition Actuelle

| Rôle             | FTE | Responsabilités                 |
| ---------------- | --- | ------------------------------- |
| **Founder**      | 1.0 | Vision, fundraising, legal      |
| **Tech Lead**    | 1.0 | Architecture, security, deploys |
| **Backend Dev**  | 1.0 | API, database, workflows        |
| **Frontend Dev** | 1.0 | UI, UX, accessibility           |
| **DevOps**       | 0.5 | CI/CD, infra, monitoring        |
| **QA**           | 0.5 | Testing, release validation     |

**Total : 5 FTE**

### 11.2 Roadmap RH

- **M3 2026** : +1 Backend (async jobs, IA)
- **M6 2026** : +1 Product Manager (feedback clients)
- **M9 2026** : +1 Full-stack (features)

---

## SECTION 12 — MÉTRIQUES & KPIs

### 12.1 Produit

| KPI                   | Baseline | Target 2026  | Target 2027 |
| --------------------- | -------- | ------------ | ----------- |
| **Clients actifs**    | 0        | 50           | 500         |
| **Dossiers/mois**     | -        | 1.000        | 10.000      |
| **Uptime**            | -        | 99.5%        | 99.95%      |
| **IA accuracy**       | -        | 85%          | 95%+        |
| **Adoption features** | -        | 3 canaux moy | 8+          |

### 12.2 Commercial

| KPI     | Target 2026 | Target 2027 |
| ------- | ----------- | ----------- |
| **MRR** | 5K€         | 50K€        |
| **ARR** | 60K€        | 600K€       |
| **CAC** | 500€        | 400€        |
| **LTV** | 12K€        | 36K€        |
| **NPS** | 40          | 50+         |

### 12.3 Technique

| KPI                 | Target              |
| ------------------- | ------------------- |
| **Build time**      | < 5min              |
| **Test coverage**   | > 80% (cible : 90%) |
| **Error rate**      | < 0.1%              |
| **API latency p95** | < 500ms             |
| **Security score**  | A+ (OWASP)          |

---

## SECTION 13 — RISQUES & MITIGATIONS

### 13.1 Risques Produit

| Risque                   | Probabilité | Impact | Mitigation                                   |
| ------------------------ | ----------- | ------ | -------------------------------------------- |
| **Adoption lente**       | M           | H      | Freemium tier ; partnerships avocats         |
| **IA hallucinations**    | M           | H      | Validation humaine obligatoire ; fine-tuning |
| **Délai manqué critère** | B           | C      | Alertes redondantes ; SMS + email            |
| **Perte données**        | B           | C      | Backup 3x répliqué ; RTO 15min               |

### 13.2 Risques Légaux

| Risque                         | Mitigation                     |
| ------------------------------ | ------------------------------ |
| **Responsabilité civile**      | Disclaimers + RC Pro assurance |
| **Données sensibles exposées** | Chiffrement AES-256 + audit    |
| **Non-RGPD**                   | Privacy by design ; DPA signé  |
| **Breach notification**        | CERT-FR notify < 72h           |

### 13.3 Risques Commerciaux

| Risque            | Mitigation                                           |
| ----------------- | ---------------------------------------------------- |
| **Concurrence**   | Différenciation : raisonnement IA + CESEDA expertise |
| **Churn clients** | Onboarding personnalisé ; support premium            |
| **Pricing clash** | Freemium adoption ; upsell features                  |

---

## SECTION 14 — DIFFÉRENCIATION & MOAT

### 14.1 Avantages Structurels

1. **Spécialisation métier**
   - Seul outil pensé pour cabinets CESEDA
   - Knowledge base juridique intégrée
   - Délais pré-configurés (CEDH, OQTF, etc.)

2. **Raisonnement IA assisté**
   - Approche unique : 7 états vs. automation aveugle
   - Traçabilité complète (qui a validé quoi)
   - Humain responsable, jamais système

3. **Complexité d'implémentation**
   - Infrastructure multi-tenant securisée
   - Intégrations PISTE/Légifrance
   - Audit trail immuable

4. **Network effects (futurs)**
   - Benchmark (anonymisé) : durée moy, succès taux
   - Learning loop : feedback → IA amélioration

### 14.2 Antériorité & IP

- **Dépôt Git** : Antériorité technique publique
- **E-Soleau INPI** : Envisagé (dépôt algo + prompts)
- **Documentation** : Gouvernance formalisée
- **Brand** : Proprietary (copyrights + trademarks)

---

## SECTION 15 — STATUT ACTUEL & PROCHAINES ÉTAPES

### 15.1 State of Art (27 janvier 2026)

| Domaine             | Statut         | % Complétude |
| ------------------- | -------------- | ------------ |
| **Architecture**    | ✅ Figée       | 100%         |
| **Frontend**        | ⏳ En cours    | 60%          |
| **Backend API**     | ⏳ En cours    | 50%          |
| **IA/Reasoning**    | 🔧 En dev      | 70%          |
| **Tests**           | ⚠️ À renforcer | 20%          |
| **Docs/Compliance** | ✅ Complètes   | 90%          |
| **Infrastructure**  | ✅ Ready       | 100%         |

**Assessment :** MVP prêt Q2 2026 (avril-mai)

### 15.2 Blocages Critiques

1. **Build TypeScript** : 827+ errors (types manquants) → FIX EN COURS
2. **Test coverage** : 20% → Target 80%
3. **Security audit** : Pen-test externe requis avant prod
4. **Client pilot** : 1er client beta courant 2026

### 15.3 Action Items Immédiats

- [ ] Déblocage TypeScript (this week)
- [ ] Nettoyage dette technique
- [ ] Suite de tests complète
- [ ] Security audit externe
- [ ] Document Unique (PDF officiel)
- [ ] Démonstration interactif pour investors

---

## SECTION 16 — PHILOSOPHIE FONDATRICE

> **"Tout ce qui engage la responsabilité humaine ne doit jamais être automatisé."**

iaPosteManager :

- ✅ **Éclaire** (données + contexte)
- ✅ **Structure** (workflow guidé)
- ✅ **Mémorise** (audit trail complet)
- ❌ **Jamais décide** (humain responsable)

**Cette philosophie est non-négociable et gravée dans chaque ligne de code.**

---

## SECTION 17 — PROCHAINES UTILISATIONS DE CE DOCUMENT

Ce document est exploitable pour :

| Audience           | Usage                                            |
| ------------------ | ------------------------------------------------ |
| **Vous (founder)** | Référence décisions techniques ; pitch investors |
| **Partenaires**    | Présentation capacités ; contrats intégrations   |
| **Avocats**        | Vérification conformité légale ; disclaimers     |
| **Investisseurs**  | Due diligence ; business plan détaillé           |
| **Clients**        | Documentation produit ; governance               |
| **Équipe**         | Onboarding ; architecture decisions              |

---

## SECTION 18 — VERSIONS & CHANGELOG

| Version  | Date        | Auteur  | Changement                    |
| -------- | ----------- | ------- | ----------------------------- |
| 1.0      | 27 jan 2026 | System  | Document de référence compilé |
| (Future) | Q2 2026     | Product | Mise à jour post-MVP          |

---

**Document compilé — Statut : FIGE**
**Dernière révision : 27 janvier 2026**
**Accessibilité : Confidentiel (Founder + Team)**

---

# 📋 ANNEXES

## A1 — Glossaire Technique

| Terme           | Définition                                        |
| --------------- | ------------------------------------------------- |
| **Workspace**   | Conteneur de raisonnement pour un message/dossier |
| **Tenant**      | Cabinet d'avocats (isolation données)             |
| **CESEDA**      | Code de l'entrée et du séjour des étrangers       |
| **OQTF**        | Obligation de quitter le territoire français      |
| **Reasoning**   | 7 états supervisés (IA + validation humaine)      |
| **Audit Trail** | Logs immuables de chaque action                   |
| **Moat**        | Avantage structurel durable                       |

## A2 — Ressources Critiques

- `/docs/PRD.md` — Spécification produit complète
- `/docs/ROADMAP.md` — Planification 12 mois
- `/docs/PITCH.md` — Pitch investors
- `/security/SECURITY_AUDIT_REPORT.md` — Audit sécurité
- `/.env.example` — Configuration required

## A3 — Contacts & Escalade

| Rôle            | Email                     | Disponibilité |
| --------------- | ------------------------- | ------------- |
| Founder         | [À configurer]            | 24/7          |
| Tech Lead       | [À configurer]            | Bureau        |
| Support Clients | support@iapostemanager.fr | 9h-18h (FR)   |

---

**FIN DU DOCUMENT**
