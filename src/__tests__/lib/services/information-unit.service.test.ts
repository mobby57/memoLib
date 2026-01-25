/**
 * InformationUnitService - Closed Pipeline Tests
 * 
 * Tests for Zero Ignored Information Guarantee:
 * - Valid transitions (RECEIVED -> CLASSIFIED -> etc.)
 * - Forbidden transitions (RECEIVED -> CLOSED)
 * - Automatic escalations (48h/72h/96h)
 * - Audit trail immutability
 * - Workspace closure blocking
 * 
 * @file src/__tests__/lib/services/information-unit.service.test.ts
 * @date 2026-01-22
 */

import { InformationUnitService } from '@/lib/services/information-unit.service';
import { prisma } from '@/lib/prisma';
import { InformationUnitStatus, InformationUnitSource } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    informationUnit: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

describe('InformationUnitService - Closed Pipeline', () => {
  let service: InformationUnitService;

  beforeEach(() => {
    service = new InformationUnitService();
    jest.clearAllMocks();
  });

  // ============================================
  // 1. CREATION & AUTO-CLASSIFICATION
  // ============================================
  describe('create()', () => {
    it('should create unit in RECEIVED status and auto-transition to CLASSIFIED', async () => {
      const mockUnit = {
        id: 'unit-123',
        tenantId: 'tenant-1',
        source: InformationUnitSource.EMAIL,
        content: 'Test email content',
        contentHash: 'abc123...',
        currentStatus: InformationUnitStatus.RECEIVED,
        statusHistory: [
          {
            timestamp: new Date().toISOString(),
            fromStatus: null,
            toStatus: InformationUnitStatus.RECEIVED,
            reason: 'Auto-cree via EMAIL',
            changedBy: 'system',
          },
        ],
        lastStatusChangeBy: 'system',
        lastStatusChangeAt: new Date(),
        receivedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.informationUnit.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // First call: no duplicate
        .mockResolvedValueOnce(mockUnit); // Second call: unit exists for transition
      (prisma.informationUnit.create as jest.Mock).mockResolvedValue(mockUnit);
      (prisma.informationUnit.update as jest.Mock).mockResolvedValue({
        ...mockUnit,
        currentStatus: InformationUnitStatus.CLASSIFIED,
      });

      const result = await service.create({
        tenantId: 'tenant-1',
        source: InformationUnitSource.EMAIL,
        content: 'Test email content',
      });

      expect(prisma.informationUnit.create).toHaveBeenCalled();
      expect(prisma.informationUnit.update).toHaveBeenCalled(); // Auto-classify transition
    });

    it('should detect duplicates by contentHash', async () => {
      const existingUnit = {
        id: 'existing-123',
        contentHash: 'duplicate-hash',
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(existingUnit);

      const result = await service.create({
        tenantId: 'tenant-1',
        source: InformationUnitSource.EMAIL,
        content: 'Duplicate content',
      });

      expect(result).toEqual(existingUnit);
      expect(prisma.informationUnit.create).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // 2. VALID TRANSITIONS (State Machine)
  // ============================================
  describe('transition() - Valid Paths', () => {
    it('should allow RECEIVED -> CLASSIFIED transition', async () => {
      const mockUnit = {
        id: 'unit-123',
        currentStatus: InformationUnitStatus.RECEIVED,
        statusHistory: [],
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);
      (prisma.informationUnit.update as jest.Mock).mockResolvedValue({
        ...mockUnit,
        currentStatus: InformationUnitStatus.CLASSIFIED,
      });

      await service.transition({
        unitId: 'unit-123',
        toStatus: InformationUnitStatus.CLASSIFIED,
        reason: 'IA classification',
        changedBy: 'system',
      });

      expect(prisma.informationUnit.update).toHaveBeenCalled();
    });

    it('should allow ANALYZED -> INCOMPLETE transition', async () => {
      const mockUnit = {
        id: 'unit-123',
        currentStatus: InformationUnitStatus.ANALYZED,
        statusHistory: [],
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);
      (prisma.informationUnit.update as jest.Mock).mockResolvedValue({
        ...mockUnit,
        currentStatus: InformationUnitStatus.INCOMPLETE,
      });

      await service.transition({
        unitId: 'unit-123',
        toStatus: InformationUnitStatus.INCOMPLETE,
        reason: 'Missing client phone number',
        changedBy: 'user-456',
      });

      expect(prisma.informationUnit.update).toHaveBeenCalled();
    });

    it('should allow RESOLVED -> CLOSED transition', async () => {
      const mockUnit = {
        id: 'unit-123',
        currentStatus: InformationUnitStatus.RESOLVED,
        statusHistory: [],
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);
      (prisma.informationUnit.update as jest.Mock).mockResolvedValue({
        ...mockUnit,
        currentStatus: InformationUnitStatus.CLOSED,
      });

      await service.transition({
        unitId: 'unit-123',
        toStatus: InformationUnitStatus.CLOSED,
        reason: '7 day hold completed',
        changedBy: 'system',
      });

      expect(prisma.informationUnit.update).toHaveBeenCalled();
    });
  });

  // ============================================
  // 3. FORBIDDEN TRANSITIONS (Pipeline Enforcement)
  // ============================================
  describe('transition() - Forbidden Paths', () => {
    it('should reject RECEIVED -> CLOSED direct transition', async () => {
      const mockUnit = {
        id: 'unit-123',
        currentStatus: InformationUnitStatus.RECEIVED,
        statusHistory: [],
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);

      await expect(
        service.transition({
          unitId: 'unit-123',
          toStatus: InformationUnitStatus.CLOSED,
          reason: 'Direct close',
          changedBy: 'user-456',
        }),
      ).rejects.toThrow('PIPELINE ERROR: Cannot transition from RECEIVED to CLOSED');
    });

    it('should reject CLASSIFIED -> RESOLVED transition (skipping ANALYZED)', async () => {
      const mockUnit = {
        id: 'unit-123',
        currentStatus: InformationUnitStatus.CLASSIFIED,
        statusHistory: [],
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);

      await expect(
        service.transition({
          unitId: 'unit-123',
          toStatus: InformationUnitStatus.RESOLVED,
          reason: 'Skip analysis',
          changedBy: 'user-456',
        }),
      ).rejects.toThrow('Forbidden transition: CLASSIFIED -> RESOLVED');
    });

    it('should reject transition without reason', async () => {
      const mockUnit = {
        id: 'unit-123',
        currentStatus: InformationUnitStatus.ANALYZED,
        statusHistory: [],
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);

      await expect(
        service.transition({
          unitId: 'unit-123',
          toStatus: InformationUnitStatus.INCOMPLETE,
          reason: '',
          changedBy: 'user-456',
        }),
      ).rejects.toThrow('Transition reason is required');
    });
  });

  // ============================================
  // 4. AUDIT TRAIL IMMUTABILITY
  // ============================================
  describe('Audit Trail', () => {
    it('should append to statusHistory on each transition', async () => {
      const initialHistory = [
        {
          timestamp: '2026-01-22T09:00:00Z',
          fromStatus: null,
          toStatus: InformationUnitStatus.RECEIVED,
          reason: 'Created',
          changedBy: 'system',
        },
      ];

      const mockUnit = {
        id: 'unit-123',
        currentStatus: InformationUnitStatus.RECEIVED,
        statusHistory: initialHistory,
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);

      let capturedUpdate: any;
      (prisma.informationUnit.update as jest.Mock).mockImplementation((args) => {
        capturedUpdate = args.data;
        return Promise.resolve({ ...mockUnit, ...args.data });
      });

      await service.transition({
        unitId: 'unit-123',
        toStatus: InformationUnitStatus.CLASSIFIED,
        reason: 'IA classification',
        changedBy: 'system',
      });

      expect(capturedUpdate.statusHistory).toHaveLength(2);
      expect(capturedUpdate.statusHistory[1].toStatus).toBe(InformationUnitStatus.CLASSIFIED);
    });

    it('should include metadata in audit trail', async () => {
      const mockUnit = {
        id: 'unit-123',
        currentStatus: InformationUnitStatus.ANALYZED,
        statusHistory: [],
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);

      let capturedUpdate: any;
      (prisma.informationUnit.update as jest.Mock).mockImplementation((args) => {
        capturedUpdate = args.data;
        return Promise.resolve({ ...mockUnit, ...args.data });
      });

      await service.transition({
        unitId: 'unit-123',
        toStatus: InformationUnitStatus.INCOMPLETE,
        reason: 'Missing data',
        changedBy: 'user-456',
        metadata: {
          missing_fields: ['phone', 'address'],
          priority: 'high',
        },
      });

      const lastEntry = capturedUpdate.statusHistory[0];
      expect(lastEntry.metadata).toEqual({
        missing_fields: ['phone', 'address'],
        priority: 'high',
      });
    });
  });

  // ============================================
  // 5. AUTOMATIC ESCALATIONS
  // ============================================
  describe('escalateStaleUnits()', () => {
    it('should escalate INCOMPLETE > 72h to HUMAN_ACTION_REQUIRED', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 73 * 60 * 60 * 1000); // 73 hours ago

      const staleUnit = {
        id: 'unit-stale',
        tenantId: 'tenant-1',
        currentStatus: InformationUnitStatus.INCOMPLETE,
        lastStatusChangeAt: past,
        statusHistory: [],
      };

      (prisma.informationUnit.findMany as jest.Mock).mockResolvedValue([staleUnit]);
      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(staleUnit);
      (prisma.informationUnit.update as jest.Mock).mockResolvedValue({
        ...staleUnit,
        currentStatus: InformationUnitStatus.HUMAN_ACTION_REQUIRED,
      });

      const results = await service.escalateStaleUnits();

      expect(results).toHaveLength(1);
      expect(results[0].newStatus).toBe(InformationUnitStatus.HUMAN_ACTION_REQUIRED);
      expect(results[0].escalationAction).toBe('ESCALATE_TO_HUMAN_ACTION');
    });

    it('should immediately escalate AMBIGUOUS to HUMAN_ACTION_REQUIRED', async () => {
      const ambiguousUnit = {
        id: 'unit-ambiguous',
        tenantId: 'tenant-1',
        currentStatus: InformationUnitStatus.AMBIGUOUS,
        lastStatusChangeAt: new Date(),
        statusHistory: [],
      };

      (prisma.informationUnit.findMany as jest.Mock).mockResolvedValue([ambiguousUnit]);
      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(ambiguousUnit);
      (prisma.informationUnit.update as jest.Mock).mockResolvedValue({
        ...ambiguousUnit,
        currentStatus: InformationUnitStatus.HUMAN_ACTION_REQUIRED,
      });

      const results = await service.escalateStaleUnits();

      expect(results).toHaveLength(1);
      expect(results[0].escalationAction).toBe('ESCALATE_AMBIGUOUS');
    });

    it('should NOT escalate INCOMPLETE < 72h', async () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 50 * 60 * 60 * 1000); // 50 hours ago (< 72h)

      const recentUnit = {
        id: 'unit-recent',
        currentStatus: InformationUnitStatus.INCOMPLETE,
        lastStatusChangeAt: recent,
      };

      (prisma.informationUnit.findMany as jest.Mock).mockResolvedValue([recentUnit]);

      const results = await service.escalateStaleUnits();

      expect(results).toHaveLength(0);
      expect(prisma.informationUnit.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // 6. WORKSPACE CLOSURE BLOCKING
  // ============================================
  describe('validateWorkspaceClosurePossible()', () => {
    it('should allow closure if all units are RESOLVED or CLOSED', async () => {
      (prisma.informationUnit.count as jest.Mock).mockResolvedValue(0);

      const result = await service.validateWorkspaceClosurePossible('workspace-123');

      expect(result).toBe(true);
    });

    it('should block closure if unresolved units exist', async () => {
      (prisma.informationUnit.count as jest.Mock).mockResolvedValue(3); // 3 unresolved

      await expect(
        service.validateWorkspaceClosurePossible('workspace-123'),
      ).rejects.toThrow('Cannot close workspace: 3 unresolved information units exist');
    });
  });

  // ============================================
  // 7. METRICS & EXPORT
  // ============================================
  describe('getMetrics()', () => {
    it('should calculate closure rate correctly', async () => {
      (prisma.informationUnit.groupBy as jest.Mock).mockResolvedValue([
        { currentStatus: InformationUnitStatus.RECEIVED, _count: 5 },
        { currentStatus: InformationUnitStatus.CLASSIFIED, _count: 3 },
        { currentStatus: InformationUnitStatus.CLOSED, _count: 20 },
      ]);

      (prisma.informationUnit.findMany as jest.Mock).mockResolvedValue([
        { lastStatusChangeAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2h ago
        { lastStatusChangeAt: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // 4h ago
      ]);

      const metrics = await service.getMetrics('tenant-1');

      expect(metrics.totalUnits).toBe(28);
      expect(metrics.closureRate).toBe('71.43'); // 20/28 * 100
      expect(parseFloat(metrics.avgHoursInCurrentStatus)).toBeGreaterThan(0);
    });
  });

  describe('exportAuditTrail()', () => {
    it('should export complete audit trail with integrity hash', async () => {
      const mockUnit = {
        id: 'unit-123',
        tenantId: 'tenant-1',
        source: InformationUnitSource.EMAIL,
        contentHash: 'abc123',
        receivedAt: new Date('2026-01-22T09:00:00Z'),
        currentStatus: InformationUnitStatus.RESOLVED,
        statusHistory: [
          { timestamp: '2026-01-22T09:00:00Z', fromStatus: null, toStatus: 'RECEIVED' },
          { timestamp: '2026-01-22T09:05:00Z', fromStatus: 'RECEIVED', toStatus: 'CLASSIFIED' },
        ],
      };

      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);

      const result = await service.exportAuditTrail('unit-123');

      expect(result.unitId).toBe('unit-123');
      expect(result.statusHistory).toHaveLength(2);
      expect(result.integrity_hash).toBeDefined();
      expect(result.exportedAt).toBeDefined();
    });
  });
});
