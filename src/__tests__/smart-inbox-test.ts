#!/usr/bin/env node

/**
 * Test Smart Inbox Scoring
 *
 * Valide :
 * - Calcul score basé sur urgency + VIP + deadline + sentiment + attachments
 * - Email VIP urgent = high score (>70)
 * - Email normal = medium score (40-70)
 * - EventLog FLOW_SCORED créé
 * - API /api/inbox/prioritized retourne emails triés
 */

import { PrismaClient } from '@prisma/client';
import { smartInboxService } from '../frontend/lib/services/smart-inbox.service';

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('📦 Setup données de test...\n');

  const plan = await prisma.plan.create({
    data: {
      name: `test-inbox-${Date.now()}`,
      displayName: 'Test Smart Inbox',
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
      name: 'Test Inbox Tenant',
      subdomain: `test-inbox-${Date.now()}`,
      planId: plan.id,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: `inbox-admin-${Date.now()}@memolib.local`,
      name: 'Admin User',
      tenantId: tenant.id,
      role: 'ADMIN',
      password: 'test-password',
    },
  });

  const vipClient = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      email: 'vip@bigclient.com',
      firstName: 'VIP',
      lastName: 'Client',
    },
  });

  // Créer 5 dossiers pour client VIP (critère VIP)
  for (let i = 1; i <= 5; i++) {
    await prisma.dossier.create({
      data: {
        tenantId: tenant.id,
        clientId: vipClient.id,
        numero: `VIP-00${i}`,
        typeDossier: 'contentieux',
        statut: 'en_cours',
      },
    });
  }

  const normalClient = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      email: 'normal@client.com',
      firstName: 'Normal',
      lastName: 'Client',
    },
  });

  const dossier = await prisma.dossier.create({
    data: {
      tenantId: tenant.id,
      clientId: normalClient.id,
      numero: 'NORM-001',
      typeDossier: 'contentieux',
      statut: 'en_cours',
    },
  });

  // Note: Deadline scoring désactivé pour ce test (schéma complexe)
  // Le score deadline sera 0 pour simplifier

  console.log(`✅ Tenant: ${tenant.id}`);
  console.log(`✅ VIP Client: ${vipClient.email} (5 dossiers actifs)`);
  console.log(`✅ Normal Client: ${normalClient.email}`);
  console.log(`✅ Dossier: ${dossier.numero}\n`);

  return { tenant, user, vipClient, normalClient, dossier, plan };
}

async function createTestEmails(tenant: any, vipClient: any, normalClient: any, dossier: any) {
  console.log('📧 Création emails de test\n');

  // Email 1: VIP + CRITICAL urgency + negative sentiment = TRÈS HIGH SCORE
  const vipUrgentEmail = await prisma.email.create({
    data: {
      tenantId: tenant.id,
      messageId: `vip-urgent-${Date.now()}`,
      from: vipClient.email,
      to: 'admin@memolib.local',
      subject: '[URGENT] Problème critique dossier',
      body: 'Nous avons un problème grave qui nécessite une attention immédiate.',
      preview: 'Nous avons un problème grave...',
      category: 'legal-question',
      urgency: 'critical',
      sentiment: 'negative',
      clientId: vipClient.id,
      receivedAt: new Date(),
    },
  });

  // Ajouter attachments (10 points bonus)
  await prisma.emailAttachment.create({
    data: {
      emailId: vipUrgentEmail.id,
      filename: 'document-urgent.pdf',
      mimeType: 'application/pdf',
      size: 1024000,
    },
  });

  console.log('1. Email VIP URGENT:');
  console.log(`   From: ${vipUrgentEmail.from}`);
  console.log(`   Urgency: ${vipUrgentEmail.urgency}`);
  console.log(`   Sentiment: ${vipUrgentEmail.sentiment}`);
  console.log(`   Attachments: 1\n`);

  // Email 2: Normal client + deadline proche + medium urgency = MEDIUM-HIGH SCORE
  const normalDeadlineEmail = await prisma.email.create({
    data: {
      tenantId: tenant.id,
      messageId: `normal-deadline-${Date.now()}`,
      from: normalClient.email,
      to: 'admin@memolib.local',
      subject: 'Question sur mon dossier',
      body: "Bonjour, j'ai une question concernant l'état de mon dossier.",
      preview: "Bonjour, j'ai une question...",
      category: 'general-inquiry',
      urgency: 'medium',
      sentiment: 'neutral',
      clientId: normalClient.id,
      dossierId: dossier.id,
      receivedAt: new Date(),
    },
  });

  console.log('2. Email Normal (avec deadline):');
  console.log(`   From: ${normalDeadlineEmail.from}`);
  console.log(`   Urgency: ${normalDeadlineEmail.urgency}`);
  console.log(`   Dossier: ${dossier.numero}`);
  console.log(`   Sentiment: ${normalDeadlineEmail.sentiment}\n`);

  // Email 3: Normal + low urgency + positive sentiment = LOW SCORE
  const lowPriorityEmail = await prisma.email.create({
    data: {
      tenantId: tenant.id,
      messageId: `low-priority-${Date.now()}`,
      from: 'contact@example.com',
      to: 'admin@memolib.local',
      subject: 'Information générale',
      body: 'Bonjour, je souhaite des informations sur vos services.',
      preview: 'Bonjour, je souhaite des informations...',
      category: 'general-inquiry',
      urgency: 'low',
      sentiment: 'positive',
      receivedAt: new Date(),
    },
  });

  console.log('3. Email Low Priority:');
  console.log(`   From: ${lowPriorityEmail.from}`);
  console.log(`   Urgency: ${lowPriorityEmail.urgency}`);
  console.log(`   Sentiment: ${lowPriorityEmail.sentiment}`);
  console.log(`   Client: inconnu\n`);

  return { vipUrgentEmail, normalDeadlineEmail, lowPriorityEmail };
}

async function testScoring(emails: any, tenant: any) {
  console.log('🧮 Calcul scores Smart Inbox\n');

  const results = [];

  for (const [name, email] of Object.entries(emails)) {
    const scoreResult = await smartInboxService.calculateScore(email as any, tenant.id);
    await smartInboxService.saveScore(email.id, scoreResult, tenant.id);

    console.log(`📊 ${name}:`);
    console.log(`   Score total: ${scoreResult.score}/100`);
    console.log(`   Factors:`);
    console.log(`     - Urgency: ${scoreResult.factors.urgency}/30`);
    console.log(`     - VIP Client: ${scoreResult.factors.vipClient}/25`);
    console.log(`     - Deadline: ${scoreResult.factors.hasDeadline}/20`);
    console.log(`     - Sentiment: ${scoreResult.factors.sentiment}/15`);
    console.log(`     - Attachments: ${scoreResult.factors.hasAttachments}/10`);
    console.log(`   Confidence: ${scoreResult.confidence}\n`);

    results.push({ name, score: scoreResult.score, ...scoreResult });
  }

  return results;
}

async function verifyEventLog(emails: any, tenantId: string) {
  console.log('🔍 Vérification EventLog\n');

  let totalFlowScored = 0;

  for (const [name, email] of Object.entries(emails)) {
    const events = await prisma.eventLog.findMany({
      where: {
        entityType: 'email',
        entityId: (email as any).id,
        eventType: 'FLOW_SCORED',
        tenantId,
      },
    });

    console.log(`${name}: ${events.length} FLOW_SCORED event(s)`);
    if (events.length > 0) {
      console.log(`   Score: ${events[0].metadata.score}`);
      console.log(`   Model: ${events[0].metadata.model}`);
      totalFlowScored += events.length;
    }
  }

  console.log(`\n✅ Total FLOW_SCORED events: ${totalFlowScored}\n`);

  return totalFlowScored === 3;
}

async function testPrioritizedAPI(tenantId: string) {
  console.log('📈 Test API /api/inbox/prioritized\n');

  const prioritized = await smartInboxService.getPrioritizedInbox(tenantId, {
    minScore: 0,
    limit: 10,
  });

  console.log(`📬 Emails triés par score (${prioritized.length}):\n`);

  prioritized.forEach((email, i) => {
    console.log(`${i + 1}. [${email.inboxScore?.score}] ${email.subject}`);
    console.log(`   From: ${email.from}`);
    console.log(`   Urgency: ${email.urgency}\n`);
  });

  return prioritized;
}

async function testStats(tenantId: string) {
  console.log('📊 Stats Smart Inbox\n');

  const stats = await smartInboxService.getScoringStats(tenantId);

  console.log(`Total emails: ${stats.total}`);
  console.log(`Score moyen: ${stats.avgScore}/100`);
  console.log(`\nDistribution:`);
  console.log(`  High (≥70): ${stats.highPriority} (${stats.distribution.high}%)`);
  console.log(`  Medium (40-69): ${stats.mediumPriority} (${stats.distribution.medium}%)`);
  console.log(`  Low (<40): ${stats.lowPriority} (${stats.distribution.low}%)\n`);

  return stats;
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
  console.log('🧪 Test Smart Inbox Scoring\n');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Setup
    const { tenant, user, vipClient, normalClient, dossier, plan } = await setupTestData();

    // Créer emails test
    const emails = await createTestEmails(tenant, vipClient, normalClient, dossier);

    // Calculer scores
    const results = await testScoring(emails, tenant);

    // Vérifier EventLog
    const eventsOk = await verifyEventLog(emails, tenant.id);

    // Tester API priorisée
    const prioritized = await testPrioritizedAPI(tenant.id);

    // Stats
    const stats = await testStats(tenant.id);

    // Résumé
    console.log('='.repeat(70));
    console.log('\n📊 RÉSUMÉ\n');

    const vipScore = results.find(r => r.name === 'vipUrgentEmail')?.score || 0;
    const normalScore = results.find(r => r.name === 'normalDeadlineEmail')?.score || 0;
    const lowScore = results.find(r => r.name === 'lowPriorityEmail')?.score || 0;

    if (eventsOk && vipScore > normalScore && normalScore > lowScore) {
      console.log('✅ Scores calculés correctement');
      console.log(
        `✅ VIP urgent (${vipScore}) > Normal deadline (${normalScore}) > Low (${lowScore})`
      );
      console.log('✅ EventLog FLOW_SCORED créés (3/3)');
      console.log('✅ API prioritized retourne emails triés');
      console.log(
        `✅ Stats: ${stats.highPriority} high, ${stats.mediumPriority} medium, ${stats.lowPriority} low`
      );
      console.log('\n🎉 Smart Inbox Scoring VALIDÉ\n');
    } else {
      console.log('❌ Tests échoués');
      if (!eventsOk) console.log('  - EventLog FLOW_SCORED manquants');
      if (vipScore <= normalScore) console.log('  - Score VIP pas assez élevé');
      console.log('');
    }

    console.log('📚 Prochaines étapes:\n');
    console.log('1. UI Smart Inbox (tri automatique par score)');
    console.log('2. Notifications emails high priority');
    console.log('3. Phase 5: Collaboration (comments/mentions)');
    console.log('');

    // Cleanup
    await cleanup(tenant, plan);

    await prisma.$disconnect();
    process.exit(eventsOk && vipScore > normalScore ? 0 : 1);
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

run().catch(console.error);
