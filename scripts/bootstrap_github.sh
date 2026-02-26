#!/usr/bin/env bash
set -euo pipefail

# Bootstrap GitHub repo, labels, and issues for Memolib
# Usage:
#   OWNER=my-org REPO=memolib GITHUB_TOKEN=xxxxx bash scripts/bootstrap_github.sh

OWNER="${OWNER:-}"
REPO="${REPO:-memolib}"

have() { command -v "$1" >/dev/null 2>&1; }

if ! have gh; then
  echo "ERROR: GitHub CLI 'gh' n'est pas installé." >&2
  echo "Installez-le: https://cli.github.com/" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

# Init git si nécessaire
if [ ! -d .git ]; then
  git init
fi
git config user.email >/dev/null 2>&1 || git config user.email "dev@memolib.local"
git config user.name  >/dev/null 2>&1 || git config user.name  "Memolib Dev"

git add .
if ! git diff --cached --quiet; then
  git commit -m "chore: init repo + docs phase0 + UI refresh"
fi

# Auth GH (token non interactif si disponible)
if ! gh auth status >/dev/null 2>&1; then
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    echo -n "$GITHUB_TOKEN" | gh auth login --with-token
  else
    echo "INFO: Auth GH requise. Lancez 'gh auth login -p https -w' puis relancez le script." >&2
    exit 1
  fi
fi

# Déterminer OWNER par défaut si manquant
if [ -z "$OWNER" ]; then
  OWNER=$(gh api user --jq .login)
fi

# Créer repo et remote si absent
if ! git remote | grep -q "^origin$"; then
  gh repo create "$OWNER/$REPO" --private --source . --remote origin --push
else
  git push -u origin HEAD || true
fi

# Labels (idempotent via --force)
create_label() {
  local name="$1" color="$2" desc="$3"
  gh label create "$name" -R "$OWNER/$REPO" -c "$color" -d "$desc" --force >/dev/null || true
}

create_label "phase-0-cadrage"           f97316 "Cadrage & vision"
create_label "phase-1-v1"                6366f1 "Livrables V1"
create_label "phase-2-gouvernance"       10b981 "Rôles, accès, process"
create_label "phase-3-valorisation"      db2777 "Templates & actifs"
create_label "phase-4-integration"       0ea5e9 "Intégrations externes"
create_label "phase-5-industrialisation" 0f766e "API, export, séparation"
create_label "legal"                      111827 "Juridique"
create_label "security"                   ef4444 "Sécurité"
create_label "ia"                         22c55e "IA / Assistants"
create_label "business"                   f59e0b "Offre & monétisation"
create_label "tech"                       3b82f6 "Technique"
create_label "doc"                        6b7280 "Documentation"
create_label "blocking"                   dc2626 "Bloquant"

# Issues (10)
new_issue() {
  local title="$1" body="$2" labels="$3"
  gh issue create -R "$OWNER/$REPO" -t "$title" -b "$body" -l "$labels" >/dev/null
}

new_issue "Vision & périmètre Memo Lib" $'Rédiger la vision officielle de Memo Lib (1 page max)\n\nObjectif :\n- Définir la promesse centrale\n- Clarifier la valeur économique\n- Poser les limites fonctionnelles\n\nLivrable attendu :\n- Document versionné dans /docs/vision.md' "phase-0-cadrage,doc,blocking"

new_issue "Ce que Memo Lib ne fera jamais" $'Lister explicitement les actions interdites au système.\n\nInclut :\n- Aucune décision automatisée\n- Aucune substitution à un professionnel\n- Aucune promesse de résultat\n\nLivrable :\n- /docs/limits.md' "phase-0-cadrage,legal,blocking"

new_issue "Doctrine Memo Lib (traitement assisté responsable)" $'Créer le cadre doctrinal Memo Lib.\n\nInclut :\n- Rôle de l’IA\n- Responsabilité humaine\n- Traçabilité\n- Auditabilité\n\nLivrable :\n- /docs/doctrine.md' "phase-0-cadrage,legal,doc,blocking"

new_issue "Centralisation email (V1)" $'Mettre en place la réception centralisée des emails clients.\n\nCritères :\n- Boîte dédiée\n- Normalisation des messages\n- Pièces jointes attachées' "phase-1-v1,tech"

new_issue "Mémoire chronologique immuable" $'Créer un historique chronologique non modifiable.\n\nInclut :\n- Messages\n- Documents\n- Actions humaines' "phase-1-v1,tech"

new_issue "Assistance IA encadrée" $'Ajouter des résumés et suggestions IA.\n\nContraintes :\n- Brouillon uniquement\n- Validation humaine obligatoire\n- Marquage explicite du contenu généré' "phase-1-v1,ia,legal"

new_issue "Gouvernance des accès" $'Implémenter les rôles :\n- Lecture\n- Annotation\n- Validation\n\nTraçabilité complète requise.' "phase-2-gouvernance,security"

new_issue "Templates métiers" $'Créer des modèles de dossiers par métier.\n\nObjectif :\n- Actif immatériel différenciant\n- Réutilisable' "phase-3-valorisation,business"

new_issue "Intégrations futures (hors scope V1)" $'Lister les intégrations potentielles sans implémentation immédiate.\n\nExemples :\n- WhatsApp\n- Légifrance\n- Piste API' "phase-4-integration"

new_issue "API & export structuré" $'Préparer Memo Lib à l’intégration externe.\n\nInclut :\n- API documentée\n- Export structuré\n- Séparation core / intégrations' "phase-5-industrialisation,tech"

echo "✅ Bootstrap GitHub terminé pour $OWNER/$REPO"
