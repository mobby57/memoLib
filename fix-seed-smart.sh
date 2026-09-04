#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Extraction automatique des champs du modèle Plan...${NC}"

# 1. Extraire la liste des champs du modèle Plan depuis schema.prisma
SCHEMA_FILE="prisma/schema.prisma"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Fichier schema.prisma introuvable.${NC}"
    exit 1
fi

# Extraire les champs du modèle Plan (entre "model Plan {" et le prochain "}")
FIELDS=$(awk '/model Plan {/,/^}/' "$SCHEMA_FILE" | grep -v 'model Plan {' | grep -v '^}' | grep -E '^[[:space:]]+[a-zA-Z]' | awk '{print $1}' | tr -d '[:space:]')

if [ -z "$FIELDS" ]; then
    echo -e "${RED}❌ Aucun champ trouvé pour le modèle Plan.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Champs trouvés : ${FIELDS}${NC}"

# 2. Générer les valeurs par défaut pour chaque champ
VALUES=""
for field in $FIELDS; do
    case $field in
        id|name|displayName|description|currency) VALUES="${VALUES}      ${field}: \"${field}\",\n" ;;
        price|priceMonthly|priceYearly|setupFee|trialDays|maxUsers|maxCases|maxStorage) VALUES="${VALUES}      ${field}: 0,\n" ;;
        isActive|isDefault|isPopular) VALUES="${VALUES}      ${field}: true,\n" ;;
        features) VALUES="${VALUES}      features: [\"cases\", \"clients\", \"calendar\", \"documents\"],\n" ;;
        *) VALUES="${VALUES}      ${field}: null,\n" ;;
    esac
done

# 3. Générer le fichier seed complet
echo -e "${YELLOW}📝 Génération du seed avec tous les champs...${NC}"
cp prisma/seed-e2e.ts prisma/seed-e2e.ts.bak.$(date +%s)

cat > prisma/seed-e2e.ts << SEED
/**
 * Seed E2E — Données minimales pour les tests Playwright
 * Généré automatiquement avec tous les champs du modèle Plan
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Plan avec tous les champs
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

  // 4. Avocat (utilisé pour les tests)
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

echo -e "${GREEN}✅ Seed généré avec tous les champs du modèle Plan.${NC}"
echo -e "${YELLOW}🌱 Exécution du seed...${NC}"
npx tsx prisma/seed-e2e.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed réussi ! Vous pouvez lancer les tests.${NC}"
    echo -e "${YELLOW}🧪 Commande : npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug${NC}"
else
    echo -e "${RED}❌ Le seed a échoué. Vérifiez les logs.${NC}"
fi
