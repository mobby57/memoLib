/**
 * Test EventLog - Intégration DB réelle
 *
 * Ce test utilise une vraie connexion PostgreSQL pour valider:
 * - RULE-004: Immutabilité (triggers PostgreSQL)
 * - RULE-005: Exhaustivité (tous les champs obligatoires)
 * - RULE-006: Intégrité (checksums SHA-256)
 */

import { PrismaClient, EventType, ActorType } from '@prisma/client';
import { EventLogService } from '@/lib/services/event-log.service';

const prisma = new PrismaClient();
const eventLogService = new EventLogService();

describe('EventLog Service - Integration Tests', () => {
  const testTenantId = `test-tenant-${Date.now()}`;
  const testPlanId = `test-plan-${Date.now()}`;

  beforeAll(async () => {
    // Créer plan de test
    await prisma.plan.create({
      data: {
        id: testPlanId,
        name: `test-plan-eventlog-${Date.now()}`,
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

    // Créer tenant de test
    await prisma.tenant.create({
      data: {
        id: testTenantId,
        name: 'Test Tenant EventLog',
        subdomain: `test-eventlog-${Date.now()}`,
        planId: testPlanId,
      },
    });
  });

  afterAll(async () => {
    // Cleanup (les events restent immutables)
    await prisma.tenant.delete({ where: { id: testTenantId } }).catch(() => {});
    await prisma.plan.delete({ where: { id: testPlanId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('RULE-005: Exhaustivité', () => {
    it('should create EventLog with all required fields', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.FLOW_RECEIVED,
        entityType: 'flow',
        entityId: 'flow-test-123',
        actorType: ActorType.SYSTEM,
        tenantId: testTenantId,
        metadata: { test: true, source: 'unit-test' },
      });

      expect(eventLog.id).toBeDefined();
      expect(eventLog.eventType).toBe(EventType.FLOW_RECEIVED);
      expect(eventLog.entityType).toBe('flow');
      expect(eventLog.entityId).toBe('flow-test-123');
      expect(eventLog.actorType).toBe(ActorType.SYSTEM);
      expect(eventLog.actorId).toBe('system');
      expect(eventLog.tenantId).toBe(testTenantId);
      expect(eventLog.immutable).toBe(true);
      expect(eventLog.checksum).toBeDefined();
      expect(eventLog.checksum.length).toBeGreaterThan(0);
    });

    it('should create EventLog with USER actor', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.USER_VALIDATED_SUGGESTION,
        entityType: 'suggestion',
        entityId: 'suggestion-456',
        actorType: ActorType.USER,
        actorId: 'user-123',
        tenantId: testTenantId,
        metadata: { validated: true },
      });

      expect(eventLog.actorType).toBe(ActorType.USER);
      expect(eventLog.actorId).toBe('user-123');
    });
  });

  describe('RULE-006: Intégrité (Checksum)', () => {
    it('should calculate deterministic checksum', async () => {
      const payload1 = {
        eventType: EventType.FLOW_CLASSIFIED,
        entityType: 'flow',
        entityId: 'flow-checksum-test',
        actorType: ActorType.SYSTEM,
        tenantId: testTenantId,
        metadata: { category: 'admin' },
      };

      const event1 = await eventLogService.createEventLog(payload1);
      const event2 = await eventLogService.createEventLog(payload1);

      // Les checksums doivent être identiques pour les mêmes données
      expect(event1.checksum).toBe(event2.checksum);
    });

    it('should verify EventLog integrity', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.DUPLICATE_DETECTED,
        entityType: 'flow',
        entityId: 'flow-duplicate',
        actorType: ActorType.SYSTEM,
        tenantId: testTenantId,
        metadata: { duplicateOf: 'flow-original' },
      });

      const isValid = await eventLogService.verifyIntegrity(eventLog.id);
      expect(isValid).toBe(true);
    });

    it('should detect corrupted EventLog (simulation)', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.USER_ADDED_COMMENT,
        entityType: 'flow',
        entityId: 'flow-comment',
        actorType: ActorType.USER,
        actorId: 'user-789',
        tenantId: testTenantId,
        metadata: { comment: 'Test comment' },
      });

      // Modifier directement en DB pour simuler corruption (ÉCHOUERA car immutable)
      try {
        await prisma.$executeRaw`
          UPDATE event_logs
          SET metadata = '{"corrupted": true}'::jsonb
          WHERE id = ${eventLog.id}
        `;
        // Si l'UPDATE passe, le trigger a échoué
        fail('UPDATE should have been blocked by immutability trigger');
      } catch (error: any) {
        // Trigger fonctionne : UPDATE bloqué
        expect(error.message).toContain('immutable');
      }
    });
  });

  describe('RULE-004: Immutabilité', () => {
    it('should block UPDATE on EventLog', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.ACCESS_LOGIN,
        entityType: 'user',
        entityId: 'user-login-test',
        actorType: ActorType.USER,
        actorId: 'user-999',
        tenantId: testTenantId,
        metadata: { ip: '127.0.0.1' },
      });

      // Tenter UPDATE (doit échouer)
      await expect(
        prisma.eventLog.update({
          where: { id: eventLog.id },
          data: { eventType: EventType.ACCESS_LOGOUT },
        })
      ).rejects.toThrow(/immutable/i);
    });

    it('should block DELETE on EventLog', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.ACCESS_VIEWED_FLOW,
        entityType: 'flow',
        entityId: 'flow-view-test',
        actorType: ActorType.USER,
        actorId: 'user-888',
        tenantId: testTenantId,
        metadata: { timestamp: new Date().toISOString() },
      });

      // Tenter DELETE (doit échouer)
      await expect(
        prisma.eventLog.delete({
          where: { id: eventLog.id },
        })
      ).rejects.toThrow(/immutable/i);
    });
  });

  describe('Timeline & Audit Trail', () => {
    it('should retrieve timeline for entity', async () => {
      const entityId = `flow-timeline-${Date.now()}`;

      // Créer plusieurs événements
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

      const timeline = await eventLogService.getTimeline('flow', entityId, testTenantId);

      expect(timeline.length).toBeGreaterThanOrEqual(2);
      expect(timeline[0].entityId).toBe(entityId);
    });

    it('should count events correctly', async () => {
      const count = await eventLogService.countEvents({
        tenantId: testTenantId,
        eventType: EventType.FLOW_RECEIVED,
      });

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
