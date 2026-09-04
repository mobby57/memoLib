#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Réécriture définitive de src/app/[locale]/login/page.tsx${NC}"

FILE="src/app/[locale]/login/page.tsx"

if [ ! -f "$FILE" ]; then
    echo -e "${RED}❌ Fichier $FILE introuvable.${NC}"
    exit 1
fi

# Sauvegarde
cp "$FILE" "$FILE.bak.$(date +%s)"

# Écrire le contenu correct
cat > "$FILE" << 'TSX'
import { redirect } from 'next/navigation';

export default async function LoginRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/auth/login`);
}
TSX

echo -e "${GREEN}✅ Fichier réécrit avec succès.${NC}"
echo -e "${YELLOW}📝 Nouveau contenu :${NC}"
cat "$FILE"

echo -e "\n${YELLOW}🔄 Redémarrage du serveur Next.js...${NC}"
pkill -f "next" 2>/dev/null || true
npm run dev -- -p 3000 -H 0.0.0.0 > server.log 2>&1 &
sleep 6

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Serveur prêt sur http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Le serveur ne répond pas. Vérifiez les logs.${NC}"
    tail -20 server.log
fi
