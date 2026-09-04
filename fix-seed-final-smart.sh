#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Extraction des champs scalaires du modèle Plan...${NC}"

SCHEMA_FILE="prisma/schema.prisma"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Fichier schema.prisma introuvable.${NC}"
    exit 1
fi

# Extraire les champs du modèle Plan (uniquement ceux qui ne sont pas des relations)
# On cherche les lignes qui commencent par un espace, un nom de champ, et qui ne contiennent pas 'relation'
FIELDS=$(awk '/model Plan {/,/^}/' "$SCHEMA_FILE" | grep -v 'model Plan {' | grep -v '^}' | grep -E '^[[:space:]]+[a-zA-Z]' | grep -v '@relation' | awk '{print $1}' | tr -d '[:space:]')

if [ -z "$FIELDS" ]; then
    echo -e "${RED}❌ Aucun champ scalaire trouvé.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Champs scalaires trouvés : ${FIELDS}${NC}"

# 2. Générer les valeurs par défaut pour chaque champ scalaire
VALUES=""
for field in $FIELDS; do
    # Déterminer le type en regardant le schéma (on simplifie en mettant des valeurs par défaut selon le nom)
    case $field in
        id)
            VALUES="${VALUES}      id: \"starter\",\n"
            ;;
        name|displayName|description|currency)
            VALUES="${VALUES}      ${field}: \"${field}\",\n"
            ;;
        price|priceMonthly|priceYearly|setupFee|trialDays|maxWorkspaces|maxDossiers|maxClients|maxStorageGb|maxUsers)
            VALUES="${VALUES}      ${field}: 0,\n"
            ;;
        aiAutonomyLevel|humanValidation|advancedAnalytics|externalAiAccess|prioritySupport|customBranding|apiAccess|isActive)
            VALUES="${VALUES}      ${field}: false,\n"
            ;;
        createdAt|updatedAt)
            # On les laisse avec la valeur par défaut du schéma (autogénéré) ou on les met à null
            VALUES="${VALUES}      ${field}: new Date(),\n"
            ;;
        *)
            # Pour les autres, on met une valeur par défaut selon le type (on suppose string ou int)
            VALUES="${VALUES}      ${field}: null,\n"
            ;;
    esac
done

# Supprimer la dernière virgule pour éviter les erreurs de syntaxe (on va utiliser un sed pour enlever la dernière virgule)
VALUES=$(echo -e "$VALUES" | sed '$ s/,$//')

echo -e "${YELLOW}📝 Génération du seed avec tous les champs scalaires...${NC}"
cp prisma/seed-e2e.ts prisma/seed-e2e.ts.bak.$(date +%s)

cat > prisma/seed-e2e.ts << SEED
/**
 * Seed E2E — Données minimales pour les tests Playwright
 * Généré automatiquement avec les champs scalaires du modèle Plan
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Plan avec tous les champs scalaires
  const plan = await prisma.plan.upsert({
    where: { id: 'starter' },
    update: {},
    create: {
$(echo -e "$VALUES" | sed 's/^/      /')
    },
  });

  // 2. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'cabinet-e2e' },
    update: {},
    create: {
      name: 'Cabinet E2E',
      slug: 'cabinet-e2e',
      planId: 'starter',
    },
  });

  // 3. Admin
  await prisma.user.upsert({
    where: { email: 'admin@memolib.local' },
    update: {},
    create: {
      email: 'admin@memolib.local',
      password: await bcrypt.hash('Admin123!', 10),
      name: 'Admin E2E',
      role: 'ADMIN',
      tenantId: tenant.id,
      emailVerified: new Date(),
    },
  });

  // 4. Avocat
  await prisma.user.upsert({
    where: { email: 'avocat@test.com' },
    update: {},
    create: {
      email: 'avocat@test.com',
      password: await bcrypt.hash('Test123!', 10),
      name: 'Avocat Test',
      role: 'LAWYER',
      tenantId: tenant.id,
      emailVerified: new Date(),
    },
  });

  // 5. Clients
  const client1 = await prisma.client.upsert({
    where: { id: 'client1' },
    update: {},
    create: {
      id: 'client1',
      name: 'Jean Dupont',
      email: 'jean@example.com',
      phone: '0612345678',
      tenantId: tenant.id,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'client2' },
    update: {},
    create: {
      id: 'client2',
      name: 'Marie Martin',
      email: 'marie@example.com',
      phone: '0687654321',
      tenantId: tenant.id,
    },
  });

  // 6. Dossiers
  await prisma.case.upsert({
    where: { id: 'case1' },
    update: {},
    create: {
      id: 'case1',
      title: 'OQTF - Jean Dupont',
      type: 'OQTF',
      status: 'OPEN',
      priority: 'URGENT',
      clientId: client1.id,
      tenantId: tenant.id,
      assignedUserId: avocat.id,
      deadline: new Date('2026-12-31'),
    },
  });

  await prisma.case.upsert({
    where: { id: 'case2' },
    update: {},
    create: {
      id: 'case2',
      title: 'Titre de séjour - Marie Martin',
      type: 'TITRE_SEJOUR',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      clientId: client2.id,
      tenantId: tenant.id,
      assignedUserId: avocat.id,
      deadline: new Date('2027-06-30'),
    },
  });

  console.log('✅ Seed E2E terminé.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
SEED

echo -e "${GREEN}✅ Seed généré avec les champs scalaires.${NC}"
echo -e "${YELLOW}🌱 Exécution du seed...${NC}"
npx tsx prisma/seed-e2e.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed réussi ! Vous pouvez lancer les tests.${NC}"
else
    echo -e "${RED}❌ Le seed a échoué. Vérifiez les logs.${NC}"
fi
