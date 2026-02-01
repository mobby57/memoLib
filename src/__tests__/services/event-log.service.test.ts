/**
 * Tests EventLog Service
 *
 * Validation RULE-004, RULE-005, RULE-006 (BUSINESS_RULES.md)
 */

import { eventLogService } from '@/lib/services/event-log.service';
import { prisma } from '@/lib/prisma';
import { EventType, ActorType } from '@prisma/client';

describe('EventLog Service', () => {
  const testTenantId = 'test-tenant-123';
  const testPlanId = 'test-plan-123';
  const testUserId = 'test-user-456';

  beforeAll(async () => {
    // Créer un plan + tenant de test (FK obligatoire)
    await prisma.plan.upsert({
      where: { id: testPlanId },
      update: {},
      create: {
        id: testPlanId,
        name: 'test-plan-eventlog',
        displayName: 'Test Plan EventLog',
        description: 'Plan de test pour EventLog',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'EUR',
        maxWorkspaces: 1,
        maxDossiers: 10,
        maxClients: 10,
        maxStorageGb: 1,
        maxUsers: 1,
        aiAutonomyLevel: 1,
        humanValidation: true,
      },
    });

    await prisma.tenant.upsert({
      where: { id: testTenantId },
      update: {},
      create: {
        id: testTenantId,
        name: 'Test Tenant EventLog',
        subdomain: 'test-eventlog',
        planId: testPlanId,
      },
    });

    // Cleanup avant tests (TRUNCATE n'active pas les triggers DELETE)
    await prisma.$executeRawUnsafe('TRUNCATE TABLE event_logs RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    // Cleanup après tests
    await prisma.$executeRawUnsafe('TRUNCATE TABLE event_logs RESTART IDENTITY CASCADE');
    await prisma.$executeRaw`DELETE FROM "Tenant" WHERE id = ${testTenantId}`;
    await prisma.$executeRaw`DELETE FROM "Plan" WHERE id = ${testPlanId}`;
    await prisma.$disconnect();
  });

  describe('RULE-005: Création EventLog', () => {
    it('should create EventLog with all required fields', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.FLOW_RECEIVED,
        entityType: 'flow',
        entityId: 'flow-123',
        actorType: ActorType.SYSTEM,
        tenantId: testTenantId,
        metadata: {
          source: 'email',
          from: 'test@example.com',
        },
      });

      expect(eventLog.id).toBeDefined();
      expect(eventLog.timestamp).toBeInstanceOf(Date);
      expect(eventLog.eventType).toBe(EventType.FLOW_RECEIVED);
      expect(eventLog.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
      expect(eventLog.metadata).toEqual({
        source: 'email',
        from: 'test@example.com',
      });
    });

    it('should create EventLog with user actor', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.USER_VALIDATED_SUGGESTION,
        entityType: 'suggestion',
        entityId: 'sugg-789',
        actorType: ActorType.USER,
        actorId: testUserId,
        tenantId: testTenantId,
        metadata: { decision: 'accepted' },
      });

      expect(eventLog.actorType).toBe(ActorType.USER);
      expect(eventLog.actorId).toBe(testUserId);
    });
  });

  describe('RULE-006: Checksum integrity', () => {
    it('should calculate deterministic checksum', async () => {
      const params = {
        eventType: EventType.FLOW_NORMALIZED,
        entityType: 'flow',
        entityId: 'flow-456',
        actorType: ActorType.SYSTEM,
        tenantId: testTenantId,
        metadata: { hash: 'abc123' },
      };

      const event1 = await eventLogService.createEventLog(params);

      // Attendre 1ms pour garantir timestamp différent
      await new Promise(resolve => setTimeout(resolve, 1));

      const event2 = await eventLogService.createEventLog(params);

      // Checksums DOIVENT être différents (timestamps différents)
      expect(event1.checksum).not.toBe(event2.checksum);
    });

    it('should verify EventLog integrity', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.FLOW_CLASSIFIED,
        entityType: 'flow',
        entityId: 'flow-integrity-test',
        actorType: ActorType.AI,
        tenantId: testTenantId,
        metadata: { confidence: 0.95 },
      });

      const isValid = await eventLogService.verifyIntegrity(eventLog.id);
      expect(isValid).toBe(true);
    });

    it('should detect corrupted EventLog', async () => {
      // Créer un EventLog volontairement corrompu (checksum invalide)
      const eventLog = await prisma.eventLog.create({
        data: {
          timestamp: new Date(),
          eventType: EventType.DUPLICATE_DETECTED,
          entityType: 'flow',
          entityId: 'flow-corrupt-test',
          actorType: ActorType.SYSTEM,
          actorId: null,
          metadata: {},
          tenantId: testTenantId,
          immutable: true,
          checksum: 'corrupted-hash',
        },
      });

      const isValid = await eventLogService.verifyIntegrity(eventLog.id);
      expect(isValid).toBe(false);
    });
  });

  describe('RULE-004: Immuabilité (à tester avec trigger DB)', () => {
    it('should attempt to update EventLog and fail', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.FLOW_RECEIVED,
        entityType: 'flow',
        entityId: 'flow-immutable-test',
        actorType: ActorType.SYSTEM,
        tenantId: testTenantId,
        metadata: {},
      });

      // Tentative de modification (devrait échouer avec trigger DB)
      await expect(
        prisma.eventLog.update({
          where: { id: eventLog.id },
          data: { eventType: EventType.FLOW_NORMALIZED },
        })
      ).rejects.toThrow();
    });

    it('should attempt to delete EventLog and fail', async () => {
      const eventLog = await eventLogService.createEventLog({
        eventType: EventType.ACCESS_LOGIN,
        entityType: 'user',
        entityId: testUserId,
        actorType: ActorType.USER,
        actorId: testUserId,
        tenantId: testTenantId,
        metadata: {},
      });

      // Tentative de suppression (devrait échouer avec trigger DB)
      await expect(
        prisma.eventLog.delete({
          where: { id: eventLog.id },
        })
      ).rejects.toThrow();
    });
  });

  describe('Timeline & Audit Trail', () => {
    beforeAll(async () => {
      // Créer plusieurs événements pour test timeline
      const flowId = 'flow-timeline-test';

      await eventLogService.createEventLog({
        eventType: EventType.FLOW_RECEIVED,
        entityType: 'flow',
        entityId: flowId,
        actorType: ActorType.SYSTEM,
        tenantId: testTenantId,
        metadata: { step: 1 },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await eventLogService.createEventLog({
        eventType: EventType.FLOW_NORMALIZED,
        entityType: 'flow',
        entityId: flowId,
        actorType: ActorType.SYSTEM,
        tenantId: testTenantId,
        metadata: { step: 2 },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await eventLogService.createEventLog({
        eventType: EventType.USER_VALIDATED_SUGGESTION,
        entityType: 'flow',
        entityId: flowId,
        actorType: ActorType.USER,
        actorId: testUserId,
        tenantId: testTenantId,
        metadata: { step: 3 },
      });
    });

    it('should retrieve timeline for entity', async () => {
      const timeline = await eventLogService.getTimeline({
        entityType: 'flow',
        entityId: 'flow-timeline-test',
        tenantId: testTenantId,
      });

      expect(timeline).toHaveLength(3);
      expect(timeline[0].eventType).toBe(EventType.USER_VALIDATED_SUGGESTION); // Plus récent
      expect(timeline[2].eventType).toBe(EventType.FLOW_RECEIVED); // Plus ancien
    });

    it('should count events correctly', async () => {
      const count = await eventLogService.countEvents({
        tenantId: testTenantId,
        entityType: 'flow',
        entityId: 'flow-timeline-test',
      });

      expect(count).toBe(3);
    });

    it('should retrieve audit trail with filters', async () => {
      const trail = await eventLogService.getAuditTrail({
        tenantId: testTenantId,
        eventType: EventType.FLOW_RECEIVED,
      });

      expect(trail.length).toBeGreaterThan(0);
      trail.forEach(event => {
        expect(event.eventType).toBe(EventType.FLOW_RECEIVED);
      });
    });
  });

  describe('Bulk integrity verification', () => {
    it('should verify all EventLogs integrity', async () => {
      const corruptedIds = await eventLogService.verifyAllIntegrity(testTenantId);

      // Devrait trouver l'événement corrompu créé précédemment
      expect(corruptedIds.length).toBeGreaterThan(0);
    });
  });
});
