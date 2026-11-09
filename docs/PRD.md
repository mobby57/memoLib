# Specification Produit (PRD) - iaPostemanage

> **Version**: 2.0.0  
> **Date**: 2026-01-24  
> **Statut**: FIGE - Document de reference

---

## 1. Vision et Mission

### 1.1 Vision

**"Zero information ignoree, zero delai manque"**

iaPostemanage est une plateforme SaaS de gestion documentaire et procedurale destinee aux cabinets d'avocats specialises en droit des etrangers (CESEDA). Elle garantit une tracabilite totale de chaque piece d'information recue et un respect absolu des delais legaux.

### 1.2 Mission

Fournir aux professionnels du droit un outil qui:
1. **Capture** automatiquement toute information entrante (email, upload, scan)
2. **Classe** et **analyse** via IA locale (Ollama/LLaMA)
3. **Alerte** proactivement sur les delais legaux
4. **Documente** chaque action avec horodatage inviolable
5. **Preserve** les preuves de maniere perenne

### 1.3 Valeurs Cles

| Valeur | Implementation |
|--------|----------------|
| **Tracabilite** | Chaque action = AuditLog avec hash cryptographique |
| **Securite** | Isolation tenant stricte, chiffrement AES-256 |
| **Fiabilite** | Zero perte de donnees, soft delete uniquement |
| **Conformite** | RGPD by design, archivage legal |
| **Autonomie** | IA locale, pas de dependance cloud externe |

---

## 2. Personas Utilisateurs

### 2.1 SUPER_ADMIN (Operateur Plateforme)

| Attribut | Description |
|----------|-------------|
| **Identite** | Equipe technique iaPostemanage |
| **Objectif** | Gerer la plateforme multi-tenant |
| **Besoins** | Monitoring, facturation, support |
| **Permissions** | `manage_platform`, `manage_tenants`, `view_all` |

### 2.2 ADMIN (Avocat / Cabinet)

| Attribut | Description |
|----------|-------------|
| **Identite** | Avocat titulaire ou collaborateur senior |
| **Objectif** | Gerer ses dossiers et clients efficacement |
| **Besoins** | Alertes delais, documents, facturation |
| **Permissions** | `manage_cabinet`, `manage_clients`, `manage_dossiers` |

### 2.3 CLIENT (Justiciable)

| Attribut | Description |
|----------|-------------|
| **Identite** | Personne physique cliente du cabinet |
| **Objectif** | Suivre son dossier, deposer documents |
| **Besoins** | Acces simplifie, notifications claires |
| **Permissions** | `view_own_dossiers`, `submit_documents` |

---

## 3. Fonctionnalites - Priorite MoSCoW

### 3.1 MUST HAVE (MVP)

| ID | Fonctionnalite | Description |
|----|----------------|-------------|
| F01 | **Multi-tenant** | Isolation complete des donnees par cabinet |
| F02 | **Authentification** | Login securise avec NextAuth (credentials, email) |
| F03 | **Gestion Clients** | CRUD clients avec fiches completes |
| F04 | **Gestion Dossiers** | CRUD dossiers lies aux clients |
| F05 | **Upload Documents** | Depot fichiers avec hash SHA-256 |
| F06 | **Delais Legaux** | Calcul automatique CESEDA + alertes J-7/J-3/J-1 |
| F07 | **Journal Audit** | Tracabilite complete de chaque action |
| F08 | **Dashboard Admin** | Vue globale dossiers, alertes, statistiques |
| F09 | **Portail Client** | Interface simplifiee consultation/depot |
| F10 | **Notifications** | Email + push pour alertes critiques |

### 3.2 SHOULD HAVE (V1)

| ID | Fonctionnalite | Description |
|----|----------------|-------------|
| F11 | **Analyse IA Emails** | Classification automatique via Ollama |
| F12 | **OCR Documents** | Extraction texte des PDF/images |
| F13 | **Facturation** | Generation factures PDF, suivi paiements |
| F14 | **Calendrier** | Synchronisation Google/Outlook |
| F15 | **Messagerie** | Chat client-avocat securise |
| F16 | **Recherche Avancee** | Full-text search sur documents |
| F17 | **Export Rapports** | PDF, Excel des dossiers/factures |
| F18 | **Templates Documents** | Modeles de courriers pre-remplis |

### 3.3 COULD HAVE (V2)

| ID | Fonctionnalite | Description |
|----|----------------|-------------|
| F19 | **Workflows Automatises** | Declencheurs sur evenements |
| F20 | **Signature Electronique** | Integration DocuSign/Yousign |
| F21 | **API PISTE** | Connexion directe Prefecture |
| F22 | **Multi-langue** | Interface FR/EN/AR |
| F23 | **Mobile App** | PWA responsive |
| F24 | **Analytics Avancees** | BI embarque, predictions |
| F25 | **Coffre-fort Numerique** | Archivage certifie |

### 3.4 WON'T HAVE (Hors Scope)

| Exclusion | Raison |
|-----------|--------|
| Gestion comptabilite complete | Hors metier avocat |
| CRM commercial | Focus client existant |
| Gestion RH cabinet | Trop specifique |
| Videoconference integree | Solutions externes suffisantes |

---

## 4. Exigences Non-Fonctionnelles

### 4.1 Performance

| Metrique | Objectif |
|----------|----------|
| Temps chargement page | < 2 secondes |
| Temps reponse API | < 500ms (P95) |
| Upload fichier 10 Mo | < 5 secondes |
| Recherche full-text | < 1 seconde |

### 4.2 Securite

| Exigence | Implementation |
|----------|----------------|
| Authentification | JWT + refresh token |
| Autorisation | RBAC strict par role |
| Chiffrement transit | TLS 1.3 minimum |
| Chiffrement repos | AES-256 pour documents |
| Isolation tenant | Filtrage systematique par tenantId |
| Audit trail | Logs immutables avec hash |

### 4.3 Disponibilite

| Metrique | Objectif |
|----------|----------|
| Uptime | 99.5% (hors maintenance planifiee) |
| RTO | 4 heures |
| RPO | 1 heure |
| Backup | Quotidien incremental, hebdo complet |

### 4.4 Conformite

| Norme | Implementation |
|-------|----------------|
| RGPD | Consentement explicite, droit a l'oubli (anonymisation) |
| Secret professionnel | Chiffrement bout-en-bout documents |
| Archivage legal | Retention 10 ans minimum |
| Accessibilite | WCAG 2.1 AA |

---

## 5. Architecture Technique

### 5.1 Stack Technologique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14+ (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, Radix UI |
| Backend | Next.js API Routes, Server Actions |
| Database | PostgreSQL (Neon Cloud) |
| ORM | Prisma 5.x |
| Auth | NextAuth.js v4 |
| IA Locale | Ollama (LLaMA 3.2) |
| Storage | S3-compatible (Cloudflare R2) |
| Cache | Redis (optionnel) |
| Monitoring | Sentry, Vercel Analytics |

### 5.2 Modele de Donnees

Voir [DATA_MODEL.md](./DATA_MODEL.md) pour le schema complet.

**Entites principales**:
- `Tenant` - Organisation (cabinet)
- `User` - Utilisateur avec role
- `Client` - Personne physique geree
- `Dossier` - Affaire juridique
- `Document` - Fichier avec metadonnees
- `Delai` (LegalDeadline) - Echeance legale
- `AuditLog` - Journal d'audit inviolable
- `Proof` - Preuve avec hash

### 5.3 Flux de Donnees Principal

```
[EMAIL/UPLOAD] -> [InformationUnit] -> [Classification IA]
                         |
                         v
                   [Analyse + Liaison]
                         |
              +----------+----------+
              |          |          |
              v          v          v
         [Dossier]  [Document]  [Delai]
              |          |          |
              v          v          v
         [AuditLog] [Proof]   [Alert]
```

---

## 6. Interfaces Utilisateur

### 6.1 Pages SUPER_ADMIN

| Route | Fonction |
|-------|----------|
| `/super-admin` | Dashboard plateforme |
| `/super-admin/tenants` | Liste/gestion cabinets |
| `/super-admin/plans` | Formules abonnement |
| `/super-admin/users` | Utilisateurs globaux |
| `/super-admin/emails` | Monitoring emails |
| `/super-admin/settings` | Configuration globale |

### 6.2 Pages ADMIN

| Route | Fonction |
|-------|----------|
| `/admin` | Dashboard cabinet |
| `/admin/clients` | Gestion clients |
| `/admin/dossiers` | Gestion dossiers |
| `/admin/documents` | Bibliotheque documents |
| `/admin/messages` | Messagerie clients |
| `/admin/billing` | Facturation |
| `/admin/analytics` | Statistiques |
| `/admin/parametres` | Configuration cabinet |

### 6.3 Pages CLIENT

| Route | Fonction |
|-------|----------|
| `/client` | Dashboard personnel |
| `/client/dossiers` | Mes dossiers |
| `/client/documents` | Mes documents |
| `/client/messages` | Messagerie avocat |
| `/client/profil` | Mon profil |

---

## 7. Regles Metier Critiques

### 7.1 Delais CESEDA

| Type Recours | Delai | Base Legale |
|--------------|-------|-------------|
| Recours gracieux | 2 mois | Art. L411-2 CRPA |
| Recours hierarchique | 2 mois | Art. L411-2 CRPA |
| Recours contentieux TA | 2 mois | Art. R421-1 CJA |
| Appel CAA | 1 mois | Art. R811-2 CJA |
| Cassation CE | 2 mois | Art. R821-1 CJA |
| OQTF 30 jours | 30 jours | L511-1 CESEDA |
| OQTF 90 jours | 90 jours | L511-1 CESEDA |

### 7.2 Calcul Automatique

```
Date limite = Date notification + Delai legal
Alerte J-7  = Date limite - 7 jours
Alerte J-3  = Date limite - 3 jours
Alerte J-1  = Date limite - 1 jour
```

### 7.3 Escalade

| Condition | Action |
|-----------|--------|
| Email non traite 24h | Notification ADMIN |
| Email non traite 48h | Notification SUPER_ADMIN |
| Delai J-3 non acquitte | SMS + Email ADMIN |
| Delai depasse | Incident + Rapport auto |

---

## 8. Integration Externes

### 8.1 API PISTE (Prefectures) - V2

| Endpoint | Usage |
|----------|-------|
| Teleservice | Depot demandes en ligne |
| Suivi | Consultation statut dossier |
| Notifications | Webhooks decisions |

### 8.2 Signature Electronique - V2

| Provider | Integration |
|----------|-------------|
| Yousign | API REST, webhooks |
| DocuSign | OAuth2, enveloppes |

### 8.3 Calendrier - V1

| Provider | Integration |
|----------|-------------|
| Google Calendar | OAuth2, CalDAV |
| Microsoft 365 | Graph API |

---

## 9. Scope des Versions

### 9.1 MVP (Mois 1-3)

**Objectif**: Plateforme fonctionnelle minimale

| Composant | Fonctionnalites |
|-----------|-----------------|
| Auth | Login, roles, isolation tenant |
| Clients | CRUD complet |
| Dossiers | CRUD, liaison client |
| Documents | Upload, hash, visualisation |
| Delais | Creation manuelle, alertes email |
| Dashboard | Stats basiques, liste dossiers |

### 9.2 V1 (Mois 4-6)

**Objectif**: Experience complete avocat

| Composant | Fonctionnalites |
|-----------|-----------------|
| IA | Classification emails, OCR |
| Facturation | Generation PDF, suivi |
| Calendrier | Sync externe |
| Messagerie | Chat client-avocat |
| Portail Client | Acces complet |
| Rapports | Export PDF/Excel |

### 9.3 V2 (Mois 7-12)

**Objectif**: Automatisation avancee

| Composant | Fonctionnalites |
|-----------|-----------------|
| Workflows | Automatisations complexes |
| API PISTE | Connexion prefectures |
| Signature | Integration Yousign |
| Mobile | PWA complete |
| Analytics | BI embarque |
| Multi-langue | FR/EN/AR |

---

## 10. Metriques de Succes

### 10.1 KPIs Produit

| Metrique | Objectif MVP | Objectif V1 |
|----------|--------------|-------------|
| Cabinets actifs | 10 | 50 |
| Dossiers geres | 500 | 5 000 |
| Documents uploades | 2 000 | 20 000 |
| Delais respectes | 95% | 99% |
| Incidents delai | < 5% | < 1% |

### 10.2 KPIs Techniques

| Metrique | Objectif |
|----------|----------|
| Disponibilite | > 99.5% |
| TTFB | < 200ms |
| Erreurs API | < 0.1% |
| Score Lighthouse | > 90 |

### 10.3 KPIs Business

| Metrique | Objectif An 1 |
|----------|---------------|
| MRR | 10 000 EUR |
| Churn | < 5% mensuel |
| NPS | > 40 |
| CAC | < 500 EUR |

---

## 11. Risques et Mitigations

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Panne Neon DB | Faible | Critique | Backup quotidien, failover |
| Fuite donnees | Faible | Critique | Chiffrement, audit, pentest |
| Delai manque | Moyen | Eleve | Alertes multi-canal, escalade |
| Surcharge IA | Moyen | Moyen | Queue, rate limiting |
| Non-adoption | Moyen | Eleve | Onboarding guide, support |

---

## 12. Glossaire

| Terme | Definition |
|-------|------------|
| **Tenant** | Organisation cliente (cabinet) utilisant la plateforme |
| **CESEDA** | Code de l'Entree et du Sejour des Etrangers et du Droit d'Asile |
| **OQTF** | Obligation de Quitter le Territoire Francais |
| **TA** | Tribunal Administratif |
| **CAA** | Cour Administrative d'Appel |
| **CE** | Conseil d'Etat |
| **PISTE** | Plateforme d'Interface entre Services pour les Transmissions Electroniques |
| **InformationUnit** | Unite atomique d'information tracee |
| **Proof** | Preuve documentee avec hash cryptographique |

---

## 13. Annexes

### 13.1 Documents Lies

- [DATA_MODEL.md](./DATA_MODEL.md) - Schema base de donnees
- [USER_JOURNEYS.md](./USER_JOURNEYS.md) - Parcours utilisateurs
- [ROADMAP.md](./ROADMAP.md) - Planification 12 mois (a creer)

### 13.2 Changelog

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0.0 | 2026-01-24 | Copilot | Creation initiale |
| 2.0.0 | 2026-01-24 | Copilot | Alignement definition workspace |

---

**Document fige - Toute modification doit etre tracee et validee**

*iaPostemanage - Zero information ignoree, zero delai manque*
