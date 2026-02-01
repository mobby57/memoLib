/**
 * Test Collaboration - Phase 5
 * Commentaires & Mentions @username
 */

import { PrismaClient } from '@prisma/client';
import { CollaborationService } from '../frontend/lib/services/collaboration.service';
import { EventLogService } from '../lib/services/event-log.service';

const prisma = new PrismaClient();
const eventLogService = new EventLogService(prisma);
const collaborationService = new CollaborationService(prisma, eventLogService);

async function testCollaboration() {
  console.log('🧪 TEST COLLABORATION - Phase 5\n');

  try {
    // Setup: Créer tenant + users + email
    console.log('📦 Setup: Création tenant + users + email...');

    // Assurer plan 'free' existe
    let freePlan = await prisma.plan.findUnique({ where: { name: 'free' } });
    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          name: 'free',
          displayName: 'Gratuit',
          priceMonthly: 0,
          priceYearly: 0,
        },
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Cabinet Test Collab',
        subdomain: `collab-test-${Date.now()}`,
        planId: freePlan.id,
      },
    });
    console.log(`✅ Tenant: ${tenant.id}`);

    // User 1: Avocat principal
    const avocatPrincipal = await prisma.user.create({
      data: {
        email: `avocat.principal.${Date.now()}@cabinet.com`,
        name: 'Maître Dupont',
        password: 'hash',
        role: 'lawyer',
        tenantId: tenant.id,
      },
    });
    console.log(`✅ Avocat principal: ${avocatPrincipal.email}`);

    // User 2: Assistant juridique
    const assistant = await prisma.user.create({
      data: {
        email: `assistant.juridique.${Date.now()}@cabinet.com`,
        name: 'Sophie Martin',
        password: 'hash',
        role: 'assistant',
        tenantId: tenant.id,
      },
    });
    console.log(`✅ Assistant: ${assistant.email}`);

    // User 3: Stagiaire
    const stagiaire = await prisma.user.create({
      data: {
        email: `stagiaire.${Date.now()}@cabinet.com`,
        name: 'Jules Bernard',
        password: 'hash',
        role: 'intern',
        tenantId: tenant.id,
      },
    });
    console.log(`✅ Stagiaire: ${stagiaire.email}\n`);

    // Email de test
    const email = await prisma.email.create({
      data: {
        tenantId: tenant.id,
        from: 'client@example.com',
        to: avocatPrincipal.email,
        subject: 'Dossier OQTF urgent',
        body: "Besoin d'aide pour mon dossier",
        category: 'legal-inquiry',
        urgency: 'high',
      },
    });
    console.log(`✅ Email créé: ${email.id}\n`);

    // ==========================================
    // TEST 1: Commentaire simple (sans mention)
    // ==========================================
    console.log('📝 TEST 1: Commentaire simple (sans mention)...');

    const comment1 = await collaborationService.createComment({
      content: 'Ce dossier nécessite une réponse rapide. Deadline dans 3 jours.',
      entityType: 'email',
      entityId: email.id,
      authorId: avocatPrincipal.id,
      tenantId: tenant.id,
    });

    console.log(`✅ Commentaire créé: ${comment1?.id}`);
    console.log(`   Author: ${comment1?.author?.name}`);
    console.log(`   Content: ${comment1?.content}`);
    console.log(`   Mentions: ${comment1?.mentions?.length || 0}\n`);

    // ==========================================
    // TEST 2: Commentaire avec mentions
    // ==========================================
    console.log('📝 TEST 2: Commentaire avec mentions @username...');

    const comment2 = await collaborationService.createComment({
      content: `@assistant.juridique peut préparer le recours gracieux ? @stagiaire fais la recherche jurisprudence SVP.`,
      entityType: 'email',
      entityId: email.id,
      authorId: avocatPrincipal.id,
      tenantId: tenant.id,
    });

    console.log(`✅ Commentaire avec mentions créé: ${comment2?.id}`);
    console.log(`   Mentions détectées: ${comment2?.mentions?.length || 0}`);
    comment2?.mentions?.forEach((m: any) => {
      console.log(`     - @${m.user.name} (${m.user.email})`);
    });
    console.log('');

    // ==========================================
    // TEST 3: Réponse au commentaire
    // ==========================================
    console.log("📝 TEST 3: Réponse de l'assistant...");

    const comment3 = await collaborationService.createComment({
      content: `@avocat.principal OK je m'en occupe aujourd'hui. Envoi prévu demain matin.`,
      entityType: 'email',
      entityId: email.id,
      authorId: assistant.id,
      tenantId: tenant.id,
    });

    console.log(`✅ Réponse créée: ${comment3?.id}`);
    console.log(`   Author: ${comment3?.author?.name}`);
    console.log(`   Mention avocat: ${comment3?.mentions?.length || 0}\n`);

    // ==========================================
    // TEST 4: Récupérer fil de discussion
    // ==========================================
    console.log('📬 TEST 4: Récupérer fil discussion complet...');

    const thread = await collaborationService.getComments('email', email.id);

    console.log(`✅ Commentaires récupérés: ${thread.comments.length}/${thread.total}`);
    thread.comments.forEach((c: any, idx: number) => {
      console.log(`   ${idx + 1}. [${c.author.name}] ${c.content.substring(0, 60)}...`);
      console.log(`      Mentions: ${c.mentions.length}`);
    });
    console.log('');

    // ==========================================
    // TEST 5: Mentions non lues
    // ==========================================
    console.log('🔔 TEST 5: Mentions non lues...');

    const assistantMentions = await collaborationService.getMyMentions(assistant.id);
    const stagiaireMentions = await collaborationService.getMyMentions(stagiaire.id);
    const avocatMentions = await collaborationService.getMyMentions(avocatPrincipal.id);

    console.log(`✅ Mentions non lues:`);
    console.log(`   Assistant: ${assistantMentions.unreadCount} mentions`);
    console.log(`   Stagiaire: ${stagiaireMentions.unreadCount} mentions`);
    console.log(`   Avocat: ${avocatMentions.unreadCount} mentions\n`);

    // ==========================================
    // TEST 6: Vérifier EventLog
    // ==========================================
    console.log('🔐 TEST 6: Vérifier EventLog...');

    const commentedEvents = await prisma.eventLog.findMany({
      where: {
        tenantId: tenant.id,
        eventType: 'USER_ADDED_COMMENT',
      },
      orderBy: { timestamp: 'asc' },
    });

    const mentionedEvents = await prisma.eventLog.findMany({
      where: {
        tenantId: tenant.id,
        eventType: 'USER_MENTIONED',
      },
      orderBy: { timestamp: 'asc' },
    });

    console.log(`✅ EventLog USER_ADDED_COMMENT: ${commentedEvents.length}/3`);
    commentedEvents.forEach((e: any, idx: number) => {
      const meta = e.metadata as any;
      console.log(`   ${idx + 1}. Comment ${meta.commentId} - ${meta.mentionsCount || 0} mentions`);
    });

    console.log(`\n✅ EventLog USER_MENTIONED: ${mentionedEvents.length}`);
    mentionedEvents.forEach((e: any, idx: number) => {
      const meta = e.metadata as any;
      console.log(`   ${idx + 1}. @${meta.mentionedUsername} dans comment ${meta.commentId}`);
    });
    console.log('');

    // ==========================================
    // TEST 7: Stats collaboration
    // ==========================================
    console.log('📊 TEST 7: Stats collaboration...');

    const stats = await collaborationService.getCollaborationStats(tenant.id, email.id);

    console.log(`✅ Stats:`);
    console.log(`   Total commentaires: ${stats.totalComments}`);
    console.log(`   Total mentions: ${stats.totalMentions}`);
    console.log(`   Commentaires récents: ${stats.recentComments.length}\n`);

    // ==========================================
    // VALIDATIONS
    // ==========================================
    console.log('🧪 VALIDATIONS...\n');

    const checks = [
      {
        name: 'Commentaire simple créé',
        condition: comment1 !== null && comment1.mentions?.length === 0,
      },
      {
        name: 'Mentions détectées (2 mentions dans comment2)',
        condition: comment2?.mentions?.length === 2,
      },
      {
        name: 'Mention avocat détectée dans comment3',
        condition: comment3?.mentions?.length === 1,
      },
      {
        name: 'Fil discussion complet (3 commentaires)',
        condition: thread.total === 3,
      },
      {
        name: 'Assistant a 1 mention non lue',
        condition: assistantMentions.unreadCount === 1,
      },
      {
        name: 'Stagiaire a 1 mention non lue',
        condition: stagiaireMentions.unreadCount === 1,
      },
      {
        name: 'Avocat a 1 mention non lue',
        condition: avocatMentions.unreadCount === 1,
      },
      {
        name: 'EventLog USER_ADDED_COMMENT créés (3)',
        condition: commentedEvents.length === 3,
      },
      {
        name: 'EventLog USER_MENTIONED créés (3 mentions totales)',
        condition: mentionedEvents.length === 3,
      },
      {
        name: 'Stats correctes',
        condition: stats.totalComments === 3 && stats.totalMentions === 3,
      },
    ];

    let passed = 0;
    checks.forEach(check => {
      if (check.condition) {
        console.log(`✅ ${check.name}`);
        passed++;
      } else {
        console.log(`❌ ${check.name}`);
      }
    });

    console.log(`\n📊 Résultat: ${passed}/${checks.length} validations passées\n`);

    // Cleanup
    console.log('🧹 Cleanup (partiel - EventLog conservés)...');
    // Note: EventLog empêche DELETE CASCADE sur tenant
    // On nettoie juste les données de test directement
    await prisma.mention.deleteMany({
      where: { comment: { tenantId: tenant.id } },
    });
    await prisma.comment.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.email.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    // Tenant reste avec EventLog (immutabilité RULE-004)
    console.log('✅ Cleanup terminé\n');

    if (passed === checks.length) {
      console.log('🎉 COLLABORATION VALIDÉE - Tous les tests passent !');
    } else {
      console.log('⚠️ Certains tests ont échoué');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testCollaboration();
