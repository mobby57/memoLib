#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT="$HOME/projects/memoLib"
cd "$PROJECT"

echo "=============================================="
echo "   MEMOLIB - MIGRATION RAILWAY AUTOMATIQUE"
echo "=============================================="
echo

# ------------------------------------------------
# 1. Vérifications
# ------------------------------------------------

command -v railway >/dev/null 2>&1 || {
  echo "❌ Railway CLI n'est pas installé."
  echo "Installe-le avec :"
  echo "npm install -g @railway/cli"
  exit 1
}

echo "Railway CLI : $(railway --version)"
echo

echo "🔎 Vérification du projet Railway..."
railway status
echo

# ------------------------------------------------
# 2. Vérifier Git
# ------------------------------------------------

echo "🔎 Vérification Git..."

if [[ -n "$(git status --short)" ]]; then
  echo "❌ Git contient des modifications."
  echo
  git status --short
  echo
  echo "Le script s'arrête pour protéger ton travail."
  echo "Fais d'abord un commit ou un stash."
  exit 1
fi

echo "✅ Git propre."
echo

# ------------------------------------------------
# 3. Vérifier les fichiers nécessaires
# ------------------------------------------------

[[ -f ".railway/railway.ts" ]] || {
  echo "❌ .railway/railway.ts introuvable."
  exit 1
}

[[ -f "websocket-server/Dockerfile" ]] || {
  echo "❌ websocket-server/Dockerfile introuvable."
  exit 1
}

[[ -f "websocket-server/package.json" ]] || {
  echo "❌ websocket-server/package.json introuvable."
  exit 1
}

echo "✅ Structure WebSocket trouvée."
echo

# ------------------------------------------------
# 4. Sauvegarde
# ------------------------------------------------

BACKUP=".railway/railway.ts.backup.$(date +%Y%m%d-%H%M%S)"

cp ".railway/railway.ts" "$BACKUP"

echo "💾 Sauvegarde créée : $BACKUP"
echo

# ------------------------------------------------
# 5. Afficher les services Railway existants
# ------------------------------------------------

echo "📡 Services Railway actuels :"
railway service list
echo

# ------------------------------------------------
# 6. Importer l'état LIVE Railway
# ------------------------------------------------

echo "📥 Import de la configuration actuelle Railway..."
echo "Cela évite de remplacer aveuglément PostgreSQL/MemoLib."

railway config pull --force

echo
echo "✅ Configuration Railway importée."
echo

# ------------------------------------------------
# 7. Configurer le Root Directory du WebSocket
# ------------------------------------------------

echo "🔧 Configuration du Root Directory WebSocket..."

if railway service list 2>/dev/null | grep -qi "websocket-server"; then

  railway environment edit \
    --service-config websocket-server \
    source.rootDirectory \
    /websocket-server

  echo "✅ websocket-server → /websocket-server"

else

  echo "⚠️ Service websocket-server absent de l'environnement."
  echo
  echo "Création du service..."

  railway add --service websocket-server

  railway environment edit \
    --service-config websocket-server \
    source.rootDirectory \
    /websocket-server

  echo "✅ websocket-server créé/configuré."
fi

echo

# ------------------------------------------------
# 8. Vérifier la configuration générée
# ------------------------------------------------

echo "📄 Configuration IaC actuelle :"
sed -n '1,260p' .railway/railway.ts

echo

# ------------------------------------------------
# 9. Plan Railway
# ------------------------------------------------

echo "=============================================="
echo "             RAILWAY CONFIG PLAN"
echo "=============================================="
echo

PLAN_FILE="/tmp/memolib-railway-plan.txt"

railway config plan 2>&1 | tee "$PLAN_FILE"

echo

# ------------------------------------------------
# 10. Protection anti-destruction
# ------------------------------------------------

echo "🛡️ Vérification anti-destruction..."

if grep -Eiq \
  'destroy|delete|remove|delet(e|ing)|destroying|Postgres.*-|\bPostgres\b.*remove|\bmemolib\b.*remove|postgres-volume.*remove' \
  "$PLAN_FILE"; then

  echo
  echo "🚨 PLAN POTENTIELLEMENT DESTRUCTIF"
  echo
  echo "Le script REFUSE d'appliquer la configuration."
  echo
  echo "PostgreSQL, le volume ou MemoLib pourraient être"
  echo "modifiés/supprimés. Rien n'est appliqué."
  echo
  echo "Plan complet :"
  cat "$PLAN_FILE"
  echo
  echo "❌ ARRÊT DE SÉCURITÉ"
  exit 2
fi

echo "✅ Aucun changement destructif détecté."
echo

# ------------------------------------------------
# 11. Confirmation finale automatique
# ------------------------------------------------

echo "=============================================="
echo "        APPLICATION DE LA CONFIGURATION"
echo "=============================================="
echo

railway config apply --yes

echo
echo "=============================================="
echo "             MIGRATION TERMINÉE"
echo "=============================================="
echo

echo "📡 Services :"
railway service list

echo
echo "📊 Statut :"
railway service status --all

echo
echo "✅ Railway IaC appliqué."
