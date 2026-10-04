# MemoLib — Vision produit : le dossier unifié numérique ↔ papier

> Produit par audit en lecture seule. Aucune ligne de code MemoLib modifiée.
> Ce document capture le CAP (le "pourquoi" différenciant) et le sépare de la SÉQUENCE
> d'exécution. Règle de séquençage : **débloquer l'accès au produit AVANT d'enrichir la vision.**

---

## 1. Le positionnement (plus fort que "ChatGPT pour avocats")

> **MemoLib : le système de protection et de traçabilité du dossier juridique,
> du numérique au papier.**

Ne pas supprimer le papier — **supprimer la frontière** entre papier et numérique.
Problèmes adressés simultanément : organisation, perte d'information, pièces, délais,
versions, traçabilité, préparation, collaboration, archivage, passage numérique↔papier.

**Règle absolue (non négociable, = crédibilité juridique) :**
Un agent peut *surveiller, classer, détecter, comparer, alerter, préparer, proposer*.
**L'avocat décide.** Aucun agent ne : prend une décision juridique définitive ; affirme
un délai acquis sans vérification ; envoie un acte sensible automatiquement ; modifie
silencieusement une pièce ; garantit une preuve qu'il ne peut pas garantir.
Distinction permanente : **événement constaté ≠ événement supposé.**

---

## 2. DÉCOUVERTE MAJEURE : la vision est déjà codée à ~70-80 %

Vérifié dans le code pendant l'audit :

| Brique de la vision | Fichier(s) réels | État |
|---|---|---|
| Agent Preuve (horodatage, eIDAS, bundle opposable) | `lib/services/legal-proof.service.ts`, `eidas-signature.service.ts`, `rfc3161-timestamp.service.ts`, modèle `legalProof` | **Existe** — RFC 3161 + eIDAS |
| Journal d'événements immuable | `lib/services/event-log.service.ts` (checksum SHA-256, immuable) | **Existe** |
| Audit chaîné (hash chain) | `lib/security/audit-trail.ts` (SHA-256 de l'entrée précédente, 19 tests) | **Existe** |
| Chronologie du dossier | `api/dossiers/timeline`, `api/audit/timeline/[entityType]/[entityId]` | **Existe** |
| Copilote juridique spécialisé | `lib/ai/copilot/copilot-ceseda.ts` (32 occurrences), `ceseda-intake.ts` | **Existe** |
| Mode confidentiel / IA locale | `lib/security/confidential-mode.ts` (bloque cloud, fail-safe) | **Existe** |
| Email → dossier → tâches | `api/emails/create-dossier`, `dossier.service.ts` | **Existe** |
| Détection délais | `lib/services/deadlineExtractor.ts` (46+ tests) | **Existe, mûr** |
| Export PDF dossier (passerelle papier) | `lib/documents/dossier-pdf-export.ts` | **Existe** |

**Le vocabulaire du code est déjà prudent** (« compatible RFC 3161/eIDAS », pas « preuve
incontestable ») — cohérent avec la règle absolue du §1.

**Ce qui n'existe PAS encore** (les vrais incréments de la vision) :
- "Impression comme événement du dossier" (workflow préparer→contrôler→imprimer→confirmer→journaliser).
- Vue "Dossier contradictoire" (checklist avant audience : pièces/versions/chronologie).
- Agent Cohérence ("ce document semble appartenir au dossier X mais n'est rattaché à aucun").

---

## 3. Le constat qui commande la séquence

```
         VISION DÉJÀ CODÉE À ~70-80 %  (preuve, timeline, copilote, IA locale)
                              │
          ┌───────────────────┴───────────────────┐
          │  MUR D'ACCÈS (non résolu)              │
          │  1 inscription cassée (hors Clerk)     │
          │  2 connexion email hors onboarding     │
          │  3 funnel non mesuré                   │
          └───────────────────┬───────────────────┘
                              │
                           AVOCAT  (ne peut pas entrer)
```

**Risque n°1 : enrichir la vision pendant que la porte reste fermée.** Ce serait répéter
le schéma d'origine (moteur riche + entrée cassée). Donc :

---

## 4. Séquence d'exécution (ordre impératif)

**ÉTAPE 1 — Débloquer l'accès (lot "démo-ready")** → cf. `SPEC_FIX_FUNNEL_P0_P1.md`
P0 inscription Clerk + P2 connexion email dans l'onboarding + P1 unification auth.
Résultat : l'avocat atteint la valeur DÉJÀ présente (email→dossier→délai→action→validation).

**ÉTAPE 2 — Mesurer** (P3) : table `AnalyticsEvent` + events funnel.
Résultat : on sait où ça perd, on peut viser 1→5→20 cabinets de façon mesurée.

**ÉTAPE 3 — Première vente** : démo du parcours complet au prospect avocat → 2 questions
terrain (« l'utiliseriez-vous ? » / « à quelles conditions paieriez-vous ? »).

**ÉTAPE 4 — SEULEMENT APRÈS — enrichir la vision** (incréments du §2 non codés) :
1. Vue "Dossier contradictoire" (capitalise sur `timeline` + `legal-proof` existants).
2. "Impression comme événement" (ajoute un `eventType` au `event-log.service` existant).
3. Agent Cohérence (surveillance rattachement pièces↔dossier).

Chaque incrément de l'étape 4 **réutilise** l'ossature déjà présente (event-log, audit-trail,
timeline) — faible coût, forte valeur, car les fondations probatoires existent.

---

## 5. Dev OS = machine interne, pas produit à vendre maintenant

Le pipeline (AI / Research / Tests → Critic → Sandbox → Human approval) sert à **construire
MemoLib moins cher**, notamment les agents de l'étape 4. Ne pas le commercialiser tant que
MemoLib n'a pas ses premiers clients payants.

---

## 6. Décision & prochaine action

- Vision validée comme **cap produit différenciant**.
- Séquence validée : accès → mesure → vente → enrichissement vision.
- Prochaine action (sans toucher au code) : décomposer le lot "démo-ready" (étape 1) en
  **missions Dev OS** (impact produit + business + contraintes + mesure + tests).
```