# Roadmap 12 Mois - iaPostemanage

> **Version**: 2.0.0  
> **Date**: 2026-01-24  
> **Periode**: Janvier 2026 - Janvier 2027

---

## Vue d'Ensemble

```
    JAN  FEV  MAR  AVR  MAI  JUN  JUL  AOU  SEP  OCT  NOV  DEC  JAN
    |----+----+----+----+----+----+----+----+----+----+----+----+----|
    |<------- MVP ------>|<------ V1 ------->|<------- V2 -------->|
    |    Phase 1         |    Phase 2        |     Phase 3         |
    |____________________|___________________|_____________________|
    
    Jalons:
    * M1: Infrastructure
    * M3: MVP Release
    * M6: V1 Release  
    * M9: V2 Beta
    * M12: V2 Release
```

---

## Phase 1: MVP (Mois 1-3)

### Objectif
Plateforme fonctionnelle minimale deployable en production

### Mois 1: Infrastructure & Base

**Semaine 1-2: Setup Technique**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Configuration Neon PostgreSQL | DevOps | ✅ Fait |
| Schema Prisma v2 (avec audit) | Backend | ✅ Fait |
| NextAuth integration | Backend | ✅ Fait |
| Structure projet Next.js 14 | Frontend | ✅ Fait |
| CI/CD GitHub Actions | DevOps | ✅ Fait |

**Semaine 3-4: Core Backend**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| API Tenants CRUD | Backend | A faire |
| API Users CRUD + roles | Backend | A faire |
| Middleware Zero-Trust | Backend | ✅ Fait |
| Service AuditLog | Backend | A faire |
| Tests unitaires API | QA | A faire |

### Mois 2: Fonctionnalites Metier

**Semaine 5-6: Clients & Dossiers**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| API Clients CRUD | Backend | A faire |
| API Dossiers CRUD | Backend | A faire |
| Liaison Client-Dossier | Backend | A faire |
| Validation schemas Zod | Backend | A faire |
| Pages admin/clients | Frontend | A faire |
| Pages admin/dossiers | Frontend | A faire |

**Semaine 7-8: Documents & Delais**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Upload documents S3 | Backend | A faire |
| Hash SHA-256 auto | Backend | A faire |
| API LegalDeadline | Backend | A faire |
| Calcul delais CESEDA | Backend | A faire |
| Alertes J-7/J-3/J-1 | Backend | A faire |
| Pages documents | Frontend | A faire |

### Mois 3: Dashboard & Portail Client

**Semaine 9-10: Dashboard Admin**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Dashboard statistiques | Frontend | A faire |
| Liste dossiers filtrable | Frontend | A faire |
| Widget alertes delais | Frontend | A faire |
| Graphiques Chart.js | Frontend | A faire |
| Notifications toast | Frontend | A faire |

**Semaine 11-12: Portail Client + Tests**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Pages /client/* | Frontend | A faire |
| Depot documents client | Frontend | A faire |
| Consultation dossier | Frontend | A faire |
| Tests E2E Playwright | QA | A faire |
| Documentation API | Docs | A faire |
| **RELEASE MVP** | Equipe | Jalon M3 |

### Livrables MVP
- [ ] Multi-tenant fonctionnel
- [ ] Auth + RBAC complet
- [ ] CRUD Clients/Dossiers/Documents
- [ ] Delais legaux avec alertes
- [ ] Dashboard admin basique
- [ ] Portail client minimal
- [ ] Audit trail complet

---

## Phase 2: V1 (Mois 4-6)

### Objectif
Experience complete pour l'avocat au quotidien

### Mois 4: IA & Classification

**Semaine 13-14: Integration Ollama**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Setup Ollama local | DevOps | A faire |
| API classification emails | Backend | A faire |
| Modele prompt CESEDA | IA | A faire |
| Queue traitement async | Backend | A faire |

**Semaine 15-16: OCR Documents**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Integration Tesseract | Backend | A faire |
| Extraction PDF/images | Backend | A faire |
| Indexation full-text | Backend | A faire |
| UI resultats OCR | Frontend | A faire |

### Mois 5: Facturation & Calendrier

**Semaine 17-18: Module Facturation**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| API Factures CRUD | Backend | A faire |
| Generation PDF | Backend | A faire |
| Lignes et paiements | Backend | A faire |
| Pages billing | Frontend | A faire |
| Export comptable | Backend | A faire |

**Semaine 19-20: Calendrier**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Integration FullCalendar | Frontend | A faire |
| OAuth Google Calendar | Backend | A faire |
| OAuth Microsoft 365 | Backend | A faire |
| Sync bidirectionnelle | Backend | A faire |

### Mois 6: Messagerie & Rapports

**Semaine 21-22: Messagerie Securisee**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| API Messages | Backend | A faire |
| WebSocket temps reel | Backend | A faire |
| UI chat | Frontend | A faire |
| Notifications push | Backend | A faire |

**Semaine 23-24: Rapports + Release**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Export PDF dossiers | Backend | A faire |
| Export Excel factures | Backend | A faire |
| Templates courriers | Backend | A faire |
| Tests regression | QA | A faire |
| **RELEASE V1** | Equipe | Jalon M6 |

### Livrables V1
- [ ] Classification IA emails
- [ ] OCR documents automatique
- [ ] Facturation complete
- [ ] Calendrier synchronise
- [ ] Messagerie client-avocat
- [ ] Rapports PDF/Excel
- [ ] Templates documents

---

## Phase 3: V2 (Mois 7-12)

### Objectif
Automatisation avancee et integrations externes

### Mois 7-8: Workflows & Automatisation

**Semaine 25-28: Moteur Workflows**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Designer workflows UI | Frontend | A faire |
| Moteur execution | Backend | A faire |
| Triggers evenements | Backend | A faire |
| Actions predefinies | Backend | A faire |
| Templates workflows | Product | A faire |

### Mois 9: Integrations Externes

**Semaine 29-32: API PISTE**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Etude API PISTE | Backend | A faire |
| Auth OAuth2 PISTE | Backend | A faire |
| Depot teleservice | Backend | A faire |
| Suivi statut | Backend | A faire |
| Webhooks decisions | Backend | A faire |

### Mois 10: Signature Electronique

**Semaine 33-36: Integration Yousign**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| API Yousign | Backend | A faire |
| Flux signature | Backend | A faire |
| UI signature client | Frontend | A faire |
| Archivage preuves | Backend | A faire |
| **RELEASE V2 BETA** | Equipe | Jalon M9 |

### Mois 11: Mobile & Multi-langue

**Semaine 37-40: PWA Complete**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Responsive mobile | Frontend | A faire |
| Service Worker | Frontend | A faire |
| Push notifications | Backend | A faire |
| Mode offline | Frontend | A faire |

**Semaine 41-44: Internationalisation**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Setup i18n | Frontend | A faire |
| Traduction FR | Docs | A faire |
| Traduction EN | Docs | A faire |
| Traduction AR | Docs | A faire |

### Mois 12: Analytics & Release

**Semaine 45-48: BI Embarque**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Dashboard analytics | Frontend | A faire |
| Rapports automatiques | Backend | A faire |
| Predictions IA | IA | A faire |
| Export donnees | Backend | A faire |

**Semaine 49-52: Finalisation**
| Tache | Responsable | Statut |
|-------|-------------|--------|
| Audit securite | Security | A faire |
| Tests charge | QA | A faire |
| Documentation complete | Docs | A faire |
| Formation clients | Support | A faire |
| **RELEASE V2** | Equipe | Jalon M12 |

### Livrables V2
- [ ] Workflows automatises
- [ ] Integration API PISTE
- [ ] Signature electronique
- [ ] PWA mobile complete
- [ ] Multi-langue FR/EN/AR
- [ ] Analytics avancees
- [ ] Documentation complete

---

## Jalons Cles

| Jalon | Date | Criteres de Succes |
|-------|------|-------------------|
| **M1** | Fev 2026 | Infrastructure prod operationnelle |
| **M3** | Avr 2026 | MVP deployable, 5 cabinets beta |
| **M6** | Juil 2026 | V1 complete, 20 cabinets actifs |
| **M9** | Oct 2026 | V2 beta, 35 cabinets |
| **M12** | Jan 2027 | V2 finale, 50 cabinets, rentabilite |

---

## Ressources Estimees

### Equipe Necessaire

| Role | Nombre | Periode |
|------|--------|---------|
| Tech Lead / Fullstack | 1 | M1-M12 |
| Frontend Developer | 1 | M1-M12 |
| Backend Developer | 1 | M1-M12 |
| DevOps / SRE | 0.5 | M1-M12 |
| QA Engineer | 0.5 | M2-M12 |
| Product Owner | 0.5 | M1-M12 |

### Budget Estimatif

| Poste | Cout Mensuel | Total 12 mois |
|-------|--------------|---------------|
| Developpement (3.5 ETP) | 21 000 EUR | 252 000 EUR |
| Infrastructure | 500 EUR | 6 000 EUR |
| Outils/Licences | 300 EUR | 3 600 EUR |
| Marketing | 1 000 EUR | 12 000 EUR |
| **Total** | **22 800 EUR** | **273 600 EUR** |

---

## Risques et Mitigations

| Phase | Risque | Mitigation |
|-------|--------|------------|
| MVP | Retard schema DB | Schema v2 deja fait |
| MVP | Complexite RBAC | Middleware existant |
| V1 | Performance Ollama | Queue + rate limiting |
| V1 | API Google/Microsoft | Fallback iCal |
| V2 | API PISTE instable | Mode degrade manuel |
| V2 | Certification signature | Partenariat Yousign |

---

## Indicateurs de Suivi

### Velocity Hebdomadaire
| Semaine | Story Points | Burndown |
|---------|--------------|----------|
| S1-S12 | 15 SP/sem | MVP |
| S13-S24 | 18 SP/sem | V1 |
| S25-S48 | 20 SP/sem | V2 |

### Metriques Produit

| KPI | M3 | M6 | M12 |
|-----|-----|-----|------|
| Cabinets actifs | 5 | 20 | 50 |
| Dossiers geres | 100 | 1000 | 5000 |
| MRR | 0 EUR | 2000 EUR | 10000 EUR |
| NPS | - | 30 | 50 |

---

## Prochaines Actions Immediates

### Cette Semaine (S4 - Janvier 2026)

| # | Action | Responsable | Echeance |
|---|--------|-------------|----------|
| 1 | Executer migration Prisma | Dev | J+1 |
| 2 | Implementer AuditLog service | Dev | J+3 |
| 3 | Tests API existantes | QA | J+5 |
| 4 | Configurer Sentry monitoring | DevOps | J+5 |
| 5 | Recruter Frontend dev | PM | J+7 |

### Semaine Prochaine (S5)

| # | Action | Responsable |
|---|--------|-------------|
| 1 | API Clients CRUD | Backend |
| 2 | Pages /admin/clients | Frontend |
| 3 | Validation Zod schemas | Backend |
| 4 | Tests integration | QA |

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0.0 | 2026-01-24 | Creation initiale |
| 2.0.0 | 2026-01-24 | Alignement PRD v2 |

---

*iaPostemanage - Roadmap 2026*
