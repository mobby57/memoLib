#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📝 Réécriture du seed avec displayName...${NC}"

# Sauvegarde
cp prisma/seed-e2e.ts prisma/seed-e2e.ts.bak.$(date +%s)

cat > prisma/seed-e2e.ts << 'SEED'
/**
 * Seed E2E — Données minimales pour les tests Playwright
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // 1. Plan par défaut (avec displayName)
  const plan = await prisma.plan.upsert({
    where: { id: 'starter' },
    update: {},
    create: {
      id: 'starter',
      name: 'Starter',
      displayName: 'Starter',
      description: 'Plan de base pour les tests',
      price: 0,
      maxUsers: 5,
      maxCases: 50,
      maxStorage: 100,
      features: ['cases', 'clients', 'calendar', 'documents'],
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

echo -e "${GREEN}✅ Fichier réécrit avec displayName.${NC}"
echo -e "${YELLOW}🌱 Exécution du seed...${NC}"
npx tsx prisma/seed-e2e.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed réussi ! Vous pouvez lancer les tests.${NC}"
else
    echo -e "${RED}❌ Le seed a encore échoué. Vérifiez les logs.${NC}"
fi
