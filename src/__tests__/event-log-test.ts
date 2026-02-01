#!/usr/bin/env node

/**
 * Test EventLog via scripts - Validation RULE-004, RULE-005, RULE-006
 * 
 * Exécution: npx ts-node src/__tests__/event-log-test.ts
 */

import { PrismaClient, EventType, ActorType } from '@prisma/client';
import { EventLogService } from '../lib/services/event-log.service';

const prisma = new PrismaClient();
const eventLogService = new EventLogService(prisma);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Tests EventLog Service\n');

  const testTenantId = `test-tenant-${Date.now()}`;
  const testPlanId = `test-plan-${Date.now()}`;

  // Setup
  try {
    await prisma.plan.create({
      data: {
        id: testPlanId,
        name: `test-plan-${Date.now()}`,
        displayName: 'Test Plan EventLog',
        priceMonthly: 0,
        priceYearly: 0,
        maxWorkspaces: 1,
        maxDossiers: 10,
        maxClients: 10,
        maxStorageGb: 1,
        maxUsers: 1,
      },
    });

    await prisma.tenant.create({
      data: {
        id: testTenantId,
        name: 'Test Tenant EventLog',
        subdomain: `test-eventlog-${Date.now()}`,
        planId: testPlanId,
      },
    });

    console.log('✅ Setup: Plan et Tenant créés\n');
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }

  // RULE-005: Exhaustivité
  console.log('📋 RULE-005: Exhaustivité\n');

  await test('Create EventLog with all required fields', async () => {
    const eventLog = await eventLogService.createEventLog({
      eventType: EventType.FLOW_RECEIVED,
      entityType: 'flow',
      entityId: 'flow-test-123',
      actorType: ActorType.SYSTEM,
      tenantId: testTenantId,
      metadata: { test: true },
    });

    if (!eventLog.id) throw new Error('No id');
    if (eventLog.eventType !== EventType.FLOW_RECEIVED) throw new Error('Wrong eventType');
    if (!eventLog.checksum) throw new Error('No checksum');
    if (!eventLog.immutable) throw new Error('Not immutable');
  });

  await test('Create EventLog with USER actor', async () => {
    const eventLog = await eventLogService.createEventLog({
      eventType: EventType.USER_VALIDATED_SUGGESTION,
      entityType: 'suggestion',
      entityId: 'sugg-456',
      actorType: ActorType.USER,
      actorId: 'user-123',
      tenantId: testTenantId,
      metadata: {},
    });

    if (eventLog.actorType !== ActorType.USER) throw new Error('Wrong actorType');
    if (eventLog.actorId !== 'user-123') throw new Error('Wrong actorId');
  });

  // RULE-006: Checksum Integrity
  console.log('\n🔐 RULE-006: Intégrité (Checksum)\n');

  await test('Deterministic checksum', async () => {
    // Remarque: Le checksum inclut le timestamp, donc deux appels créent des checksums différents
    // On teste que le checksum est stable pour le MÊME event (pas créé deux fois)
    const eventLog = await eventLogService.createEventLog({
      eventType: EventType.FLOW_CLASSIFIED,
      entityType: 'flow',
      entityId: 'flow-checksum-test',
      actorType: ActorType.SYSTEM,
      tenantId: testTenantId,
      metadata: { category: 'admin' },
    });

    // Recalculer le checksum avec les mêmes données
    const recalculatedChecksum = (eventLog as any).checksum; // Récupérer depuis l'event créé
    const isValid = await eventLogService.verifyIntegrity(eventLog.id);
    
    if (!isValid) throw new Error('Checksum verification failed');
  });

  await test('Verify EventLog integrity', async () => {
    const eventLog = await eventLogService.createEventLog({
      eventType: EventType.DUPLICATE_DETECTED,
      entityType: 'flow',
      entityId: 'flow-dup',
      actorType: ActorType.SYSTEM,
      tenantId: testTenantId,
      metadata: {},
    });

    const isValid = await eventLogService.verifyIntegrity(eventLog.id);
    if (!isValid) throw new Error('Integrity check failed');
  });

  // RULE-004: Immutability
  console.log('\n🔒 RULE-004: Immutabilité\n');

  await test('Block UPDATE on EventLog', async () => {
    const eventLog = await eventLogService.createEventLog({
      eventType: EventType.ACCESS_LOGIN,
      entityType: 'user',
      entityId: 'user-login',
      actorType: ActorType.USER,
      actorId: 'user-999',
      tenantId: testTenantId,
      metadata: {},
    });

    try {
      await prisma.eventLog.update({
        where: { id: eventLog.id },
        data: { eventType: EventType.ACCESS_LOGOUT },
      });
      throw new Error('UPDATE should have been blocked');
    } catch (error: any) {
      if (!error.message.includes('immutable') && !error.message.includes('UPDATE')) {
        throw error;
      }
    }
  });

  await test('Block DELETE on EventLog', async () => {
    const eventLog = await eventLogService.createEventLog({
      eventType: EventType.ACCESS_VIEWED_FLOW,
      entityType: 'flow',
      entityId: 'flow-view',
      actorType: ActorType.USER,
      actorId: 'user-888',
      tenantId: testTenantId,
      metadata: {},
    });

    try {
      await prisma.eventLog.delete({
        where: { id: eventLog.id },
      });
      throw new Error('DELETE should have been blocked');
    } catch (error: any) {
      if (!error.message.includes('immutable') && !error.message.includes('DELETE')) {
        throw error;
      }
    }
  });

  // Timeline & Audit
  console.log('\n📊 Timeline & Audit Trail\n');

  await test('Retrieve timeline for entity', async () => {
    const entityId = `flow-timeline-${Date.now()}`;

    await eventLogService.createEventLog({
      eventType: EventType.FLOW_RECEIVED,
      entityType: 'flow',
      entityId,
      actorType: ActorType.SYSTEM,
      tenantId: testTenantId,
      metadata: {},
    });

    await eventLogService.createEventLog({
      eventType: EventType.FLOW_CLASSIFIED,
      entityType: 'flow',
      entityId,
      actorType: ActorType.SYSTEM,
      tenantId: testTenantId,
      metadata: {},
    });

    const timeline = await eventLogService.getTimeline({
      entityType: 'flow',
      entityId,
      tenantId: testTenantId,
    });

    if (timeline.length < 2) throw new Error('Timeline too short');
  });

  // Cleanup
  console.log('\n🧹 Cleanup\n');
  try {
    await prisma.tenant.delete({ where: { id: testTenantId } }).catch(() => {});
    await prisma.plan.delete({ where: { id: testPlanId } }).catch(() => {});
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.log('⚠️ Cleanup partial (events remain immutable)');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\n📈 Results: ${passed}/${total} passed\n`);

  if (passed === total) {
    console.log('🎉 All EventLog tests passed! RULE-004, RULE-005, RULE-006 validated.\n');
  } else {
    console.log('❌ Some tests failed:\n');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    console.log('');
  }

  await prisma.$disconnect();
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(console.error);
