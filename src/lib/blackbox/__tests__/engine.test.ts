import { runBlackbox } from '@/lib/blackbox/engine';

describe('blackbox engine', () => {
  const originalSecret = process.env.BLACKBOX_SECRET;

  beforeEach(() => {
    process.env.BLACKBOX_SECRET = '0123456789abcdef0123456789abcdef';
  });

  afterAll(() => {
    if (typeof originalSecret === 'undefined') {
      delete process.env.BLACKBOX_SECRET;
      return;
    }

    process.env.BLACKBOX_SECRET = originalSecret;
  });

  it('returns a signed result', () => {
    const result = runBlackbox({ value: 42, category: 'demo', riskFactor: 1.2 });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['approve', 'review', 'reject']).toContain(result.decision);
    expect(typeof result.proof).toBe('string');
    expect(result.proof).toHaveLength(64);
  });

  it('clamps riskFactor and keeps deterministic output for same input', () => {
    const resultA = runBlackbox({ value: 10, category: 'A', riskFactor: 999 });
    const resultB = runBlackbox({ value: 10, category: 'A', riskFactor: 999 });

    expect(resultA.score).toBe(resultB.score);
    expect(resultA.decision).toBe(resultB.decision);
  });

  it('throws when BLACKBOX_SECRET is missing', () => {
    delete process.env.BLACKBOX_SECRET;

    expect(() => runBlackbox({ value: 10 })).toThrow(
      'BLACKBOX_SECRET must be defined with at least 32 characters.'
    );
  });
});
