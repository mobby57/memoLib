/**
 * Tests pour src/lib/services/smart-inbox.service.ts
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    client: { findUnique: vi.fn() },
    dossier: { count: vi.fn() },
    emailAttachment: { count: vi.fn() },
    legalDeadline: { findFirst: vi.fn() },
    inboxScore: { upsert: vi.fn(), findMany: vi.fn() },
    email: { findMany: vi.fn() },
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class { 
    client = mockPrisma.client;
    dossier = mockPrisma.dossier;
    emailAttachment = mockPrisma.emailAttachment;
    legalDeadline = mockPrisma.legalDeadline;
    inboxScore = mockPrisma.inboxScore;
    email = mockPrisma.email;
  },
  Email: {},
  Client: {},
}));

vi.mock('@/lib/services/event-log.service', () => ({
  eventLogService: {
    createEventLog: vi.fn().mockResolvedValue({}),
  },
}));

import { SmartInboxService } from '@/lib/services/smart-inbox.service';

describe('SmartInboxService — Full Coverage', () => {
  let service: SmartInboxService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SmartInboxService();
  });

  describe('calculateScore', () => {
    const baseEmail: any = {
      id: 'e1',
      urgency: 'low',
      clientId: null,
      dossierId: null,
      sentiment: 'neutral',
    };

    it('should calculate basic score with low urgency', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      const result = await service.calculateScore(baseEmail, 't1');
      expect(result.score).toBe(13); // low=5 + neutral=8
      expect(result.model).toBe('smart-inbox-v1');
    });

    it('should score critical urgency at 30', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      const email = { ...baseEmail, urgency: 'critical' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.urgency).toBe(30);
    });

    it('should score high urgency at 20', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      const email = { ...baseEmail, urgency: 'high' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.urgency).toBe(20);
    });

    it('should score medium urgency at 10', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      const email = { ...baseEmail, urgency: 'medium' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.urgency).toBe(10);
    });

    it('should score VIP client at 25', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.dossier.count.mockResolvedValue(5);
      const email = { ...baseEmail, clientId: 'c1' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.vipClient).toBe(25);
    });

    it('should score non-VIP client at 0', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.dossier.count.mockResolvedValue(2);
      const email = { ...baseEmail, clientId: 'c1' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.vipClient).toBe(0);
    });

    it('should score null client at 0', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      mockPrisma.client.findUnique.mockResolvedValue(null);
      const email = { ...baseEmail, clientId: 'c1' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.vipClient).toBe(0);
    });

    it('should score deadline < 7 days at 20', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      mockPrisma.legalDeadline.findFirst.mockResolvedValueOnce({ id: 'dl1' });
      const email = { ...baseEmail, dossierId: 'd1' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.hasDeadline).toBe(20);
    });

    it('should score deadline < 30 days at 10', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      mockPrisma.legalDeadline.findFirst
        .mockResolvedValueOnce(null) // no urgent
        .mockResolvedValueOnce({ id: 'dl2' }); // approaching
      const email = { ...baseEmail, dossierId: 'd1' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.hasDeadline).toBe(10);
    });

    it('should score no deadline at 0', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      const email = { ...baseEmail, dossierId: null };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.hasDeadline).toBe(0);
    });

    it('should score negative sentiment at 15', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      const email = { ...baseEmail, sentiment: 'negative' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.sentiment).toBe(15);
    });

    it('should score positive sentiment at 5', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      const email = { ...baseEmail, sentiment: 'positive' };
      const result = await service.calculateScore(email, 't1');
      expect(result.factors.sentiment).toBe(5);
    });

    it('should score attachments at 10', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(3);
      const result = await service.calculateScore(baseEmail, 't1');
      expect(result.factors.hasAttachments).toBe(10);
    });

    it('should cap total at 100', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(5);
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.dossier.count.mockResolvedValue(10);
      mockPrisma.legalDeadline.findFirst.mockResolvedValue({ id: 'dl1' });
      const email = { ...baseEmail, urgency: 'critical', clientId: 'c1', dossierId: 'd1', sentiment: 'negative' };
      const result = await service.calculateScore(email, 't1');
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return high confidence when many factors', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(1);
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.dossier.count.mockResolvedValue(10);
      mockPrisma.legalDeadline.findFirst.mockResolvedValue({ id: 'dl1' });
      const email = { ...baseEmail, urgency: 'high', clientId: 'c1', dossierId: 'd1', sentiment: 'negative' };
      const result = await service.calculateScore(email, 't1');
      expect(result.confidence).toBe('high');
    });

    it('should return low confidence when few factors', async () => {
      mockPrisma.emailAttachment.count.mockResolvedValue(0);
      const email = { ...baseEmail, urgency: 'unknown', sentiment: 'unknown' };
      const result = await service.calculateScore(email, 't1');
      expect(result.confidence).toBe('low');
    });
  });

  describe('saveScore', () => {
    it('should upsert score and log event', async () => {
      mockPrisma.inboxScore.upsert.mockResolvedValue({});
      const scoreResult: any = { score: 75, factors: {}, model: 'v1', confidence: 'high' };
      await service.saveScore('e1', scoreResult, 't1');
      expect(mockPrisma.inboxScore.upsert).toHaveBeenCalled();
    });
  });

  describe('getPrioritizedInbox', () => {
    it('should return emails ordered by score', async () => {
      mockPrisma.email.findMany.mockResolvedValue([{ id: 'e1' }]);
      const result = await service.getPrioritizedInbox('t1');
      expect(result).toHaveLength(1);
    });

    it('should apply filters', async () => {
      mockPrisma.email.findMany.mockResolvedValue([]);
      await service.getPrioritizedInbox('t1', {
        minScore: 50,
        category: 'juridique',
        urgency: 'high',
        limit: 10,
        offset: 5,
      });
      expect(mockPrisma.email.findMany).toHaveBeenCalled();
    });
  });

  describe('getScoringStats', () => {
    it('should calculate stats', async () => {
      mockPrisma.inboxScore.findMany.mockResolvedValue([
        { score: 80 },
        { score: 50 },
        { score: 20 },
      ]);
      const stats = await service.getScoringStats('t1');
      expect(stats.total).toBe(3);
      expect(stats.avgScore).toBe(50);
      expect(stats.highPriority).toBe(1);
      expect(stats.mediumPriority).toBe(1);
      expect(stats.lowPriority).toBe(1);
    });

    it('should handle empty scores', async () => {
      mockPrisma.inboxScore.findMany.mockResolvedValue([]);
      const stats = await service.getScoringStats('t1');
      expect(stats.total).toBe(0);
      expect(stats.avgScore).toBe(0);
    });
  });
});
