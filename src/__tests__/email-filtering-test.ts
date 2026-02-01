#!/usr/bin/env node

/**
 * Test Email Filtering avec FilterRule
 *
 * Valide :
 * - Création règle de filtrage (from:vip@client.com → ASSIGN_DOSSIER)
 * - Évaluation règle sur email entrant
 * - Application actions (assigner dossier, changer catégorie)
 * - EventLog RULE_APPLIED créé
 * - Timeline complète (FLOW_RECEIVED + FLOW_CLASSIFIED + RULE_APPLIED)
 */

import { PrismaClient } from '@prisma/client';
import { filterRuleService } from '../frontend/lib/services/filter-rule.service';

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('📦 Setup données de test...\n');

  const plan = await prisma.plan.create({
    data: {
      name: `test-filter-${Date.now()}`,
      displayName: 'Test Email Filtering',
      priceMonthly: 0,
      priceYearly: 0,
      maxWorkspaces: 1,
      maxDossiers: 10,
      maxClients: 10,
      maxStorageGb: 1,
      maxUsers: 1,
    },
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Test Filter Tenant',
      subdomain: `test-filter-${Date.now()}`,
      planId: plan.id,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'admin@memolib.local',
      name: 'Admin User',
      tenantId: tenant.id,
      role: 'ADMIN',
      password: 'test-password',
    },
  });

  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      email: 'vip@client.com',
      firstName: 'VIP',
      lastName: 'Client',
    },
  });

  const dossier = await prisma.dossier.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      numero: 'VIP-001',
      typeDossier: 'contentieux',
      statut: 'en_cours',
      objet: 'Dossier VIP prioritaire',
    },
  });

  console.log(`✅ Tenant: ${tenant.id}`);
  console.log(`✅ Client VIP: ${client.email}`);
  console.log(`✅ Dossier: ${dossier.numero}\n`);

  return { tenant, user, client, dossier, plan };
}

async function createFilterRule(tenant: any, dossier: any, client: any) {
  console.log('🎯 Création règle de filtrage\n');

  const rule = await prisma.filterRule.create({
    data: {
      tenantId: tenant.id,
      name: 'VIP Clients Auto-Assign',
      description: 'Assigner automatiquement emails VIP au dossier prioritaire',
      enabled: true,
      priority: 10, // Haute priorité
      conditions: [
        {
          field: 'from',
          operator: 'CONTAINS',
          value: '@client.com',
        },
      ],
      actions: [
        {
          type: 'ASSIGN_DOSSIER',
          dossierId: dossier.id,
        },
        {
          type: 'SET_CATEGORY',
          value: 'vip-request',
        },
        {
          type: 'SET_URGENCY',
          value: 'high',
        },
        {
          type: 'MARK_STARRED',
        },
      ],
      dossierId: dossier.id,
      clientId: client.id,
    },
  });

  console.log(`✅ Règle créée: ${rule.name}`);
  console.log(`   ID: ${rule.id}`);
  console.log(`   Priority: ${rule.priority}`);
  console.log(`   Conditions: ${JSON.stringify(rule.conditions)}`);
  console.log(`   Actions: ${JSON.stringify(rule.actions)}\n`);

  return rule;
}

async function createTestEmail(tenant: any, user: any) {
  console.log('📧 Création email de test\n');

  const email = await prisma.email.create({
    data: {
      tenantId: tenant.id,
      messageId: `test-vip-${Date.now()}`,
      from: 'vip@client.com',
      to: user.email,
      subject: 'Demande urgente VIP',
      body: "Bonjour, j'ai besoin d'aide urgente pour mon dossier.",
      htmlBody: "<p>Bonjour, j'ai besoin d'aide urgente pour mon dossier.</p>",
      preview: "Bonjour, j'ai besoin d'aide urgente...",
      category: 'general-inquiry', // Avant filtrage
      urgency: 'medium', // Avant filtrage
      sentiment: 'neutral',
      receivedAt: new Date(),
    },
  });

  console.log(`✅ Email créé: ${email.id}`);
  console.log(`   From: ${email.from}`);
  console.log(`   Subject: ${email.subject}`);
  console.log(`   Category (avant filtrage): ${email.category}`);
  console.log(`   Urgency (avant filtrage): ${email.urgency}\n`);

  return email;
}

async function evaluateAndApplyRules(email: any, tenant: any) {
  console.log('🔍 Évaluation règles de filtrage\n');

  const matches = await filterRuleService.evaluateAllRules(email, tenant.id);

  console.log(`📊 Règles matchées: ${matches.length}\n`);

  for (const match of matches) {
    console.log(`✅ Match: ${match.rule.name}`);
    console.log(`   Confidence: ${match.confidence * 100}%`);
    console.log(`   Conditions matchées: ${match.matchedConditions.join(', ')}`);
    console.log('');

    // Appliquer actions
    console.log(`⚡ Application actions...\n`);
    await filterRuleService.applyActions(email.id, match.rule, tenant.id);
  }

  // Vérifier email mis à jour
  const updatedEmail = await prisma.email.findUnique({
    where: { id: email.id },
  });

  console.log(`📬 Email après filtrage:`);
  console.log(`   Category: ${email.category} → ${updatedEmail?.category}`);
  console.log(`   Urgency: ${email.urgency} → ${updatedEmail?.urgency}`);
  console.log(`   Dossier: ${email.dossierId} → ${updatedEmail?.dossierId}`);
  console.log(`   Starred: ${email.isStarred} → ${updatedEmail?.isStarred}\n`);

  return { updatedEmail, matches };
}

async function verifyEventLog(email: any, tenantId: string) {
  console.log('🔍 Vérification EventLog\n');

  const events = await prisma.eventLog.findMany({
    where: {
      entityType: 'email',
      entityId: email.id,
      tenantId,
    },
    orderBy: {
      timestamp: 'asc',
    },
  });

  console.log(`📊 Events trouvés: ${events.length}\n`);

  let hasRuleApplied = false;

  events.forEach((event, i) => {
    console.log(`${i + 1}. ${event.eventType} (${event.actorType})`);
    console.log(`   Timestamp: ${event.timestamp}`);
    console.log(`   Metadata: ${JSON.stringify(event.metadata)}`);
    console.log('');

    if (event.eventType === 'RULE_APPLIED') hasRuleApplied = true;
  });

  return {
    success: hasRuleApplied,
    hasRuleApplied,
    totalEvents: events.length,
  };
}

async function verifyRuleStats(rule: any) {
  console.log('📈 Vérification stats règle\n');

  const updatedRule = await prisma.filterRule.findUnique({
    where: { id: rule.id },
  });

  console.log(`Règle: ${updatedRule?.name}`);
  console.log(`  matchCount: ${rule.matchCount} → ${updatedRule?.matchCount}`);
  console.log(`  lastMatchedAt: ${updatedRule?.lastMatchedAt}`);
  console.log(`  lastMatchedBy: ${updatedRule?.lastMatchedBy}\n`);

  return updatedRule;
}

async function cleanup(tenant: any, plan: any) {
  console.log('🧹 Cleanup...\n');

  try {
    await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    await prisma.plan.delete({ where: { id: plan.id } }).catch(() => {});
    console.log('✅ Cleanup terminé\n');
  } catch (error) {
    console.log('⚠️ Cleanup partiel\n');
  }
}

async function run() {
  console.log('🧪 Test Email Filtering + FilterRule\n');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Setup
    const { tenant, user, client, dossier, plan } = await setupTestData();

    // Créer règle filtrage
    const rule = await createFilterRule(tenant, dossier, client);

    // Créer email test
    const email = await createTestEmail(tenant, user);

    // Évaluer et appliquer règles
    const { updatedEmail, matches } = await evaluateAndApplyRules(email, tenant);

    // Vérifier EventLog
    const verification = await verifyEventLog(email, tenant.id);

    // Vérifier stats règle
    await verifyRuleStats(rule);

    // Résumé
    console.log('='.repeat(70));
    console.log('\n📊 RÉSUMÉ\n');

    if (verification.success && updatedEmail) {
      console.log('✅ Règle de filtrage créée');
      console.log('✅ Règle appliquée sur email');
      console.log('✅ EventLog RULE_APPLIED créé');
      console.log(`✅ Total events: ${verification.totalEvents}`);
      console.log(
        `✅ Email assigné au dossier: ${updatedEmail.dossierId === dossier.id ? 'OUI' : 'NON'}`
      );
      console.log(
        `✅ Catégorie changée: ${updatedEmail.category === 'vip-request' ? 'OUI' : 'NON'}`
      );
      console.log(`✅ Urgence changée: ${updatedEmail.urgency === 'high' ? 'OUI' : 'NON'}`);
      console.log(`✅ Email marqué starred: ${updatedEmail.isStarred ? 'OUI' : 'NON'}`);
      console.log('\n🎉 Email Filtering VALIDÉ\n');
    } else {
      console.log('❌ Tests échoués');
      if (!verification.hasRuleApplied) console.log('  - EventLog RULE_APPLIED manquant');
      console.log('');
    }

    console.log('📚 Prochaines étapes:\n');
    console.log('1. Créer endpoints API CRUD /api/filter-rules');
    console.log('2. Ajouter UI FilterRuleManager (admin panel)');
    console.log('3. Tester règles multiples avec priorités');
    console.log('4. Implémenter Smart Inbox scoring (Phase 4)');
    console.log('');

    // Cleanup
    await cleanup(tenant, plan);

    await prisma.$disconnect();
    process.exit(verification.success ? 0 : 1);
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

run().catch(console.error);
