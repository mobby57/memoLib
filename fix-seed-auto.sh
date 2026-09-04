#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📝 Ajout automatique des champs manquants dans le seed...${NC}"

# Sauvegarde
cp prisma/seed-e2e.ts prisma/seed-e2e.ts.bak.$(date +%s)

# Liste des champs souvent manquants dans Plan (ajustez selon votre schéma)
# On ajoute priceMonthly, trialDays, isActive, currency, etc.
sed -i '/displayName: "Starter",/a \          priceMonthly: 0.0,' prisma/seed-e2e.ts
sed -i '/priceMonthly: 0.0,/a \          trialDays: 0,' prisma/seed-e2e.ts
sed -i '/trialDays: 0,/a \          isActive: true,' prisma/seed-e2e.ts
sed -i '/isActive: true,/a \          currency: "EUR",' prisma/seed-e2e.ts

# Si d'autres champs apparaissent, on peut les ajouter ici

echo -e "${GREEN}✅ Champs ajoutés.${NC}"
echo -e "${YELLOW}🌱 Exécution du seed...${NC}"
npx tsx prisma/seed-e2e.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed réussi ! Vous pouvez lancer les tests.${NC}"
else
    echo -e "${RED}❌ Le seed a échoué. Voici l'erreur :${NC}"
    npx tsx prisma/seed-e2e.ts 2>&1 | tail -20
fi
