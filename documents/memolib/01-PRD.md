\# PRD — MemoLib



\---

projet: MemoLib

document: 01-PRD

version: 0.1.1

date: 2026-11-01

statut: brouillon

sources: \[session-locale, github:mobby57/memoLib, audit-nov-2025]

hypotheses: \[Q4=vision OK, Q5=principe+déonto, Q6=portail STUB]

\---



\## S1 — Vision, mission, personas, principes



\### Vision

MemoLib est une plateforme de gestion intelligente destinée aux cabinets d'avocats et professions juridiques, qui automatise le workflow complet du dossier juridique — de la réception du courriel jusqu'à la gestion des échéances et la génération documentaire — tout en préservant la décision humaine sur les actes sensibles.



`\[confirmé:github]` README : « MemoLib est une plateforme de gestion intelligente pour cabinets d'avocats. Elle automatise le workflow complet : réception d'emails, analyse IA, création de dossiers, gestion des deadlines, génération de documents, et conformité RGPD. »



`\[confirmé:session]` Le périmètre réel dépasse le README : comptabilité (CARPA, TVA, FEC), gestion cabinet (temps, factures), modules avancés (workspace-reasoning, multichannel, signatures).



\*\*Nature\*\* : SaaS multi-tenant vertical (LegalTech), cible 1-50 avocats.



\### Mission

1\. \*\*Réduire le temps administratif\*\* (capture info + préparation documentaire, sans automatiser la décision)

2\. \*\*Fiabiliser les échéances\*\* (détection IA + alertes J-7/J-3/J-1)

3\. \*\*Tracer chaque action\*\* (audit trail chaîné, journalisation, AIUsageLog)



\### Personas

\- \*\*P1 Avocat associé/collaborateur\*\* (1-10) — dossiers, actes, échéances. Feature clé : Email→Dossier 1 clic

\- \*\*P2 Notaire / Commissaire de justice / Expert\*\* — actes, procédures. Feature clé : 6 templates + DOCX

\- \*\*P3 Secrétaire/Assistant\*\* — réception, planning. Feature clé : inbox priorisée, dashboards

\- \*\*P4 Client final\*\* `\[HYP:STUB]` — portail client (routes existent, non mentionné README)

\- \*\*P5 Admin/Super-admin\*\* — multi-tenant, rôles, facturation SaaS, conformité



\### Principes produit

1\. \*\*L'IA assiste, le professionnel décide\*\* `\[HYP]` — validation humaine obligatoire sur actes sensibles

2\. \*\*Multi-tenant strict\*\* `\[\~]` — modèle `Tenant` présent, RLS à ajouter

3\. \*\*Traçabilité IA\*\* `\[OK]` — `AuditLog`, `AIUsageLog`, `UsageRecord`

4\. \*\*RGPD par défaut\*\* `\[\~]` — `UserConsent`, `ArchivePolicy` présents

5\. \*\*Sources juridiques vérifiables\*\* `\[\~]` — routes Légifrance, à auditer qualité



\### Ce que MemoLib n'est pas

\- Pas MemoLibDev (outil de dev, projet distinct)

\- Pas un générateur d'actes autonome (validation humaine requise)

\- Pas (encore) une plateforme ouverte (pas d'API publique, pas de marketplace)



\---



\## S2 — Périmètre fonctionnel



| Domaine | Statut | Source |

|---|---|---|

| Clients (CRUD, coordonnées) | `\[OK]` | Prisma `Client` + `/api/clients/\*` |

| Dossiers (workflow, timeline, checklist) | `\[OK]` | Prisma `Dossier` + `/api/dossiers/\*` |

| Courriels (IMAP, webhook, dédup SHA256, IA) | `\[OK]` | Prisma `Email` + `/api/emails/\*` |

| Documents (upload, OCR, génération DOCX) | `\[\~]` | Prisma `Document` + `/api/documents/\*` |

| Échéances (détection IA, alertes) | `\[OK]` | Prisma `LegalDeadline` + `/api/cron/\*` |

| IA juridique (résumé, brouillon, classification) | `\[\~]` | `/api/ai/\*` |

| Recherche Légifrance | `\[\~]` | `/api/legifrance/\*` + `/api/jurisprudence/\*` |

| Comptabilité (écritures, TVA, CARPA, FEC) | `\[OK]` | Prisma `Ecriture`, `Journal` + `/api/comptabilite/\*` |

| Facturation (factures, paiements, Stripe) | `\[OK]` | Prisma `Facture`, `Subscription` + `/api/factures/\*` |

| Sécurité (RBAC 9 rôles, multi-tenant, audit chain) | `\[OK]` | Prisma `AuditLog` + middleware |

| RGPD (consentement, suppression, export) | `\[\~]` | Prisma `UserConsent`, `ArchivePolicy` |

| Portail client | `\[HYP:STUB]` | `/api/client/\*` (non mentionné README) |

| Marketplace templates | `\[\~]` | Prisma `CommunityTemplate` |

| Workflows | `\[\~]` | Prisma `WorkflowExecution` |

| Multichannel (SMS, WhatsApp) | `\[\~]` | `/api/multichannel/\*` |

| Signatures électroniques | `\[\~]` | `/api/signatures/\*` |

| Workspace reasoning | `\[\~]` | `/api/workspace-reasoning/\*` |



\### Hors périmètre (Roadmap)

\- Application mobile React Native → `\[PLAN]`

\- Marketplace intégrations → `\[PLAN]`

\- Transcription audio audiences → `\[PLAN]`

\- Collaboration inter-cabinets → `\[PLAN]`

\- Agents IA autonomes → `\[PLAN]`



\---



\## S3 — Parcours utilisateurs



\### Parcours 1 — Avocat traite un email `\[OK]`

1\. Email arrive (webhook inbound) → 2. Dédup SHA256 → 3. Analyse IA auto (client, urgence, type, deadline) → 4. Notification avocat → 5. Inbox priorisée → 6. \*\*Clic "Email→Dossier"\*\* → 7. Champs pré-remplis → 8. Détection IA deadline → 9. Validation avocat



\*\*Points contrôle humain\*\* : validation client, validation deadline, aucune réponse auto



\### Parcours 2 — Échéance OQTF `\[\~]`

1\. Cron J-7 → 2. Email alerte → 3. Avocat ouvre échéance → 4. Consulte pièces → 5. Lance génération recours IA → 6. Brouillon → 7. \*\*Avocat relit/modifie/valide\*\* → 8. Génération DOCX → 9. Envoi → 10. Marque traitée



\### Parcours 3 — Assistant trie inbox `\[\~]`

1\. Inbox priorisée → 2. Filtre urgence/type → 3. Rattache email/dossier → 4. Création dossier rapide → 5. \*\*Aucune validation d'acte (rôle limité)\*\*



\### Parcours 4 — Client consulte son dossier `\[HYP:STUB]`

1\. Connexion portail → 2. Dashboard (dossiers, documents, factures) → 3. Consulte dossier → 4. Dépose document → 5. Envoie message → 6. Notification réponse



\### Parcours 5 — Super-admin `\[\~]`

Stats multi-cabinets, gestion tenants, plans, coûts IA, conformité RGPD, support



\### Parcours 6 — Recherche jurisprudence `\[\~]`

Recherche → Légifrance PISTE → Résultats + CESEDA → Copie référence dans doc

\*\*Point critique\*\* : l'avocat doit vérifier la source avant citation



\### Parcours 7 — Facturation `\[\~]`

Time-tracking → Génération facture → PDF → Enregistre paiement → Export FEC → TVA → CARPA



\---



\## S4 — Exigences non-fonctionnelles



\### Sécurité

\- \*\*RBAC 9 rôles\*\* (SUPER\_ADMIN → CLIENT) `\[OK]`

\- \*\*Multi-tenant strict\*\* `\[\~]` — \*\*RLS PostgreSQL absent\*\* 🔴 (D15)

\- \*\*Audit trail chaîné\*\* `\[OK]` — hash chain effectif dans `src/lib/security/audit-trail.ts:66`

\- \*\*Rate limiting\*\* (Upstash + fallback) `\[OK]`

\- \*\*Antivirus ClamAV\*\* `\[\~]`

\- \*\*Auth\*\* `\[migration partielle Clerk]` — Clerk v5 en cours (D03)

\- \*\*2FA\*\* `\[\~]`



\### RGPD

\- Consentement `\[OK]` — Prisma `UserConsent`

\- Droit à l'oubli `\[\~]` — `/api/compliance/delete`

\- Portabilité `\[\~]` — `/api/compliance/export`

\- Durées conservation `\[HYP]` — `ArchivePolicy` présent, valeurs inconnues

\- Hébergement UE `\[\~]` — Neon + Vercel (régions à confirmer)

\- Chiffrement colonnes PII `\[PLAN]` 🔴



\### Performance (aucune mesure)

P95 API < 500ms `\[PLAN]`, IA P95 < 5s `\[PLAN]`, TTI < 3s `\[PLAN]`, bundle < 500Ko `\[PLAN]`



\### Disponibilité

SLA 99,5% `\[PLAN]`, RTO < 4h `\[PLAN]`, RPO < 1h `\[PLAN]`, backups Neon `\[OK]` auto, test restauration `\[PLAN]`



\### Observabilité

Logs `\[\~]`, métriques business `\[\~]`, Sentry `\[OK]`, traces distribuées `\[PLAN]`, alertes `\[PLAN]`



\### Accessibilité

WCAG 2.1 AA `\[PLAN]` — \*\*aucun audit\*\* (obligation légale site public)



\---



\## S5 — Risques et inconnues



\### Risques critiques 🔴

\- \*\*R1 Fuite inter-cabinet\*\* — RLS absent → filtrage applicatif seul. Impact : violation RGPD. Mitigation : activer RLS avant pilote.

\- \*\*R2 Audit chain partiel\*\* — hash chain implémenté, mais écriture effective à vérifier par trigger.

\- \*\*R3 Migration Clerk non finalisée\*\* — NextAuth + Clerk cohabitent. Risque session cassée en prod.

\- \*\*R4 Aucune mesure perf\*\* — dégradation probable à l'échelle.

\- \*\*R5 Tests "4463 passing" non vérifié\*\* — badge déclaratif.



\### Risques importants 🟠

\- R6 IA dépendante Ollama local

\- R7 Légifrance dépendant PISTE

\- R8 Aucun audit WCAG

\- R9 300+ routes avec orphelines probables

\- R10 Snapshot DB non testé (RTO inconnu)



\### Dépendances externes (11)

Neon, Vercel, Clerk, Ollama, PISTE, SendGrid/Resend, Upstash, Azure Blob, Stripe, Sentry, ClamAV



\### Inconnues à lever

U1 : Auth Clerk vs NextAuth (6 matches, relance nécessaire) · U2 : RLS absent ✅ · U3 : hash chain ✅ effectif · U4 : tests réels · U5 : couverture · U6 : templates DOCX · U7 : portail client · U8 : port 5078 vs 3000



\### Décisions ouvertes

D1 : Module comptable MVP ou extension ? · D2 : Portail client livré/stub/plan ? · D3 : Migration Clerk quand ? · D4 : RLS activer quand ? · D5 : Tests bloquants CI ?



\---



\*\*FIN PRD MemoLib — version 0.1.1\*\*

