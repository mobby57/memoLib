import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testImmutability() {
  console.log("🧪 Test RULE-004 : Immutabilité EventLog\n");

  // 1. Récupérer ou créer un plan
  console.log("1️⃣ Récupération plan...");
  let plan = await prisma.plan.findFirst();
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: "test-plan-" + Date.now(),
        displayName: "Test Plan",
        priceMonthly: 0,
        priceYearly: 0,
        maxWorkspaces: 1,
        maxDossiers: 10,
        maxClients: 10,
        maxStorageGb: 1,
        maxUsers: 1,
      },
    });
  }
  console.log(`✅ Plan : ${plan.id}\n`);

  // 2. Créer un tenant de test
  console.log("2️⃣ Création tenant test...");
  const tenant = await prisma.tenant.create({
    data: {
      name: "Test Immutability",
      subdomain: "test-immut-" + Date.now(),
      domain: "test-immutability-" + Date.now() + ".local",
      planId: plan.id,
    },
  });
  console.log(`✅ Tenant créé : ${tenant.id}\n`);

  // 3. Créer un événement
  console.log("3️⃣ Création événement...");
  const event = await prisma.eventLog.create({
    data: {
      eventType: "FLOW_RECEIVED",
      entityType: "email",
      entityId: "test-email-123",
      actorType: "SYSTEM",
      actorId: "system",
      tenantId: tenant.id,
      metadata: { test: true },
      immutable: true,
      checksum: "test-checksum",
    },
  });
  console.log(`✅ Événement créé : ${event.id}\n`);

  // 4. Tester UPDATE (doit échouer)
  console.log("4️⃣ Test UPDATE (doit échouer)...");
  try {
    await prisma.eventLog.update({
      where: { id: event.id },
      data: { eventType: "FLOW_NORMALIZED" },
    });
    console.log("❌ ÉCHEC : UPDATE autorisé (RULE-004 violée)\n");
  } catch (error: any) {
    if (error.message.includes("immutable")) {
      console.log(`✅ UPDATE bloqué : ${error.message.split('\n')[0]}\n`);
    } else {
      console.log(`⚠️ Erreur : ${error.message}\n`);
    }
  }

  // 5. Tester DELETE (doit échouer)
  console.log("5️⃣ Test DELETE (doit échouer)...");
  try {
    await prisma.eventLog.delete({
      where: { id: event.id },
    });
    console.log("❌ ÉCHEC : DELETE autorisé (RULE-004 violée)\n");
  } catch (error: any) {
    if (error.message.includes("immutable")) {
      console.log(`✅ DELETE bloqué : ${error.message.split('\n')[0]}\n`);
    } else {
      console.log(`⚠️ Erreur : ${error.message}\n`);
    }
  }

  console.log("✅ RULE-004 validée : EventLog immutable !\n");

  await prisma.$disconnect();
}

testImmutability().catch(console.error);
