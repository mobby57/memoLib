#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA="$ROOT/prisma/schema.prisma"
ROUTE="$ROOT/src/app/api/dossiers/[id]/route.ts"

log() {
  printf '[fix-all] %s\n' "$*"
}

die() {
  printf '[fix-all][ERROR] %s\n' "$*" >&2
  exit 1
}

[[ -f "$SCHEMA" ]] || die "Schema introuvable: $SCHEMA"
[[ -f "$ROUTE" ]] || die "Route introuvable: $ROUTE"

log "ROOT=$ROOT"
log "SCHEMA=$SCHEMA"
log "ROUTE=$ROUTE"

# Extrait le bloc model Dossier du schema Prisma.
DOSSIER_BLOCK="$(
  awk '
    /^model[[:space:]]+Dossier[[:space:]]*\{/ {
      inside=1
      depth=1
      next
    }

    inside {
      if ($0 ~ /\{/) depth++
      if ($0 ~ /\}/) {
        depth--
        if (depth == 0) exit
      }
      print
    }
  ' "$SCHEMA"
)"

[[ -n "$DOSSIER_BLOCK" ]] || die "model Dossier introuvable dans schema.prisma"

echo
echo "=== Relations de Dossier détectées ==="

printf '%s\n' "$DOSSIER_BLOCK"

# Cherche le vrai nom Prisma d'une relation vers un modèle donné.
#
# Exemple:
#   clientId String
#   Client   Client @relation(...)
#
# retournera "Client", pas "client".
find_relation() {
  local wanted="$1"

  printf '%s\n' "$DOSSIER_BLOCK" |
    awk -v wanted="$wanted" '
      /^[[:space:]]*(\/\/|$)/ { next }

      NF >= 2 {
        field=$1
        type=$2

        gsub(/\?/, "", type)
        gsub(/\[\]/, "", type)

        if (type == wanted) {
          print field
          exit
        }
      }
    '
}

CLIENT="$(find_relation Client || true)"
DOCUMENT="$(find_relation Document || true)"
DEADLINE="$(find_relation LegalDeadline || true)"
EVENT="$(find_relation CalendarEvent || true)"

echo
echo "=== Résultat ==="
echo "Client        = ${CLIENT:-ABSENT}"
echo "Document      = ${DOCUMENT:-ABSENT}"
echo "LegalDeadline = ${DEADLINE:-ABSENT}"
echo "CalendarEvent = ${EVENT:-ABSENT}"

# Les relations utilisées actuellement par la route.
# On ne modifie que si la relation correspondante existe réellement.
BACKUP="$ROUTE.bak.$(date +%Y%m%d-%H%M%S)"
cp -- "$ROUTE" "$BACKUP"

log "Backup: $BACKUP"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

cp -- "$ROUTE" "$TMP"

replace_relation() {
  local old="$1"
  local new="$2"

  [[ -n "$new" ]] || return 0

  # Remplace uniquement les clés d'include/select dans TypeScript.
  #
  # Exemples:
  #   client:        -> Client:
  #   documents:     -> Document:
  #   delais:        -> LegalDeadline:
  #   evenements:    -> CalendarEvent:
  #
  # On exige les deux-points pour éviter de toucher aux noms dans les chaînes,
  # commentaires ou valeurs arbitraires.
  perl -0pi -e \
    "s/([[:space:]]|[,{])\Q${old}\E([[:space:]]*:)/\$1${new}\$2/g" \
    "$TMP"
}

replace_relation "client" "$CLIENT"
replace_relation "documents" "$DOCUMENT"
replace_relation "delais" "$DEADLINE"
replace_relation "evenements" "$EVENT"

if cmp -s "$ROUTE" "$TMP"; then
  log "Aucune modification nécessaire."
else
  mv -- "$TMP" "$ROUTE"
  trap - EXIT
  log "ROUTE CORRIGÉE"
fi

echo
echo "=== Vérification Prisma ==="

cd "$ROOT"

if [[ -x "$ROOT/node_modules/.bin/prisma" ]]; then
  "$ROOT/node_modules/.bin/prisma" validate
else
  log "Prisma local introuvable: node_modules/.bin/prisma"
fi

echo
echo "[fix-all] terminé"
