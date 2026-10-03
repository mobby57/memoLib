import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeArticleNumber,
  parsePisteDate,
  isOpenEndedDate,
  articleToLegalReference,
  ingestArticleVersion,
  extractArticleReferences,
  type ExistingVersion,
  type LegalReferencePrisma,
} from '@/lib/legal/ingestion-core';
import type { Article } from '@/types/legifrance';

function makeDb(existing: ExistingVersion[]) {
  const update = vi.fn().mockResolvedValue({});
  const create = vi.fn().mockResolvedValue({});
  const findMany = vi.fn().mockResolvedValue(existing);
  const db: LegalReferencePrisma = {
    findMany: (...a: unknown[]) => findMany(...(a as [])),
    update: (...a: unknown[]) => update(...(a as [])),
    create: (...a: unknown[]) => create(...(a as [])),
  };
  return { db, update, create, findMany };
}

function pisteArticle(partial: Partial<Article>): Article {
  return {
    id: 'LEGIARTI000000000001',
    num: 'R431-2',
    etat: 'VIGUEUR',
    dateDebut: '2026-10-01',
    dateFin: '2999-01-01',
    titre: 'Autorité compétente',
    texte: 'Texte en vigueur de R431-2.',
    cid: 'LEGITEXT000006070158',
    ...partial,
  };
}

const FIXED_NOW = new Date('2026-10-02T00:00:00.000Z');
const opts = { idFactory: () => 'generated-id', now: () => FIXED_NOW };

beforeEach(() => vi.clearAllMocks());

describe('normalizeArticleNumber', () => {
  it('normalizes various PISTE formats to a canonical key', () => {
    expect(normalizeArticleNumber('L. 611-1')).toBe('L611-1');
    expect(normalizeArticleNumber('L611-1')).toBe('L611-1');
    expect(normalizeArticleNumber('r431-2')).toBe('R431-2');
    expect(normalizeArticleNumber('D 123-4')).toBe('D123-4');
  });
});

describe('parsePisteDate / isOpenEndedDate', () => {
  it('parses ISO and null-ish values', () => {
    expect(parsePisteDate('2026-10-01')?.toISOString().slice(0, 10)).toBe('2026-10-01');
    expect(parsePisteDate('')).toBeNull();
    expect(parsePisteDate(null)).toBeNull();
    expect(parsePisteDate(undefined)).toBeNull();
  });

  it('treats far-future dates (>=2999) as open-ended', () => {
    expect(isOpenEndedDate(new Date('2999-01-01'))).toBe(true);
    expect(isOpenEndedDate(new Date('2026-10-01'))).toBe(false);
    expect(isOpenEndedDate(null)).toBe(true);
  });
});

describe('articleToLegalReference', () => {
  it('maps a PISTE article, deriving version from validFrom and nulling open-ended end', () => {
    const data = articleToLegalReference(pisteArticle({}), { category: 'TITRE_SEJOUR' });
    expect(data.code).toBe('CESEDA');
    expect(data.article).toBe('R431-2');
    expect(data.version).toBe('2026-10-01');
    expect(data.validUntil).toBeNull(); // 2999 → open-ended
    expect(data.isActive).toBe(true);
    expect(data.category).toBe('TITRE_SEJOUR');
    expect(data.keywords).toBe('[]');
    expect(data.legifrance_url).toContain('LEGIARTI000000000001');
  });

  it('marks a closed version inactive', () => {
    const data = articleToLegalReference(
      pisteArticle({ dateDebut: '2025-01-01', dateFin: '2026-10-01', etat: 'ABROGE' }),
    );
    expect(data.validUntil?.toISOString().slice(0, 10)).toBe('2026-10-01');
    expect(data.isActive).toBe(false);
  });
});

describe('ingestArticleVersion — versioning non destructif', () => {
  it('creates the first version when the article is new', async () => {
    const { db, create, update } = makeDb([]);
    const result = await ingestArticleVersion(db, pisteArticle({}), { ...opts, category: 'TITRE_SEJOUR' });

    expect(result.action).toBe('created');
    expect(result.closedPrevious).toBe(0);
    expect(create).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    const created = create.mock.calls[0][0].data;
    expect(created.id).toBe('generated-id');
    expect(created.article).toBe('R431-2');
    expect(created.version).toBe('2026-10-01');
  });

  it('updates in place when the same version already exists (no history rewrite)', async () => {
    const existing: ExistingVersion[] = [
      { id: 'existing-1', code: 'CESEDA', article: 'R431-2', version: '2026-10-01', validFrom: new Date('2026-10-01'), validUntil: null, isActive: true },
    ];
    const { db, create, update } = makeDb(existing);
    const result = await ingestArticleVersion(db, pisteArticle({ texte: 'Texte corrigé.' }), opts);

    expect(result.action).toBe('updated');
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].where.id).toBe('existing-1');
    expect(update.mock.calls[0][0].data.content).toBe('Texte corrigé.');
  });

  it('closes the previous open version and inserts the new one', async () => {
    const existing: ExistingVersion[] = [
      { id: 'old-1', code: 'CESEDA', article: 'R431-2', version: '2025-01-01', validFrom: new Date('2025-01-01'), validUntil: null, isActive: true },
    ];
    const { db, create, update } = makeDb(existing);

    // Nouvelle version en vigueur au 2026-10-01.
    const result = await ingestArticleVersion(db, pisteArticle({ dateDebut: '2026-10-01' }), opts);

    expect(result.action).toBe('created');
    expect(result.closedPrevious).toBe(1);

    // L'ancienne version a été clôturée au début de la nouvelle, PAS supprimée/écrasée.
    expect(update).toHaveBeenCalledTimes(1);
    const closeCall = update.mock.calls[0][0];
    expect(closeCall.where.id).toBe('old-1');
    expect(closeCall.data.validUntil).toEqual(new Date('2026-10-01'));
    expect(closeCall.data.isActive).toBe(false);

    // La nouvelle version a été insérée.
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data.version).toBe('2026-10-01');
  });

  it('does not close a previous version that starts after the new one', async () => {
    const existing: ExistingVersion[] = [
      { id: 'future-1', code: 'CESEDA', article: 'R431-2', version: '2027-01-01', validFrom: new Date('2027-01-01'), validUntil: null, isActive: true },
    ];
    const { db, create, update } = makeDb(existing);
    const result = await ingestArticleVersion(db, pisteArticle({ dateDebut: '2026-10-01' }), opts);

    expect(result.action).toBe('created');
    expect(result.closedPrevious).toBe(0);
    expect(update).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe('extractArticleReferences', () => {
  it('extracts and dedupes CESEDA article keys cited in a decision text', () => {
    const text =
      'Le Conseil d\'État, au visa des articles R. 431-2 et R431-3 du CESEDA, et de L611-1, ' +
      'rappelle que R. 431-2 impose une solution de substitution.';
    expect(extractArticleReferences(text).sort()).toEqual(['L611-1', 'R431-2', 'R431-3']);
  });

  it('returns [] for empty text', () => {
    expect(extractArticleReferences('')).toEqual([]);
  });
});
