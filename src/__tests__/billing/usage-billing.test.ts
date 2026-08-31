/**
 * Tests unitaires — usage-billing.ts
 * Vérifie que recordUsage écrit en base et calcule les coûts correctement
 * @jest-environment node
 */

const mockCreate = vi.fn();
const mockGroupBy = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usageRecord: {
      create: (...args: unknown[]) => mockCreate(...args),
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
    aIDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recordUsage, getMonthlyUsage } from '@/lib/billing/usage-billing';

describe('recordUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'test-id' });
  });

  it('écrit un enregistrement OCR en base avec le bon coût unitaire', async () => {
    await recordUsage({ tenantId: 't1', type: 'ocr', quantity: 3 });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 't1',
        type: 'ocr',
        quantity: 3,
        unitCost: 0.02,
        totalCost: 0.06,
        metadata: null,
      }),
    });
  });

  it('écrit un enregistrement signature avec le bon coût', async () => {
    await recordUsage({ tenantId: 't1', type: 'signature', quantity: 1 });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'signature',
        unitCost: 0.50,
        totalCost: 0.50,
      }),
    });
  });

  it('écrit un enregistrement SMS avec le bon coût', async () => {
    await recordUsage({ tenantId: 't1', type: 'sms', quantity: 10 });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'sms',
        unitCost: 0.08,
        totalCost: 0.80,
      }),
    });
  });

  it('sérialise les metadata en JSON', async () => {
    await recordUsage({
      tenantId: 't1',
      type: 'ocr',
      quantity: 1,
      metadata: { documentId: 'doc-1', dossierId: 'dos-1' },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: JSON.stringify({ documentId: 'doc-1', dossierId: 'dos-1' }),
      }),
    });
  });

  it('ne crash pas si prisma échoue (table inexistante)', async () => {
    mockCreate.mockRejectedValue(new Error('Table does not exist'));

    await expect(
      recordUsage({ tenantId: 't1', type: 'ocr', quantity: 1 })
    ).resolves.toBeUndefined();
  });
});

describe('getMonthlyUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne l\'usage agrégé par type', async () => {
    mockGroupBy.mockResolvedValue([
      { type: 'ocr', _sum: { quantity: 50, totalCost: 1.0 } },
      { type: 'sms', _sum: { quantity: 10, totalCost: 0.8 } },
    ]);

    const result = await getMonthlyUsage('t1');

    expect(result.byType.ocr).toEqual({ quantity: 50, cost: 1.0 });
    expect(result.byType.sms).toEqual({ quantity: 10, cost: 0.8 });
    expect(result.totalCost).toBe(1.8);
  });

  it('retourne un objet vide si aucun usage', async () => {
    mockGroupBy.mockResolvedValue([]);

    const result = await getMonthlyUsage('t1');

    expect(result.byType).toEqual({});
    expect(result.totalCost).toBe(0);
  });

  it('retourne un objet vide si erreur DB', async () => {
    mockGroupBy.mockRejectedValue(new Error('DB error'));

    const result = await getMonthlyUsage('t1');

    expect(result.byType).toEqual({});
    expect(result.totalCost).toBe(0);
  });
});
