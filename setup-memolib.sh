#!/bin/bash
# setup-memolib.sh
# Automatisation complète pour Prisma 7 + seed utilisateur avocat@test.com
# Fonctionne sous WSL2 / Linux

set -e  # Arrêt en cas d'erreur

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Démarrage de l'automatisation memolib...${NC}"

# ---------- 1. Vérification de l'environnement ----------
# Vérifier que .env existe et contient DATABASE_URL
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Fichier .env introuvable. Crée-le avec DATABASE_URL.${NC}"
    exit 1
fi
if ! grep -q "DATABASE_URL" .env; then
    echo -e "${RED}❌ DATABASE_URL non définie dans .env.${NC}"
    exit 1
fi

# ---------- 2. Installation des dépendances ----------
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
npm install prisma @prisma/client bcryptjs dotenv --save-dev

# ---------- 3. Correction de schema.prisma ----------
SCHEMA_PATH="prisma/schema.prisma"
if [ -f "$SCHEMA_PATH" ]; then
    if grep -q 'url\s*=\s*env("DATABASE_URL")' "$SCHEMA_PATH"; then
        echo -e "${YELLOW}🔧 Suppression de la ligne 'url = env(...)' dans $SCHEMA_PATH...${NC}"
        sed -i '/url\s*=\s*env("DATABASE_URL")/d' "$SCHEMA_PATH"
    fi
else
    echo -e "${RED}❌ Fichier $SCHEMA_PATH introuvable. Initialise Prisma d'abord.${NC}"
    exit 1
fi

# ---------- 4. Création de prisma.config.ts ----------
CONFIG_PATH="prisma.config.ts"
if [ ! -f "$CONFIG_PATH" ]; then
    echo -e "${YELLOW}📄 Création de $CONFIG_PATH...${NC}"
    cat > "$CONFIG_PATH" << 'EOF'
import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
EOF
fi

# ---------- 5. Génération du client Prisma ----------
echo -e "${YELLOW}⚙️  Génération du client Prisma...${NC}"
npx prisma generate

# ---------- 6. Génération du hash du mot de passe avec bcryptjs ----------
echo -e "${YELLOW}🔑 Génération du hash du mot de passe (Test@123456)...${NC}"
# On utilise un one-liner Node.js avec bcryptjs
HASH=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Test@123456', 12));")
if [ -z "$HASH" ]; then
    echo -e "${RED}❌ Échec de la génération du hash.${NC}"
    exit 1
fi
echo -e "   Hash généré : ${HASH}"

# ---------- 7. Création du script SQL de seed ----------
echo -e "${YELLOW}📄 Création du script SQL de seed...${NC}"
cat > seed.sql << EOF
-- Seed utilisateur par défaut
INSERT INTO "User" (email, password, "emailVerified", "createdAt", "updatedAt")
VALUES ('avocat@test.com', '${HASH}', NOW(), NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    "updatedAt" = NOW();
EOF

# ---------- 8. Exécution du seed via prisma db execute ----------
echo -e "${YELLOW}🔑 Exécution du seed (insertion/mise à jour de l'utilisateur)...${NC}"
npx prisma db execute --file seed.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed exécuté avec succès.${NC}"
    echo -e "${GREEN}   Utilisateur : avocat@test.com${NC}"
    echo -e "${GREEN}   Mot de passe : Test@123456${NC}"
else
    echo -e "${RED}❌ Échec du seed. Vérifie la structure de la table 'User'.${NC}"
    exit 1
fi

# ---------- 9. Nettoyage ----------
rm -f seed.sql

# ---------- 10. Message final ----------
echo ""
echo -e "${CYAN}🎉 Configuration terminée !${NC}"
echo -e "${CYAN}Tu peux maintenant lancer ton application.${NC}"
echo -e "${CYAN}Pour te connecter :${NC}"
echo -e "   Email    : avocat@test.com"
echo -e "   Mot de passe : Test@123456"
