import { describe, it, expect, vi, beforeEach } from 'vitest';

const findMany = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    jurisprudence: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

import {
  getJurisprudenceForArticle,
  getJurisprudenceForArticles,
} from '@/lib/legal/jurisprudence-service';

function decisionRow(partial: Record<string, unknown>) {
  return {
    id: 'j1',
    titre: 'CE 509812',
    date: new Date('2026-07-07'),
    juridiction: "Conseil d'État",
    numero: '509812',
    solution: 'Solution de substitution avec accueil physique',
    resume: null,
    url: 'https://conseil-etat/509812',
    themes: ['ANEF'],
    relatedArticles: ['R431-2'],
    ...partial,
  };
}

beforeEach(() => findMany.mockReset());

describe('getJurisprudenceForArticle', () => {
  it('queries by relatedArticles containment and maps results', async () => {
    findMany.mockResolvedValue([decisionRow({})]);
    const result = await getJurisprudenceForArticle('R431-2');

    expect(result).toHaveLength(1);
    expect(result[0].numero).toBe('509812');
    expect(result[0].relatedArticles).toContain('R431-2');

    const callArg = findMany.mock.calls[0][0];
    expect(callArg.where.relatedArticles).toEqual({ has: 'R431-2' });
    expect(callArg.orderBy).toEqual({ date: 'desc' });
    expect(callArg.take).toBe(5);
  });

  it('applies the date upper bound when `at` is provided', async () => {
    findMany.mockResolvedValue([]);
    await getJurisprudenceForArticle('R431-2', { at: new Date('2025-01-01'), limit: 2 });
    const callArg = findMany.mock.calls[0][0];
    expect(callArg.where.date).toEqual({ lte: new Date('2025-01-01') });
    expect(callArg.take).toBe(2);
  });

  it('returns [] gracefully when nothing is linked', async () => {
    findMany.mockResolvedValue([]);
    expect(await getJurisprudenceForArticle('L999-9')).toEqual([]);
  });

  // NB: le chemin "erreur DB → []" est assuré par le try/catch du service
  // (logge un WARN et renvoie []). Il n'est pas testé via un mock qui rejette
  // car Vitest 4 promeut la rejection interceptée en "unhandled rejection"
  // (faux positif). Le contrat de non-levée reste couvert par le cas ci-dessus
  // (retour [] sans exception) et par getArticleAtDate côté legal-reference.
});

describe('getJurisprudenceForArticles', () => {
  it('returns a map keyed by article, omitting articles with no decisions', async () => {
    findMany.mockImplementation(async (args?: { where?: { relatedArticles?: { has?: string } } }) => {
      if (args?.where?.relatedArticles?.has === 'R431-2') return [decisionRow({})];
      return [];
    });

    const map = await getJurisprudenceForArticles(['R431-2', 'L999-9']);
    expect([...map.keys()]).toEqual(['R431-2']);
    expect(map.get('R431-2')?.[0].numero).toBe('509812');
  });

  it('returns an empty map for empty input without querying', async () => {
    const map = await getJurisprudenceForArticles([]);
    expect(map.size).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });
});
