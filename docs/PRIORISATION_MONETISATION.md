# MemoLib — Priorisation par valeur commerciale (2026)

> Produit par audit en lecture seule. Aucune ligne de code MemoLib modifiée.
> Principe directeur (validé) : **sélectionner les technos par ce qu'elles permettent de
> monétiser, pas par curiosité technique.** Vendre le RÉSULTAT, pas « l'IA ».
> Décision validée : Option A (tout Clerk) de `SPEC_FIX_FUNNEL_P0_P1.md`.

---

## 1. Découverte clé de l'audit

**Les 6 zones monétisables que tu identifies existent DÉJÀ dans le code.**
Le problème n'est pas de les construire — c'est de les rendre **atteignables et démontrables**.

| Zone (ta grille) | Potentiel | État dans le code (vérifié) |
|---|---|---|
| 🥇 Email → dossier → tâches | ⭐⭐⭐⭐⭐ | `api/emails/create-dossier`, `dossier.service.ts`, test de route dédié — **existe** |
| 🥇 Copilote juridique spécialisé (CESEDA) | ⭐⭐⭐⭐⭐ | `lib/ceseda/dossier-service.ts`, `ceseda-analyzer.ts`, `ceseda-deadlines.ts` — **existe** |
| 🥇 Détection urgences / délais | ⭐⭐⭐⭐⭐ | `deadlineExtractor.ts` + **46+ cas de tests** — composant le plus mûr |
| 🥈 Gestion documentaire intelligente | ⭐⭐⭐⭐ | `documentAnalysisService.ts`, OCR `api/ocr/extract` — existe |
| 🥈 IA locale / confidentielle | ⭐⭐⭐⭐ | `confidential-mode.ts` : bloque le cloud si `confidentialMode`, fail-safe `isConfidential:true` — **existe et défendable** |
| 🥈 Workflow cabinet | ⭐⭐⭐⭐ | `advanced-workflow-engine.ts`, `workflow-engine.ts` — existe |
| 🥉 Assistant généraliste / chatbot | ⭐–⭐⭐ | présent mais **non prioritaire** — ne pas mettre en avant |

**Conclusion : problème d'ACCÈS au produit, pas de produit.** Le coût pour débloquer la
vente est faible comparé à la valeur déjà présente.

---

## 2. Le mur entre la valeur et le client (les 3 jointures cassées)

```
          VALEUR DÉJÀ CONSTRUITE (🥇🥇🥇)
                      │
   ┌──────────────────┴──────────────────┐
   │   MUR  (ce qui bloque la vente)       │
   │                                       │
   │  1. Inscription cassée (hors Clerk)   │ ← l'avocat n'entre pas
   │  2. Connexion email hors onboarding   │ ← le pipeline ne démarre jamais
   │  3. Aucune mesure du funnel           │ ← on ne sait pas où ça perd
   └───────────────────────────────────────┘
                      │
                   AVOCAT
```

Tant que ce mur tient, aucune des 6 zones ne génère un centime, quelle que soit sa qualité.

---

## 3. Argument commercial par zone (vendre le résultat)

| Zone | Ne pas dire | Dire (résultat) |
|---|---|---|
| Email→dossier | « IA multi-modèles » | « Ne laissez plus passer une info importante dans votre boîte mail. » |
| Délais | « extraction NLP de dates » | « MemoLib vous signale les éléments qui demandent votre attention. » |
| CESEDA | « LLM fine-tuné » | « Un copilote qui connaît les procédures OQTF/CESEDA, sous votre contrôle. » |
| IA locale | « 100 % sécurisé » (❌ promesse interdite) | « Pour vos dossiers sensibles, l'analyse peut rester locale, sans transmission cloud. » |

⚠️ Sur l'IA locale : le code autorise la promesse (`confidential-mode.ts` bloque réellement
le cloud), mais formuler **prudemment** — « pour les traitements compatibles avec votre
configuration », jamais « 100 % sécurisé ». Human-in-the-loop partout.

---

## 4. Objectif minimal viable commercial (ta cible)

```
avocat crée son compte → connecte sa messagerie → MemoLib traite un 1er flux
→ il voit une valeur qu'il n'avait pas avant
```

Pour y arriver, UNIQUEMENT le lot « démo-ready » est requis (rien de plus) :

| Priorité | Action | Débloque |
|---|---|---|
| P0 | Réparer inscription Clerk + provisioning webhook | l'avocat entre |
| P2 | Étape « Connecter Gmail/Outlook » dans l'onboarding | le pipeline 🥇 démarre |
| P1 | Unifier les pages d'auth | supprime l'effet « bricolé » |

Puis P3 (mesure) pour prouver la répétabilité :
```
1 avocat → 1 cabinet → 5 → 20 → 100   (mesuré, pas supposé)
```

**Ce qui N'EST PAS prioritaire maintenant** : nouvelles features IA, assistant généraliste,
Dev OS en tant que produit. Le Dev OS reste une **machine interne** pour construire moins cher.

---

## 5. Modèle de revenus — aligné sur l'existant

Déjà dans le code (`saas-provisioning.ts` `PLAN_CONFIG`, `SaasSignupForm`, Stripe) :
- Plans SOLO / CABINET / ENTERPRISE avec quotas (dossiers, sièges, stockage, IA).
- Trial 14j, `createCheckoutSession`, `activateAfterPayment` (webhook Stripe).

Leviers de revenus compatibles avec le multi-tenant + quotas existant :
`abonnement + sièges + volume de traitement + premium + intégrations + offre Cabinet/Entreprise`.

⚠️ **À trancher avant toute démo tarifaire** : incohérence de prix entre `auth/register`
(SOLO 89€ / CABINET 69€) et `SaasSignupForm` (SOLO 29€ / CABINET 79€). Le prix final doit
venir de la **validation terrain** (« à quelles conditions paieriez-vous ? »), pas d'un
choix arbitraire.

---

## 6. Décision prise & prochaine action

- ✅ Option A (tout Clerk) validée.
- ✅ Stratégie : prioriser par valeur commerciale, débloquer l'accès avant d'ajouter des features.

**Prochaine action proposée (sans toucher au code) :** décomposer le lot « démo-ready »
(P0+P2+P1) en missions Dev OS au format *impact produit + impact business + contraintes +
mesure + tests*, prêtes pour le pipeline multi-agents. Puis spécifier P3 (mesure).
```