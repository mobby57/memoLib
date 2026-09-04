#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

FILE="prisma/seed-e2e.ts"

if [ ! -f "$FILE" ]; then
    echo -e "${RED}❌ Fichier $FILE introuvable.${NC}"
    exit 1
fi

# Sauvegarde
cp "$FILE" "$FILE.bak"

# Remplacer require par import
sed -i 's/const crypto = require("crypto");/import crypto from "crypto";/' "$FILE"
sed -i 's/const { PrismaClient } = require("@prisma\/client");/import { PrismaClient } from "@prisma\/client";/' "$FILE"
# Autres require possibles (si présents)
sed -i 's/const bcrypt = require("bcrypt");/import bcrypt from "bcrypt";/' "$FILE"

echo -e "${GREEN}✅ Seed corrigé.${NC}"
echo -e "${YELLOW}📝 Contenu après correction :${NC}"
head -20 "$FILE"

echo -e "\n${YELLOW}🔄 Relance du seed...${NC}"
npx ts-node prisma/seed-e2e.ts
