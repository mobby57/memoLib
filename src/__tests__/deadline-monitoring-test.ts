/**
 * Test Deadline Monitoring - Phase 6
 * Suivi automatique délais critiques
 */

import { PrismaClient } from '@prisma/client';
import { DeadlineMonitorService } from '../frontend/lib/services/deadline-monitor.service';
import { EventLogService } from '../lib/services/event-log.service';

const prisma = new PrismaClient();
const eventLogService = new EventLogService(prisma);
const deadlineMonitor = new DeadlineMonitorService(prisma, eventLogService);

async function testDeadlineMonitoring() {
  console.log('🧪 TEST DEADLINE MONITORING - Phase 6\n');

  try {
    // Setup
    console.log('📦 Setup: Création tenant + client + dossier + deadlines...');

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
        name: 'Cabinet Test Deadlines',
        subdomain: `deadline-test-${Date.now()}`,
        planId: freePlan.id,
      },
    });
    console.log(`✅ Tenant: ${tenant.id}`);

    const user = await prisma.user.create({
      data: {
        email: `avocat.${Date.now()}@cabinet.com`,
        name: 'Maître Test',
        password: 'hash',
        role: 'lawyer',
        tenantId: tenant.id,
      },
    });

    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Jean',
        lastName: 'Dupont',
        email: `client.${Date.now()}@example.com`,
      },
    });
    console.log(`✅ Client: ${client.firstName} ${client.lastName}`);

    const dossier = await prisma.dossier.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        reference: `DOS-${Date.now()}`,
        numero: `${Date.now()}`,
        title: 'Recours OQTF',
        status: 'en-cours',
        createdBy: user.id,
      },
    });
    console.log(`✅ Dossier: ${dossier.reference}\n`);

    // Créer deadlines à différentes échéances
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Deadline J+10 (PENDING)
    const deadline10d = new Date(today);
    deadline10d.setDate(deadline10d.getDate() + 10);

    // Deadline J+7 (APPROACHING)
    const deadline7d = new Date(today);
    deadline7d.setDate(deadline7d.getDate() + 7);

    // Deadline J+3 (URGENT)
    const deadline3d = new Date(today);
    deadline3d.setDate(deadline3d.getDate() + 3);

    // Deadline J+1 (CRITICAL)
    const deadline1d = new Date(today);
    deadline1d.setDate(deadline1d.getDate() + 1);

    // Deadline J-2 (OVERDUE/MISSED)
    const deadlinePast = new Date(today);
    deadlinePast.setDate(deadlinePast.getDate() - 2);

    console.log('📅 Création 5 deadlines (J+10, J+7, J+3, J+1, J-2)...');

    const [d10, d7, d3, d1, dPast] = await Promise.all([
      prisma.legalDeadline.create({
        data: {
          tenantId: tenant.id,
          dossierId: dossier.id,
          clientId: client.id,
          type: 'RECOURS_CONTENTIEUX',
          label: 'Deadline dans 10 jours',
          referenceDate: today,
          dueDate: deadline10d,
          status: 'PENDING',
          createdBy: user.id,
        },
      }),
      prisma.legalDeadline.create({
        data: {
          tenantId: tenant.id,
          dossierId: dossier.id,
          clientId: client.id,
          type: 'RECOURS_GRACIEUX',
          label: 'Deadline dans 7 jours (J-7)',
          referenceDate: today,
          dueDate: deadline7d,
          status: 'PENDING',
          createdBy: user.id,
        },
      }),
      prisma.legalDeadline.create({
        data: {
          tenantId: tenant.id,
          dossierId: dossier.id,
          clientId: client.id,
          type: 'APPEL',
          label: 'Deadline dans 3 jours (J-3)',
          referenceDate: today,
          dueDate: deadline3d,
          status: 'PENDING',
          createdBy: user.id,
        },
      }),
      prisma.legalDeadline.create({
        data: {
          tenantId: tenant.id,
          dossierId: dossier.id,
          clientId: client.id,
          type: 'PRODUCTION_PIECES',
          label: 'Deadline demain (J-1)',
          referenceDate: today,
          dueDate: deadline1d,
          status: 'PENDING',
          createdBy: user.id,
        },
      }),
      prisma.legalDeadline.create({
        data: {
          tenantId: tenant.id,
          dossierId: dossier.id,
          clientId: client.id,
          type: 'CASSATION',
          label: 'Deadline dépassée (J-2)',
          referenceDate: deadlinePast,
          dueDate: deadlinePast,
          status: 'PENDING',
          createdBy: user.id,
        },
      }),
    ]);

    console.log(`✅ 5 deadlines créées\n`);

    // ==========================================
    // TEST 1: Vérifier deadlines (checkAllDeadlines)
    // ==========================================
    console.log('🔍 TEST 1: Monitoring automatique...');

    const checkResult = await deadlineMonitor.checkAllDeadlines(tenant.id);

    console.log(`✅ Deadlines vérifiées: ${checkResult.checked}`);
    console.log(`✅ Deadlines mises à jour: ${checkResult.updated}`);
    checkResult.results.forEach((r: any) => {
      console.log(
        `   - ${r.label}: ${r.previousStatus} → ${r.newStatus} (${r.daysRemaining}j) [Event: ${r.eventCreated}]`
      );
    });
    console.log('');

    // ==========================================
    // TEST 2: Vérifier status en DB
    // ==========================================
    console.log('🗄️ TEST 2: Vérifier status DB...');

    const [updated10, updated7, updated3, updated1, updatedPast] = await Promise.all([
      prisma.legalDeadline.findUnique({ where: { id: d10.id } }),
      prisma.legalDeadline.findUnique({ where: { id: d7.id } }),
      prisma.legalDeadline.findUnique({ where: { id: d3.id } }),
      prisma.legalDeadline.findUnique({ where: { id: d1.id } }),
      prisma.legalDeadline.findUnique({ where: { id: dPast.id } }),
    ]);

    console.log(`✅ J+10: ${updated10?.status} (attendu: PENDING)`);
    console.log(`✅ J+7:  ${updated7?.status} (attendu: APPROACHING)`);
    console.log(`✅ J+3:  ${updated3?.status} (attendu: URGENT)`);
    console.log(`✅ J+1:  ${updated1?.status} (attendu: CRITICAL)`);
    console.log(`✅ J-2:  ${updatedPast?.status} (attendu: OVERDUE)\n`);

    // ==========================================
    // TEST 3: Vérifier flags alertes
    // ==========================================
    console.log('🔔 TEST 3: Vérifier flags alertes...');

    console.log(`✅ J+7 alertJ7Sent: ${updated7?.alertJ7Sent} (attendu: true)`);
    console.log(`✅ J+3 alertJ3Sent: ${updated3?.alertJ3Sent} (attendu: true)`);
    console.log(`✅ J+1 alertJ1Sent: ${updated1?.alertJ1Sent} (attendu: true)\n`);

    // ==========================================
    // TEST 4: Vérifier EventLog
    // ==========================================
    console.log('🔐 TEST 4: Vérifier EventLog...');

    const events = await prisma.eventLog.findMany({
      where: {
        tenantId: tenant.id,
        eventType: {
          in: ['DEADLINE_APPROACHING', 'DEADLINE_URGENT', 'DEADLINE_CRITICAL', 'DEADLINE_MISSED'],
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    console.log(`✅ Events deadline créés: ${events.length}/4`);
    events.forEach((e: any, idx: number) => {
      const meta = e.metadata as any;
      console.log(
        `   ${idx + 1}. ${e.eventType}: ${meta.label} (${meta.daysRemaining}j) - ${meta.previousStatus} → ${meta.newStatus}`
      );
    });
    console.log('');

    // ==========================================
    // TEST 5: API getUpcomingDeadlines
    // ==========================================
    console.log('📬 TEST 5: Récupérer deadlines urgentes...');

    const upcoming = await deadlineMonitor.getUpcomingDeadlines(tenant.id);

    console.log(`✅ Deadlines urgentes: ${upcoming.total}`);
    console.log(`   Stats par status:`);
    console.log(`   - CRITICAL: ${upcoming.byStatus.critical}`);
    console.log(`   - URGENT: ${upcoming.byStatus.urgent}`);
    console.log(`   - APPROACHING: ${upcoming.byStatus.approaching}`);
    console.log(`   - OVERDUE: ${upcoming.byStatus.overdue}\n`);

    upcoming.deadlines.slice(0, 5).forEach((d: any, idx: number) => {
      console.log(`   ${idx + 1}. [${d.status}] ${d.label} - ${d.daysRemaining}j`);
    });
    console.log('');

    // ==========================================
    // TEST 6: Marquer deadline comme complétée
    // ==========================================
    console.log('✅ TEST 6: Compléter une deadline...');

    await deadlineMonitor.completeDeadline(d1.id, tenant.id, user.id, 'Recours déposé avec succès');

    const completed = await prisma.legalDeadline.findUnique({ where: { id: d1.id } });

    console.log(`✅ Deadline J+1 complétée: ${completed?.status === 'COMPLETED'}`);
    console.log(`   completedBy: ${completed?.completedBy}`);
    console.log(`   completionNote: ${completed?.completionNote}\n`);

    const completedEvent = await prisma.eventLog.findFirst({
      where: {
        tenantId: tenant.id,
        eventType: 'DEADLINE_COMPLETED',
        entityId: d1.id,
      },
    });

    console.log(`✅ Event DEADLINE_COMPLETED créé: ${!!completedEvent}\n`);

    // ==========================================
    // TEST 7: Stats deadlines
    // ==========================================
    console.log('📊 TEST 7: Stats deadlines...');

    const stats = await deadlineMonitor.getDeadlineStats(tenant.id);

    console.log(`✅ Total deadlines actives: ${stats.activeDeadlines}`);
    console.log(`✅ Deadlines critiques/urgentes: ${stats.overdueSoon}`);
    console.log(`✅ Par status:`, stats.byStatus);
    console.log('');

    // ==========================================
    // VALIDATIONS
    // ==========================================
    console.log('🧪 VALIDATIONS...\n');

    const checks = [
      {
        name: 'J+10 reste PENDING',
        condition: updated10?.status === 'PENDING',
      },
      {
        name: 'J+7 devient APPROACHING',
        condition: updated7?.status === 'APPROACHING',
      },
      {
        name: 'J+3 devient URGENT',
        condition: updated3?.status === 'URGENT',
      },
      {
        name: 'J+1 devient CRITICAL',
        condition: updated1?.status === 'CRITICAL',
      },
      {
        name: 'J-2 devient OVERDUE',
        condition: updatedPast?.status === 'OVERDUE',
      },
      {
        name: 'Flags alertes J7/J3/J1 activés',
        condition: updated7?.alertJ7Sent && updated3?.alertJ3Sent && updated1?.alertJ1Sent,
      },
      {
        name: 'EventLog deadline créés (4 events)',
        condition: events.length === 4,
      },
      {
        name: 'API upcoming retourne 4 deadlines urgentes (avant completion)',
        condition: upcoming.total >= 4,
      },
      {
        name: 'Deadline complétée avec success',
        condition: completed?.status === 'COMPLETED',
      },
      {
        name: 'Event DEADLINE_COMPLETED créé',
        condition: !!completedEvent,
      },
      {
        name: 'Stats correctes (4 actives après completion)',
        condition: stats.activeDeadlines === 4,
      },
    ];

    let passed = 0;
    checks.forEach((check) => {
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
    await prisma.legalDeadline.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.dossier.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.client.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    console.log('✅ Cleanup terminé\n');

    if (passed === checks.length) {
      console.log('🎉 DEADLINE MONITORING VALIDÉ - Tous les tests passent !');
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

testDeadlineMonitoring();
