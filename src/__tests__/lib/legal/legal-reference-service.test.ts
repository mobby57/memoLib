import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma avant import du service (le service lit prisma.legalReference).
const findMany = vi.fn();
const count = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    legalReference: {
      findMany: (...args: unknown[]) => findMany(...args),
      count: (...args: unknown[]) => count(...args),
    },
  },
}));

import {
  isInForceAt,
  selectVersionInForce,
  getArticleAtDate,
  getArticlesAtDate,
  getArticleHistory,
  isCorpusPopulated,
  type LegalReferenceVersion,
} from '@/lib/legal/legal-reference-service';

function version(partial: Partial<LegalReferenceVersion>): LegalReferenceVersion {
  return {
    id: partial.id ?? 'id',
    code: partial.code ?? 'CESEDA',
    article: partial.article ?? 'R431-2',
    version: partial.version ?? null,
    title: partial.title ?? 'Titre',
    content: partial.content ?? 'Contenu',
    summary: partial.summary ?? null,
    category: partial.category ?? 'TITRE_SEJOUR',
    keywords: partial.keywords ?? [],
    defaultDeadlineDays: partial.defaultDeadlineDays ?? null,
    deadlineType: partial.deadlineType ?? null,
    legifranceUrl: partial.legifranceUrl ?? null,
    eurlexUrl: partial.eurlexUrl ?? null,
    isActive: partial.isActive ?? true,
    validFrom: partial.validFrom ?? null,
    validUntil: partial.validUntil ?? null,
  };
}

// Lignes brutes telles que renvoyées par Prisma (keywords = JSON string).
function row(partial: Record<string, unknown>) {
  return {
    id: 'id',
    code: 'CESEDA',
    article: 'R431-2',
    version: null,
    title: 'Titre',
    content: 'Contenu',
    summary: null,
    category: 'TITRE_SEJOUR',
    keywords: null,
    defaultDeadlineDays: null,
    deadlineType: null,
    legifrance_url: null,
    eurlex_url: null,
    isActive: true,
    validFrom: null,
    validUntil: null,
    ...partial,
  };
}

beforeEach(() => {
  findMany.mockReset();
  count.mockReset();
});

describe('isInForceAt', () => {
  const d = (s: string) => new Date(s);

  it('open-ended version (no bounds) is always in force', () => {
    expect(isInForceAt({ validFrom: null, validUntil: null }, d('2026-10-01'))).toBe(true);
  });

  it('respects validFrom lower bound (inclusive)', () => {
    const v = { validFrom: d('2026-10-01'), validUntil: null };
    expect(isInForceAt(v, d('2026-09-30'))).toBe(false);
    expect(isInForceAt(v, d('2026-10-01'))).toBe(true);
    expect(isInForceAt(v, d('2026-10-02'))).toBe(true);
  });

  it('treats validUntil as exclusive upper bound', () => {
    const v = { validFrom: d('2025-01-01'), validUntil: d('2026-10-01') };
    expect(isInForceAt(v, d('2026-09-30'))).toBe(true);
    expect(isInForceAt(v, d('2026-10-01'))).toBe(false); // la version suivante prend le relais
  });
});

describe('selectVersionInForce', () => {
  const d = (s: string) => new Date(s);

  it('picks the version in force at the given date (no overlap)', () => {
    const old = version({ version: '2025-01-01', validFrom: d('2025-01-01'), validUntil: d('2026-10-01') });
    const current = version({ version: '2026-10-01', validFrom: d('2026-10-01'), validUntil: null });

    expect(selectVersionInForce([old, current], d('2025-06-15'))?.version).toBe('2025-01-01');
    expect(selectVersionInForce([old, current], d('2026-10-02'))?.version).toBe('2026-10-01');
  });

  it('returns null when no version covers the date', () => {
    const future = version({ validFrom: d('2027-01-01'), validUntil: null });
    expect(selectVersionInForce([future], d('2026-01-01'))).toBeNull();
  });

  it('prefers the most specific (latest validFrom) on overlap', () => {
    const broad = version({ version: 'broad', validFrom: d('2020-01-01'), validUntil: null });
    const specific = version({ version: 'specific', validFrom: d('2026-01-01'), validUntil: null });
    expect(selectVersionInForce([broad, specific], d('2026-06-01'))?.version).toBe('specific');
  });
});

describe('getArticleAtDate', () => {
  it('returns the version in force at the requested date', async () => {
    findMany.mockResolvedValue([
      row({ id: 'a', version: '2025-01-01', validFrom: new Date('2025-01-01'), validUntil: new Date('2026-10-01') }),
      row({ id: 'b', version: '2026-10-01', validFrom: new Date('2026-10-01'), validUntil: null }),
    ]);

    const result = await getArticleAtDate('R431-2', { at: new Date('2025-03-14') });
    expect(result?.version).toBe('2025-01-01');
    expect(findMany).toHaveBeenCalledWith({ where: { code: 'CESEDA', article: 'R431-2' } });
  });

  it('returns null gracefully when corpus is empty', async () => {
    findMany.mockResolvedValue([]);
    expect(await getArticleAtDate('R431-2')).toBeNull();
  });

  it('never throws on DB error, returns null', async () => {
    findMany.mockRejectedValue(new Error('db down'));
    expect(await getArticleAtDate('R431-2')).toBeNull();
  });

  it('decodes keywords JSON string into an array', async () => {
    findMany.mockResolvedValue([
      row({ keywords: JSON.stringify(['séjour', 'ANEF']), validFrom: null, validUntil: null }),
    ]);
    const result = await getArticleAtDate('R431-2');
    expect(result?.keywords).toEqual(['séjour', 'ANEF']);
  });
});

describe('getArticlesAtDate', () => {
  it('returns in-force versions for multiple articles, omitting absent ones', async () => {
    findMany.mockResolvedValue([
      row({ id: 'x', article: 'L611-1', validFrom: null, validUntil: null }),
      row({ id: 'y', article: 'R431-2', version: '2026-10-01', validFrom: new Date('2026-10-01'), validUntil: null }),
    ]);
    const result = await getArticlesAtDate(['L611-1', 'R431-2', 'L999-9'], { at: new Date('2026-10-05') });
    expect(result.map((r) => r.article).sort()).toEqual(['L611-1', 'R431-2']);
  });

  it('returns [] for empty input without querying', async () => {
    const result = await getArticlesAtDate([]);
    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe('getArticleHistory', () => {
  it('returns all versions sorted by validFrom ascending', async () => {
    findMany.mockResolvedValue([
      row({ id: 'b', version: '2026-10-01', validFrom: new Date('2026-10-01'), validUntil: null }),
      row({ id: 'a', version: '2025-01-01', validFrom: new Date('2025-01-01'), validUntil: new Date('2026-10-01') }),
    ]);
    const history = await getArticleHistory('R431-2');
    expect(history.map((h) => h.version)).toEqual(['2025-01-01', '2026-10-01']);
  });
});

describe('isCorpusPopulated', () => {
  it('true when count > 0', async () => {
    count.mockResolvedValue(5);
    expect(await isCorpusPopulated()).toBe(true);
  });
  it('false when count = 0', async () => {
    count.mockResolvedValue(0);
    expect(await isCorpusPopulated()).toBe(false);
  });
  it('false (graceful) on error', async () => {
    count.mockRejectedValue(new Error('db'));
    expect(await isCorpusPopulated()).toBe(false);
  });
});
