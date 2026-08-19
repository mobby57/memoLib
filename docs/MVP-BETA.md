# 🎯 MemoLib — MVP Beta (Scope Client)

## Date : 2026-07-29
## Objectif : Accueillir 2-3 cabinets pilotes sur le cœur métier

---

## ✅ FEATURES ACTIVÉES (Production-ready, E2E testées)

### Core Business
| Feature | Statut E2E | Notes |
|---------|-----------|-------|
| **Login / Register / Reset password** | ✅ Testé | NextAuth + credentials |
| **Dashboard avocat** | ✅ Smoke testé | KPI, alertes, activité récente |
| **Gestion Clients** (CRUD) | ✅ Navigation testée | Création, édition, liste |
| **Gestion Dossiers** (CRUD) | ✅ API testée | Numérotation auto, workflow statut |
| **Email → Dossier (1 clic)** | ✅ API testé (forte assertion) | Le "wow moment" |
| **IA : Résumé email** | ✅ API testé (forte assertion) | Urgence, type, client, deadline |
| **IA : Brouillon réponse** | ✅ API testé | Ton, sujet, corps |
| **Génération documents** | ✅ API testé (forte assertion) | 6 templates juridiques |
| **Recherche jurisprudence** | ✅ API testé | Légifrance / Judilibre / local |
| **Délais légaux + alertes** | ✅ Cron configuré | J-7, J-3, J-1 |
| **Timeline dossier** | ✅ Route existante | Emails + docs + deadlines |
| **Upload documents** | ✅ Route protégée | Antivirus ClamAV |
| **Onboarding wizard** | 🟡 Indirect | Guide pas-à-pas |

### Sécurité & Compliance
| Feature | Statut |
|---------|--------|
| RBAC (9 rôles) | ✅ Unitaire testé |
| Multi-tenant isolation | ✅ Middleware + index |
| Audit trail (hash chain) | ✅ Unitaire testé |
| Rate limiting | ✅ Upstash |
| Security headers | ✅ E2E testé |
| Chiffrement emails | ✅ AES-256-GCM |

### Infrastructure
| Feature | Statut |
|---------|--------|
| CI/CD (13 workflows) | ✅ |
| Vercel CDG1 (Paris) | ✅ |
| Sentry monitoring | ✅ |
| Health endpoint | ✅ E2E testé |
| Crons (deadline alerts) | ✅ |

---

## 🔴 FEATURES DÉSACTIVÉES (Feature-gated, code réel conservé)

> Ces modules ont du code fonctionnel mais **aucun test E2E**. Ils sont bloqués
> par le middleware via des variables d'environnement (`FEATURE_X=true` pour activer).

| # | Module | Routes | Env var | Raison |
|---|--------|--------|---------|--------|
| 1 | **Comptabilité** | `/api/comptabilite/*` (11 routes) | `FEATURE_COMPTABILITE` | Domaine réglementé, 0 test, nécessite validation expert-comptable |
| 2 | **Multi-canal** | `/api/multichannel/*` | `FEATURE_MULTICHANNEL` | Dépendance Twilio non configurée, 0 E2E |
| 3 | **Voice** | `/api/voice/transcribe` | `FEATURE_VOICE` | Dépend Ollama Whisper, fallback basique |
| 4 | **OCR** | `/api/ocr/extract` | `FEATURE_OCR` | Tests placeholder (`expect(true).toBe(true)`) |
| 5 | **GitHub** | `/api/github/*` (3 routes) | `FEATURE_GITHUB` | Non pertinent pour les avocats en beta |
| 6 | **Azure** | `/api/azure/*` (3 routes) | `FEATURE_AZURE` | Redondant avec Vercel Blob, non configuré |
| 7 | **Calendar Sync** | `/api/calendar/google-sync`, `/api/calendar/sync` | `FEATURE_CALENDAR_SYNC` | OAuth complexe, 0 E2E |
| 8 | **IA Avancée** | `/api/ai/copilot/*`, predict, strategy, recours... | `FEATURE_AI_ADVANCED` | Dépend Ollama non dispo en prod Vercel |
| 9 | **Forms** | `/api/forms/approvals`, resource-request... | `FEATURE_FORMS` | Feature interne, 0 E2E |
| 10 | **Questionnaire** | `/api/questionnaire/*` | `FEATURE_QUESTIONNAIRE` | 0 test |
| 11 | **Super-Admin** | `/api/super-admin/*` | `FEATURE_SUPER_ADMIN` | Panel interne, pas pour clients |
| 12 | **Subscriptions** | `/api/subscriptions/*` | `FEATURE_SUBSCRIPTIONS` | Beta = plan gratuit, pas de Stripe |
| 13 | **Workspace Reasoning** | `/api/workspace-reasoning/*` | `FEATURE_WORKSPACE_REASONING` | Complexe, tests conditionnels |

### 🗑️ Stubs SUPPRIMÉS (code mort)

Ces routes ne contenaient que 5 lignes retournant "coming soon". Supprimées :
- ~~`/api/integrations/ants`~~
- ~~`/api/integrations/rpva/deposit`~~
- ~~`/api/integrations/telerecours`~~
- ~~`/api/ai/veille-juridique`~~

---

## 🎯 Parcours Client Beta (à tester E2E)

```
1. Inscription → Choix plan "Beta gratuit" → Onboarding wizard
2. Créer un premier client (nom, prénom, email, téléphone)
3. Recevoir/coller un email → IA analyse → Résumé structuré
4. "Créer dossier" en 1 clic depuis l'email
5. Ajouter des pièces au dossier (upload)
6. Voir les délais légaux auto-calculés (OQTF = 48h, titre séjour = 4 mois...)
7. Générer un document juridique (accusé réception, recours...)
8. Rechercher de la jurisprudence pertinente
9. Voir la timeline complète du dossier
```

---

## 📋 Actions techniques pour le lancement

### Priorité 1 — Bloquant
- [ ] Créer un feature flag / middleware pour désactiver les modules beta-excluded
- [ ] Écrire un test E2E complet du parcours client beta (9 étapes ci-dessus)
- [ ] Vérifier que `npm run test:ci` passe à 100% (pas de fallback `|| echo`)
- [ ] Configurer un plan "Beta Gratuit" en BDD (seed)
- [ ] Tester le flow avec Ollama OFF (vérifier que le fallback regex fonctionne correctement)

### Priorité 2 — Important
- [ ] Créer une documentation utilisateur (guide PDF ou page `/aide`)
- [ ] Mettre en place un canal support (email ou chat)
- [ ] Ajouter un feedback widget dans l'app
- [ ] Monitoring : alertes Sentry sur erreurs 500 + latence > 3s
- [ ] Backup automatique quotidien de la BDD

### Priorité 3 — Nice to have
- [ ] Status page publique (uptime)
- [ ] Vidéo de démo (2 min)
- [ ] Formulaire NPS post-première semaine
- [ ] Registre CNIL / DPO (obligatoire mais pas bloquant J1)

---

## 🚀 Timeline estimée

| Semaine | Action |
|---------|--------|
| S1 (maintenant) | Feature flags + test E2E parcours + fix CI |
| S2 | Doc utilisateur + seed beta + monitoring |
| S3 | Onboarding 2-3 cabinets pilotes |
| S4+ | Itérations sur feedback |
