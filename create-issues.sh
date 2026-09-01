#!/bin/bash
set -euo pipefail

if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) n'est pas installé."
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "🔑 Connecte-toi d'abord avec : gh auth login"
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
  echo "❌ Impossible de déterminer le dépôt courant."
  exit 1
fi
echo "📦 Dépôt : $REPO"

MILESTONE="Audit juridique - 2026-09"

# Créer le jalon s'il n'existe pas (en utilisant l'API pour récupérer l'ID, mais on n'en a pas besoin)
MILESTONE_EXISTS=$(gh api repos/$REPO/milestones --jq ".[] | select(.title==\"$MILESTONE\") | .title" 2>/dev/null || echo "")
if [ -z "$MILESTONE_EXISTS" ]; then
  echo "📌 Création du jalon '$MILESTONE'..."
  gh api repos/$REPO/milestones -X POST -f title="$MILESTONE" -f description="Issues issues de l'audit juridique du 31/08/2026" -f state="open" > /dev/null
fi

# ─── Création des labels manquants ──────────────────────
echo "🏷️  Vérification et création des labels..."
LABELS=(
  "bug:Problème dans le code"
  "critical:Impact critique (P0)"
  "feature:Nouvelle fonctionnalité"
  "ai:Intelligence artificielle"
  "reliability:Fiabilité"
  "enhancement:Amélioration"
  "compliance:Conformité"
  "rgpd:RGPD"
  "audit:Audit"
  "testing:Tests"
  "quality:Qualité"
  "documentation:Documentation"
  "onboarding:Prise en main"
  "legal:Droit / juridique"
)

for label in "${LABELS[@]}"; do
  name="${label%%:*}"
  desc="${label##*:}"
  if ! gh label list --repo "$REPO" --json name --jq ".[] | select(.name==\"$name\")" | grep -q "$name"; then
    echo "  ➕ Création du label : $name"
    gh label create "$name" --repo "$REPO" --description "$desc" --color "ededed" || true
  else
    echo "  ✅ Label existe déjà : $name"
  fi
done

TMP_DIR=$(mktemp -d)
echo "📁 Dossier temporaire : $TMP_DIR"

create_issue() {
  local title="$1"
  local labels="$2"
  local body="$3"
  local tmp_body="$TMP_DIR/body.txt"

  echo "$body" > "$tmp_body"

  echo "📝 Création : $title"
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body-file "$tmp_body" \
    --label "$labels" \
    --milestone "$MILESTONE" \
    --assignee "@me"
  echo "✅ Issue créée."
}

# ─── Définition des issues (identique à précédemment) ──
TITRE_1="Ajouter la gestion des jours fériés et ouvrés dans le calcul des délais"
LABELS_1="bug,legal,critical,feature"
BODY_1='## Description
Actuellement, `calculateDeadline` calcule les délais en jours calendaires. Or, certains délais juridiques (ex: OQTF 48h, recours contentieux 2 mois) peuvent être décomptés en jours ouvrés ou inclure une notion de « jours ouvrables » (sauf week-ends et jours fériés). L absence de cette fonctionnalité expose à des erreurs de calcul et des pertes de recours.

## Tâches
- [ ] Créer un service `src/lib/legal/workingDays.ts` avec :
  - Un calendrier des jours fériés en France (métropole + DOM-TOM selon le lieu du cabinet).
  - Une fonction `addWorkingDays(date, days)` qui ajoute un nombre de jours ouvrés.
  - Une fonction `getWorkingDaysBetween(date1, date2)` qui compte les jours ouvrés.
- [ ] Modifier `calculateDeadline` pour accepter un paramètre `mode: "calendar" | "working"` (par défaut `"calendar"` pour ne pas casser l existant).
- [ ] Mettre à jour les appels à `calculateDeadline` dans `deadline-monitor.service.ts` et `oqtfDeadlineService.ts` pour utiliser le mode `"working"` lorsque le type de délai l exige (ex: OQTF sans délai, recours CNDA).
- [ ] Ajouter des tests unitaires pour :
  - Ajout de jours ouvrés en évitant week-ends et jours fériés.
  - Calcul de délai avec un jour férié dans la période.
  - Délai de 48h avec un week-end entre la notification et l expiration.
- [ ] Documenter dans `docs/legal-rules.md` le comportement par défaut et les exceptions.

**Priorité :** P0'

TITRE_2="Valider les dates extraites par rapport au contexte juridique"
LABELS_2="bug,legal,critical,ai"
BODY_2='## Description
Les dates extraites par l IA ou par regex (ex: `extractDeadlinesFromText`) peuvent être incohérentes : date de notification antérieure à la date de décision, date d audience dans le passé, etc. Il faut ajouter une couche de validation pour détecter ces incohérences et forcer une revue humaine.

## Tâches
- [ ] Créer un service `src/lib/legal/dateValidator.ts` avec :
  - `validateDeadline(extractedDates, context)` qui vérifie la cohérence :
    - `notificationDate <= deadlineDate`
    - `decisionDate <= notificationDate`
    - `deadlineDate >= aujourd hui` (sauf si déjà expiré)
  - Retourne un tableau d erreurs (ex: `[{field: "notificationDate", issue: "postérieure à deadline"}]`).
- [ ] Intégrer ce validateur dans `extractDeadlinesFromText` et `extractDeadlinesFromFile`.
- [ ] Si une incohérence est détectée, définir `humanReviewRequired: true` et ajouter un message explicatif.
- [ ] Ajouter des tests pour :
  - Date de notification > date de deadline.
  - Date de décision > date de notification.
  - Date extraite dans le futur (incohérente).
  - Cas où plusieurs dates extraites sont contradictoires.
- [ ] Mettre à jour le `workspace-reasoning` pour qu il tienne compte de ces validations avant de passer à l état suivant.

**Priorité :** P0'

TITRE_3="Renforcer le fallback IA avec une approche de vote (IA + regex)"
LABELS_3="ai,reliability,enhancement"
BODY_3='## Description
Actuellement, `extractDeadlinesFromText` utilise l IA si disponible, puis tombe sur les regex si l IA échoue. Il n y a pas de validation croisée. Si l IA donne une date aberrante, elle est acceptée. Une approche de vote (IA + regex + règles) améliorerait la fiabilité.

## Tâches
- [ ] Modifier `extractDeadlinesFromText` pour exécuter simultanément :
  - L IA (via Ollama)
  - Les regex (fallback actuel)
  - Une règle simple basée sur les mots-clés (ex: "OQTF" -> délai de 30 jours par défaut)
- [ ] Comparer les résultats :
  - Si IA et regex concordent -> confiance élevée, accepter.
  - Si IA et regex divergent -> calculer un score de confiance et forcer `humanReviewRequired`.
  - Si IA seule donne une date mais regex ne trouve rien -> confiance moyenne, accepter avec mention de la source.
- [ ] Ajouter un champ `extractionSource` dans le résultat pour tracer la source de chaque date.
- [ ] Tester avec des textes ambigus (ex: "OQTF reçue le 5/6/2026" -> IA peut sortir "5/6", regex sort "5/6/2026").

**Priorité :** P1'

TITRE_4="Ajouter un audit trail pour les décisions IA (classification, extraction)"
LABELS_4="compliance,rgpd,audit,feature"
BODY_4='## Description
Pour répondre aux exigences de conformité (RGPD, déontologie), chaque décision prise par l IA (type de dossier identifié, dates extraites) doit être traçable : pourquoi telle décision a été prise, avec quel niveau de confiance, et à partir de quelles données.

## Tâches
- [ ] Créer une table `AIDecision` dans Prisma avec :
  - `id`, `tenantId`, `userId` (optionnel)
  - `entityType` (ex: "email", "document", "dossier")
  - `entityId`
  - `decisionType` (ex: "classification", "date_extraction")
  - `input` (texte ou JSON de l entrée)
  - `output` (JSON de la décision)
  - `confidence` (nombre)
  - `source` ("ia", "regex", "hybrid", "human")
  - `humanReviewed` (boolean)
  - `createdAt`
- [ ] Modifier `ceseda-analyzer.ts`, `deadlineExtractor.ts`, `oqtfDeadlineService.ts` pour enregistrer chaque décision dans cette table (asynchrone, ne pas bloquer l exécution).
- [ ] Ajouter une page d audit dans l admin (optionnelle) pour visualiser ces décisions.
- [ ] Tester que les décisions sont bien enregistrées.

**Priorité :** P1'

TITRE_5="Créer une matrice de scénarios juridiques pour les tests"
LABELS_5="testing,legal,quality"
BODY_5='## Description
Les tests actuels couvrent les cas « propres » mais pas les cas complexes (week-end, jours fériés, dates ambigües). Pour éviter des régressions futures, il faut formaliser tous les scénarios critiques dans une matrice réutilisable.

## Tâches
- [ ] Créer un fichier `tests/legal/scenarios.json` avec les 10 scénarios suivants (et plus) :
  1. OQTF avec délai (30 jours) -> calcul à J+30
  2. OQTF sans délai (48h) -> calcul à H+48
  3. Notification le week-end -> report au jour ouvré suivant
  4. Date de notification postérieure à la date de décision
  5. Date ambiguë (ex: 05/06/2026 vs 06/05/2026)
  6. Information incomplète (pas de date de notification)
  7. Procédure Asile - recours CNDA (1 mois)
  8. Refus de titre de séjour - recours gracieux (2 mois)
  9. Naturalisation - instruction (18 mois)
  10. Regroupement familial - délai d instruction (6 mois)
- [ ] Écrire un test paramétré qui lit ce JSON et exécute les assertions correspondantes.
- [ ] Ajouter ce test à la suite CI (Vitest).
- [ ] Documenter comment ajouter un nouveau scénario.

**Priorité :** P2'

TITRE_6="Documenter les règles métier juridiques (délais, exceptions, références CESEDA)"
LABELS_6="documentation,legal,onboarding"
BODY_6='## Description
Le code contient des constantes (ex: `STANDARD_DEADLINES`) mais aucune documentation lisible pour un avocat non-développeur. Il faut créer une documentation claire qui explique quels délais s appliquent, les exceptions, et les références CESEDA.

## Tâches
- [ ] Créer un fichier `docs/legal-rules.md`.
- [ ] Y décrire pour chaque type de procédure (`OQTF`, `REFUS_TITRE`, `ASILE`, etc.) :
  - Le délai par défaut.
  - Les conditions qui le modifient (ex: OQTF sans délai -> 48h).
  - Les articles CESEDA correspondants.
  - Les jours fériés/ouvrés pris en compte.
- [ ] Ajouter un tableau récapitulatif des délais.
- [ ] Lier cette documentation depuis le README principal et depuis le code (commentaire en tête des services).
- [ ] Mettre à jour chaque fois qu une règle change.

**Priorité :** P2'

# ─── Création des issues ──────────────────────────────────
echo ""
echo "🚀 Création des 6 issues d'audit..."

create_issue "$TITRE_1" "$LABELS_1" "$BODY_1"
create_issue "$TITRE_2" "$LABELS_2" "$BODY_2"
create_issue "$TITRE_3" "$LABELS_3" "$BODY_3"
create_issue "$TITRE_4" "$LABELS_4" "$BODY_4"
create_issue "$TITRE_5" "$LABELS_5" "$BODY_5"
create_issue "$TITRE_6" "$LABELS_6" "$BODY_6"

rm -rf "$TMP_DIR"
echo ""
echo "🎉 Toutes les issues ont été créées !"
echo "🔗 Voir les issues : https://github.com/$REPO/issues?q=is%3Aissue+is%3Aopen+milestone%3A%22$MILESTONE%22"
