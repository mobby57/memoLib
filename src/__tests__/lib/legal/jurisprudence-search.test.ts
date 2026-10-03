import { describe, it, expect } from 'vitest';
import {
  normalizeArticleKey,
  buildPostgresSearch,
  filterFallbackRefs,
  CESEDA_REFS,
  type CesedaRef,
} from '@/lib/legal/jurisprudence-search';

describe('normalizeArticleKey', () => {
  it('normalizes common formats to a canonical key', () => {
    expect(normalizeArticleKey('L. 611-1')).toBe('L611-1');
    expect(normalizeArticleKey('L611-1')).toBe('L611-1');
    expect(normalizeArticleKey('r431-2')).toBe('R431-2');
    expect(normalizeArticleKey('Art. D123-4 CESEDA')).toBe('D123-4');
  });

  it('returns null when no article pattern is present', () => {
    expect(normalizeArticleKey('OQTF')).toBeNull();
    expect(normalizeArticleKey('')).toBeNull();
    expect(normalizeArticleKey('Art. 8 CEDH')).toBeNull();
  });
});

describe('buildPostgresSearch', () => {
  it('no filter: only the full-text param, limit/offset at $2/$3', () => {
    const plan = buildPostgresSearch('oqtf', 'all', null);
    expect(plan.where).toBe(`"searchVector" @@ plainto_tsquery('french', $1)`);
    expect(plan.params).toEqual(['oqtf']);
    expect(plan.limitIdx).toBe(2);
    expect(plan.offsetIdx).toBe(3);
  });

  it('theme only: adds $2 = ANY(themes), uppercased theme', () => {
    const plan = buildPostgresSearch('oqtf', 'oqtf', null);
    expect(plan.where).toBe(
      `"searchVector" @@ plainto_tsquery('french', $1) AND $2 = ANY(themes)`,
    );
    expect(plan.params).toEqual(['oqtf', 'OQTF']);
    expect(plan.limitIdx).toBe(3);
    expect(plan.offsetIdx).toBe(4);
  });

  it('article only: adds relatedArticles containment with a text[] param', () => {
    const plan = buildPostgresSearch('oqtf', 'all', 'R431-2');
    expect(plan.where).toBe(
      `"searchVector" @@ plainto_tsquery('french', $1) AND "relatedArticles" @> $2::text[]`,
    );
    expect(plan.params).toEqual(['oqtf', ['R431-2']]);
    expect(plan.limitIdx).toBe(3);
    expect(plan.offsetIdx).toBe(4);
  });

  it('theme + article: both clauses, correct positional indexing', () => {
    const plan = buildPostgresSearch('oqtf', 'titre_sejour', 'R431-2');
    expect(plan.where).toBe(
      `"searchVector" @@ plainto_tsquery('french', $1) AND $2 = ANY(themes) AND "relatedArticles" @> $3::text[]`,
    );
    expect(plan.params).toEqual(['oqtf', 'TITRE_SEJOUR', ['R431-2']]);
    expect(plan.limitIdx).toBe(4);
    expect(plan.offsetIdx).toBe(5);
  });

  it('keeps user input only as positional params (never interpolated into SQL)', () => {
    const malicious = "x'; DROP TABLE \"Jurisprudence\";--";
    const plan = buildPostgresSearch(malicious, 'all', null);
    // La valeur n'apparaît PAS dans la clause SQL ; elle reste un paramètre $1.
    expect(plan.where).not.toContain('DROP TABLE');
    expect(plan.params[0]).toBe(malicious);
  });
});

describe('filterFallbackRefs', () => {
  it('filters by article key exactly when article is provided', () => {
    const res = filterFallbackRefs('ignored query', 'all', 'L431-2');
    expect(res).toHaveLength(1);
    expect(res[0].numero).toBe('L431-2');
  });

  it('returns [] when the article key is absent from the static set', () => {
    expect(filterFallbackRefs('x', 'all', 'R999-9')).toEqual([]);
  });

  it('falls back to text search over titre/resume/numero/themes when no article', () => {
    const byTheme = filterFallbackRefs('oqtf', 'all', null);
    expect(byTheme.some((r) => r.numero === 'L511-1')).toBe(true);

    const byNumero = filterFallbackRefs('l741-1', 'all', null);
    expect(byNumero.some((r) => r.numero === 'L741-1')).toBe(true);
  });

  it('caps results at 10', () => {
    const many: CesedaRef[] = Array.from({ length: 25 }, (_, i) => ({
      id: `A${i}`,
      titre: 'match asile',
      date: '2024-01-01',
      juridiction: 'CESEDA',
      numero: `L${i}-1`,
      resume: 'asile',
      url: '',
      themes: ['ASILE'],
    }));
    expect(filterFallbackRefs('asile', 'all', null, many)).toHaveLength(10);
  });

  it('article filter takes precedence over the text query', () => {
    // query would match several refs, but article forces a single exact ref.
    const res = filterFallbackRefs('séjour', 'all', 'L313-11');
    expect(res).toHaveLength(1);
    expect(res[0].numero).toBe('L313-11');
  });

  it('exposes a non-empty static CESEDA set', () => {
    expect(CESEDA_REFS.length).toBeGreaterThan(0);
    expect(CESEDA_REFS.every((r) => r.numero && r.titre)).toBe(true);
  });
});
