import {
  getEmailIngestionMetricsSnapshot,
  recordEmailIngestion,
  resetEmailIngestionMetrics,
} from '../../../lib/email/ingestion-metrics';

describe('email ingestion metrics health status', () => {
  beforeEach(() => {
    resetEmailIngestionMetrics();
  });

  it('stays healthy on successful flow', () => {
    for (let i = 0; i < 5; i += 1) {
      recordEmailIngestion({
        outcome: 'success',
        durationMs: 120,
        category: 'appointment-request',
        urgency: 'medium',
      });
    }

    const snapshot = getEmailIngestionMetricsSnapshot();

    expect(snapshot.health.status).toBe('healthy');
    expect(snapshot.rates.errorRate).toBe('0.00');
    expect(snapshot.health.reasons).toContain('Volume faible, tendance a confirmer');
  });

  it('becomes degraded when error rate crosses degraded threshold', () => {
    for (let i = 0; i < 18; i += 1) {
      recordEmailIngestion({
        outcome: 'success',
        durationMs: 150,
      });
    }

    for (let i = 0; i < 2; i += 1) {
      recordEmailIngestion({
        outcome: 'invalid_payload',
        durationMs: 160,
        error: 'payload invalide',
      });
    }

    const snapshot = getEmailIngestionMetricsSnapshot();

    expect(snapshot.health.status).toBe('degraded');
    expect(snapshot.rates.errorRate).toBe('10.00');
    expect(snapshot.health.reasons.some((reason: string) => reason.includes('Taux derreur degrade'))).toBe(true);
  });

  it('becomes critical when configuration errors are detected', () => {
    recordEmailIngestion({
      outcome: 'config_error',
      durationMs: 10,
      error: 'secret manquant',
    });

    const snapshot = getEmailIngestionMetricsSnapshot();

    expect(snapshot.health.status).toBe('critical');
    expect(snapshot.health.reasons).toContain('Configuration invalide detectee');
    expect(snapshot.health.metrics.configErrorCount).toBe(1);
  });
});
