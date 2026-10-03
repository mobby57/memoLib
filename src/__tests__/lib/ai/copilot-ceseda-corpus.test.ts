import { describe, it, expect, vi, beforeEach } from 'vitest';

const getArticlesAtDate = vi.fn();
vi.mock('@/lib/legal/legal-reference-service', () => ({
  getArticlesAtDate: (...a: unknown[]) => getArticlesAtDate(...a),
}));

const getJurisprudenceForArticles = vi.fn();
vi.mock('@/lib/legal/jurisprudence-service', () => ({
  getJurisprudenceForArticles: (...a: unknown[]) => getJurisprudenceForArticles(...a),
}));

import {
  extractArticleKey,
  enrichCesedaAnalysisWithCorpus,
  analyzeDossierWithCorpus,
  type DossierInput,
} from '@/lib/ai/copilot/copilot-ceseda';

beforeEach(() => {
  getArticlesAtDate.mockReset();
  getJurisprudenceForArticles.mockReset();
  // Par défaut : aucune jurisprudence liée (le fallback s'applique).
  getJurisprudenceForArticles.mockResolvedValue(new Map());
});

describe('extractArticleKey', () => {
  it('extracts a corpus key from a copilot reference label', () => {
    expect(extractArticleKey('Art. L611-1 CESEDA')).toBe('L611-1');
    expect(extractArticleKey('Art. R431-2 CESEDA')).toBe('R431-2');
    expect(extractArticleKey('Art. L. 423-23 CESEDA')).toBe('L423-23');
  });

  it('returns null for non-CESEDA references', () => {
    expect(extractArticleKey('Art. 8 CEDH')).toBeNull();
    expect(extractArticleKey('Convention de Genève 1951')).toBeNull();
  });
});

describe('enrichCesedaAnalysisWithCorpus', () => {
  const base = {
    procedure: 'TITRE_SEJOUR',
    articles: [
      { reference: 'Art. R431-2 CESEDA', objet: 'ancien objet', pertinence: 'applicable' },
      { reference: 'Art. 8 CEDH', objet: 'Vie privée', pertinence: 'transversal' },
    ],
    jurisprudences: [],
    recours: [],
  };

  it('overlays corpus data on matching articles and flags provenance', async () => {
    getArticlesAtDate.mockResolvedValue([
      {
        article: 'R431-2',
        version: '2026-10-01',
        summary: 'Dépôt via ANEF',
        content: 'Texte en vigueur au 2026-10-01.',
        validFrom: new Date('2026-10-01'),
        validUntil: null,
        legifranceUrl: 'https://legifrance/R431-2',
        eurlexUrl: null,
      },
    ]);

    const result = await enrichCesedaAnalysisWithCorpus(base, new Date('2026-10-05'));

    const r431 = result.articles.find((a) => a.reference.includes('R431-2'))!;
    expect(r431.source).toBe('corpus');
    expect(r431.texte).toBe('Texte en vigueur au 2026-10-01.');
    expect(r431.version).toBe('2026-10-01');
    expect(r431.legifranceUrl).toBe('https://legifrance/R431-2');

    const cedh = result.articles.find((a) => a.reference.includes('CEDH'))!;
    expect(cedh.source).toBe('fallback'); // non présent dans le corpus CESEDA

    expect(result.corpusUsed).toBe(true);
    expect(result.referenceDate).toBe(new Date('2026-10-05').toISOString());
    // Seules les clés CESEDA extraites sont demandées au corpus.
    expect(getArticlesAtDate).toHaveBeenCalledWith(['R431-2'], { at: new Date('2026-10-05') });
  });

  it('marks all articles as fallback when corpus is empty', async () => {
    getArticlesAtDate.mockResolvedValue([]);
    const result = await enrichCesedaAnalysisWithCorpus(base, new Date('2026-10-05'));
    expect(result.corpusUsed).toBe(false);
    expect(result.articles.every((a) => a.source === 'fallback')).toBe(true);
  });
});

describe('enrichCesedaAnalysisWithCorpus — jurisprudence liée', () => {
  const base = {
    procedure: 'TITRE_SEJOUR',
    articles: [{ reference: 'Art. R431-2 CESEDA', objet: 'o', pertinence: 'p' }],
    jurisprudences: [
      { reference: 'CE, 19 avril 1991, Belgacem', principe: 'Contrôle proportionnalité', pertinence: 'transversal' },
    ],
    recours: [],
  };

  it('attaches real linked decisions and tags them source=linked', async () => {
    getArticlesAtDate.mockResolvedValue([]);
    getJurisprudenceForArticles.mockResolvedValue(
      new Map([
        [
          'R431-2',
          [
            {
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
            },
          ],
        ],
      ]),
    );

    const result = await enrichCesedaAnalysisWithCorpus(base, new Date('2026-10-05'));
    expect(result.jurisprudences).toHaveLength(1);
    const j = result.jurisprudences[0];
    expect(j.source).toBe('linked');
    expect(j.numero).toBe('509812');
    expect(j.reference).toContain('509812');
    expect(j.pertinence).toContain('R431-2');
    // La requête de jurisprudence utilise la date de référence du dossier.
    expect(getJurisprudenceForArticles).toHaveBeenCalledWith(['R431-2'], {
      at: new Date('2026-10-05'),
      limit: 3,
    });
  });

  it('falls back to JURISPRUDENCE_CLE constants when no decision is linked', async () => {
    getArticlesAtDate.mockResolvedValue([]);
    getJurisprudenceForArticles.mockResolvedValue(new Map());

    const result = await enrichCesedaAnalysisWithCorpus(base, new Date('2026-10-05'));
    expect(result.jurisprudences).toHaveLength(1);
    expect(result.jurisprudences[0].source).toBe('fallback');
    expect(result.jurisprudences[0].reference).toContain('Belgacem');
  });

  it('falls back when the jurisprudence service throws', async () => {
    getArticlesAtDate.mockResolvedValue([]);
    getJurisprudenceForArticles.mockImplementation(async () => {
      throw new Error('db down');
    });

    const result = await enrichCesedaAnalysisWithCorpus(base, new Date('2026-10-05'));
    expect(result.jurisprudences[0].source).toBe('fallback');
  });
});

describe('analyzeDossierWithCorpus', () => {
  const dossier: DossierInput = {
    id: 'd1',
    typeDossier: 'OQTF',
    statut: 'ouvert',
    dateCreation: '2025-03-14T00:00:00.000Z',
    client: {},
    checklistItems: [],
    legalDeadlines: [],
    emails: [],
    documents: [],
  };

  it('uses the dossier creation date as the reference date for article versions', async () => {
    getArticlesAtDate.mockResolvedValue([]);
    const analysis = await analyzeDossierWithCorpus(dossier);
    expect(analysis.cesedaAnalysis.referenceDate).toBe(new Date('2025-03-14T00:00:00.000Z').toISOString());
    // La date de référence passée au corpus correspond à la date du dossier.
    const [, callOpts] = getArticlesAtDate.mock.calls[0];
    expect((callOpts as { at: Date }).at.toISOString()).toBe('2025-03-14T00:00:00.000Z');
  });

  it('preserves the full base analysis structure while enriching the CESEDA section', async () => {
    getArticlesAtDate.mockResolvedValue([]);
    const analysis = await analyzeDossierWithCorpus(dossier);
    // Les autres sections de l'analyse restent produites.
    expect(analysis.cesedaAnalysis.procedure).toBe('OQTF');
    expect(analysis.disclaimer).toContain('Copilote CESEDA');
    expect(Array.isArray(analysis.actions)).toBe(true);
    // La section CESEDA porte bien la date de référence.
    expect(analysis.cesedaAnalysis.referenceDate).toBeDefined();
  });
});
