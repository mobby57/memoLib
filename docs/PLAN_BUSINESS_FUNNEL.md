# Plan business MemoLib — De « ça marche » à « premier client payant »

> Document stratégique produit par audit en lecture seule. Aucune ligne de code MemoLib modifiée.
> Il relie les **faits techniques vérifiés** (voir `SPEC_FIX_FUNNEL_P0_P1.md`) aux **priorités business**.
> Toutes les valeurs de prix/volumes sont des **simulations**, pas des prévisions de vente.

---

## 1. Thèse

Le risque n°1 de MemoLib n'est pas technique, il est **commercial et il est déjà dans le code** :
le parcours d'inscription principal est cassé (user créé hors Clerk → impossible de se
reconnecter). Un prospect avocat qui s'inscrit vit aujourd'hui :

```
visiteur → inscription → compte créé → /dashboard protégé → rejet → écran de login
         → mot de passe refusé → abandon
```

Donc **avant de parler de prix, de plans ou de 100 clients, il faut que le premier avocat
puisse aller de la landing jusqu'à la première valeur sans accroc.** C'est la condition
d'existence d'une démo commerciale crédible.

Priorité (identique à ta liste) :
```
1 Acquisition → 2 Inscription pro → 3 Onboarding → 4 Première valeur
→ 5 Tracking → 6 Activation → 7 Rétention → 8 Conversion payante → 9 Features
```
**Et pas l'inverse.**

---

## 2. Le funnel business mappé sur le code réel

| # | Étape business | État technique (vérifié) | Bloquant vente ? |
|---|---|---|---|
| 1 | Visiteur comprend MemoLib | Landing claire (`landing/page.tsx`) : valeur, cible, RGPD, « prêt en 2 min » | Non — bon état |
| 2 | « Ça peut me faire gagner du temps » | 5 questions business en partie couvertes (voir §4) | Partiel |
| 3 | Inscription | **CASSÉ** : `SaasSignupForm` crée hors Clerk | 🔴 OUI — critique |
| 4 | Expérience pro | 4 systèmes d'auth concurrents → impression bricolée | 🔴 OUI |
| 5 | Onboarding | `OnboardingFlow` correct MAIS démarre après la rupture | 🟠 |
| 6 | Connexion Gmail/Outlook | OAuth existe (`api/email/connect/gmail`) mais **hors onboarding** | 🔴 OUI — c'est LA valeur |
| 7 | Première valeur (« MemoLib comprend mes emails ») | Moteur IA présent (résumé, dossier 1-clic) | Non — existe |
| 8 | Activation | Non mesurée | 🟠 |
| 9 | Rétention / Abonnement | Stripe présent, trial 14j câblé dans `saasSignup` | 🟠 |

**Lecture business :** la chaîne de valeur est présente de bout en bout (points 1, 7, 9
existent). Ce qui tue la conversion, ce sont les **jointures** 3-4-6. Ce sont des défauts
peu coûteux à corriger par rapport à leur impact commercial.

---

## 3. La mesure : aujourd'hui MemoLib est aveugle (mais presque câblé)

Faits vérifiés :
- `src/app/api/analytics/abandon/route.ts` **existe** mais contient
  `// TODO: persister dans une table analytics` → **rien n'est stocké**.
- Le modèle `analyticsEvent` est **commenté** (n'existe pas en base).
- Aucun PostHog/Segment/Amplitude actif. Sentry = erreurs, pas conversion.
- Seul indicateur : `/api/onboarding/status` déduit l'état via `COUNT` Prisma
  (client/email/dossier) — c'est un état, pas un funnel.

**Donc le tableau que tu proposes (1000 visiteurs → … → 30 actifs) n'est pas mesurable
aujourd'hui.** Il le devient avec un effort modéré car l'amorce est là.

### Funnel à instrumenter (événements)
| Étape | Event | Où le déclencher (code) |
|---|---|---|
| Visite landing | `landing_viewed` | `landing/page.tsx` |
| Clic CTA | `signup_cta_clicked` | CTA landing |
| Début inscription | `signup_started` | `<SignUp/>` Clerk |
| Compte créé | `signup_completed` | webhook Clerk `user.created` |
| Email vérifié | `email_verified` | webhook Clerk |
| Cabinet provisionné | `cabinet_provisioned` | `provisionFromClerk` |
| Onboarding vu | `onboarding_viewed` | `dashboard/page.tsx` |
| Messagerie connectée | `email_connected` | `gmail/callback` + `outlook/callback` |
| 1er email analysé | `first_email_analyzed` | pipeline IA inbound |
| 1er dossier créé | `first_dossier_created` | création dossier |
| Activation | `activated` (règle : messagerie connectée + 1 email analysé) | job/compute |
| Passage payant | `subscription_started` | webhook Stripe (existe déjà) |

Mesure minimale (sans SaaS tiers, RGPD-friendly) : créer la table `AnalyticsEvent`
(déjà anticipée dans le TODO) + finir la route `analytics/abandon` + un petit helper
`track(event, {step, success, durationMs})`. **Aucune donnée juridique dans les events**,
uniquement des métadonnées de parcours (cohérent avec le positionnement RGPD de la landing).

---

## 4. L'UI d'inscription comme pièce business (tes 5 questions)

| Question | Où c'est traité | Gap |
|---|---|---|
| Qui est MemoLib ? | Landing hero | OK |
| Pour qui ? | Landing (« conçu par et pour les avocats ») | Élargir : notaires/huissiers/juristes si c'est la cible |
| Quelle valeur ? | « analyse emails, crée dossiers, détecte deadlines » | OK, fort |
| Est-ce sécurisé ? | « RGPD natif, chiffré, local-first » | OK — atout de vente majeur sur cible juridique |
| Que se passe-t-il après inscription ? | **Peu explicite** | 🟠 Ajouter un « voici les 3 prochaines étapes » visible AVANT de s'inscrire |

Recommandation : afficher le post-inscription dès la landing/signup :
`Créez votre espace → connectez votre messagerie → MemoLib analyse votre 1er email`.
Ça réduit l'anxiété et augmente le passage à l'inscription (étape 2→3).

---

## 5. La démo commerciale pour le premier client payant

Tu as raison : chercher **1 client payant** avant 100. Le parcours de démo que tu décris
est **déjà faisable techniquement sauf les jointures cassées**. Pour le rendre présentable
à ton prospect avocat, l'ordre de correction est :

**Lot « Démo-ready » (débloque la vente)**
1. P0 — réparer inscription Clerk + provisioning par webhook (cf. spec dédiée).
2. P2 — ajouter l'étape « Connecter Gmail/Outlook » DANS l'onboarding (c'est le cœur de la démo).
3. P1 — unifier les pages d'auth (supprime l'impression bricolée).

Après ce lot, la démo de bout en bout tient :
```
compte → cabinet → connexion Gmail → email reçu → analyse → client identifié
→ dossier proposé → délai détecté → action proposée → validation avocat → gain de temps
```
Puis les 2 questions terrain que tu proposes : « l'utiliseriez-vous ? » / « à quelles
conditions paieriez-vous ? » → c'est ça qui fixe le prix, pas 49/99/149 au hasard.

**Lot « Mesure » (prouve la répétabilité)**
4. P3 — instrumenter le funnel (table + events ci-dessus).
5. Dashboard funnel interne (réutiliser `analyticsService` qui fait déjà de la régression).

---

## 6. Modèle économique — ce qui est DÉJÀ dans le code

Les plans existent déjà (ne pas réinventer) :
- `SaasSignupForm` : SOLO 29€ / CABINET 79€ / ENTERPRISE 199€ (mensuel), -20% annuel.
- `saas-provisioning.ts` `PLAN_CONFIG` : quotas par plan (dossiers, users, stockage, IA).
- Stripe : `createCheckoutSession`, trial 14j, `activateAfterPayment` via webhook.

⚠️ Incohérence de prix à trancher : la page `auth/register` affiche d'autres prix
(SOLO 89€, CABINET 69€…) que `SaasSignupForm`. À unifier avant toute démo tarifaire —
sinon le prospect voit deux prix différents selon la page.

Les leviers de revenus que tu listes (abonnement + sièges + volume + premium + intégrations
+ offres Cabinet/Entreprise) sont compatibles avec le modèle multi-tenant + quotas déjà
présent. L'« usage billing » est mentionné dans le README comme livré — à vérifier avant
de le vendre.

---

## 7. MemoLib Dev OS — formuler les missions en « impact produit + business + tests »

Ton intuition est la bonne : traiter chaque évolution comme une mission mesurable plutôt
qu'une tâche de code. Format de mission proposé :

```
MISSION    : Débloquer l'inscription et rendre la démo présentable
IMPACT PRODUIT  : un avocat va de la landing à la 1re valeur sans accroc
IMPACT BUSINESS : conversion inscription↑, démo commerciale possible → 1er client payant
CONTRAINTES     : ne pas casser Clerk / OAuth / règles juridiques / human-in-the-loop
PÉRIMÈTRE       : P0 + P2 + P1 (lot démo-ready)
MESURE          : events signup_completed, email_connected, first_email_analyzed
TESTS           : E2E Playwright du parcours complet (@clerk/testing dispo)
VALIDATION      : humaine, avant merge
```

Le pipeline multi-agents que tu décris (UX / code / sécurité / funnel → critic → tests →
proposition → validation humaine) s'applique bien ici : chaque lot ci-dessus est une
mission avec critères de succès vérifiables.

---

## 8. Prochaine action recommandée

Avant tout développement, un seul arbitrage de ta part :
**valide-t-on l'Option A (tout Clerk) de `SPEC_FIX_FUNNEL_P0_P1.md` ?**

Si oui, l'ordre d'exécution en sandbox est : lot Démo-ready (P0→P2→P1), puis lot Mesure (P3),
puis seulement ensuite les features IA additionnelles. Rien n'est touché tant que tu n'as
pas validé.
