#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Correction du fichier src/app/[locale]/login/page.tsx${NC}"

FILE="src/app/[locale]/login/page.tsx"

if [ ! -f "$FILE" ]; then
    echo -e "${RED}❌ Fichier $FILE introuvable. Vérifiez le chemin.${NC}"
    exit 1
fi

# Sauvegarde
cp "$FILE" "$FILE.bak"

# Correction : ajouter "async" et "await" sur params
sed -i 's/export default function LoginRedirect({ params }: { params: { locale: string } })/export default async function LoginRedirect({ params }: { params: Promise<{ locale: string }> })/' "$FILE"
sed -i 's/redirect(`\/${params.locale}\/auth\/login`)/const { locale } = await params;\n  redirect(`\/${locale}\/auth\/login`)/' "$FILE"

echo -e "${GREEN}✅ Fichier corrigé. Sauvegarde : $FILE.bak${NC}"
echo -e "${YELLOW}📝 Contenu après correction :${NC}"
cat "$FILE"

echo -e "\n${YELLOW}🔄 Redémarrage du serveur Next.js...${NC}"
pkill -f "next" 2>/dev/null || true
npm run dev -- -p 3000 -H 0.0.0.0 > server.log 2>&1 &
echo -e "${GREEN}✅ Serveur relancé (PID $!).${NC}"

echo -e "${YELLOW}⏳ Attente du serveur...${NC}"
sleep 8
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Serveur prêt sur http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Le serveur ne répond pas. Vérifiez les logs.${NC}"
    tail -20 server.log
fi
