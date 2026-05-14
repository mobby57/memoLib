const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  await p.plan.createMany({
    data: [
      { name: 'pilot', displayName: 'Pilot', priceMonthly: 0, priceYearly: 0, maxUsers: 1, maxDossiers: 50, maxClients: 10, maxStorageGb: 1 },
      { name: 'solo', displayName: 'Solo', priceMonthly: 49, priceYearly: 468, maxUsers: 1, maxDossiers: -1, maxClients: 50, maxStorageGb: 10 },
      { name: 'cabinet', displayName: 'Cabinet', priceMonthly: 349, priceYearly: 3348, maxUsers: 10, maxDossiers: -1, maxClients: 200, maxStorageGb: 100 },
      { name: 'enterprise', displayName: 'Enterprise', priceMonthly: 599, priceYearly: 5748, maxUsers: 50, maxDossiers: -1, maxClients: -1, maxStorageGb: 1000 },
    ],
    skipDuplicates: true,
  });
  console.log('Plans created');
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
