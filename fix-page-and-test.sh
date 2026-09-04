#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

FILE="src/app/[locale]/login/page.tsx"

if [ ! -f "$FILE" ]; then
    echo -e "${RED}❌ Fichier $FILE introuvable.${NC}"
    exit 1
fi

# Sauvegarder
cp "$FILE" "$FILE.bak.$(date +%s)"

# Remplacer le contenu par la version corrigée
cat > "$FILE" << 'PAGE_TSX'
export default async function LoginRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/auth/login`);
}
PAGE_TSX

echo -e "${GREEN}✅ Fichier $FILE corrigé avec la bonne signature async.${NC}"

# Redémarrer le serveur
pkill -f "next" 2>/dev/null || true
sleep 2
echo -e "${YELLOW}🚀 Relance du serveur...${NC}"
npm run dev -- -p 3000 -H 0.0.0.0 > server.log 2>&1 &
SERVER_PID=$!
echo "PID serveur : $SERVER_PID"

# Attendre le serveur
echo -n "⏳ Attente du serveur"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "\n${GREEN}✅ Serveur prêt${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "\n${RED}❌ Serveur non démarré. Logs :${NC}"
    tail -30 server.log
    exit 1
fi

# Lancer le test en debug
echo -e "${YELLOW}🧪 Lancement du test en debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug

# Arrêter le serveur proprement
kill $SERVER_PID 2>/dev/null || true
echo -e "${GREEN}✅ Terminé.${NC}"
