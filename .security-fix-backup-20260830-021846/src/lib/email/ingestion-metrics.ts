export type IngestionOutcome =
  | 'success'
  | 'duplicate'
  | 'unauthorized'
  | 'invalid_json'
  | 'invalid_payload'
  | 'tenant_not_found'
  | 'config_error'
  | 'attachment_error'
  | 'server_error';

export type IngestionHealthStatus = 'healthy' | 'degraded' | 'critical';

export interface EmailIngestionMetricEvent {
  outcome: IngestionOutcome;
  durationMs: number;
  tenantId?: string;
  category?: string;
  urgency?: string;
  hasAttachments?: boolean;
  to?: string;
  error?: string;
  at?: number;
}

interface EmailIngestionMetricsState {
  startedAt: number;
  total: number;
  outcomes: Record<IngestionOutcome, number>;
  categoryCount: Record<string, number>;
  urgencyCount: Record<string, number>;
  tenantCount: Record<string, number>;
  withAttachments: number;
  durations: number[];
  recentErrors: Array<{ at: number; outcome: IngestionOutcome; error?: string }>;
}

const MAX_DURATIONS = 500;
const MAX_RECENT_ERRORS = 100;

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const HEALTH_THRESHOLDS = {
  minSampleSize: readNumberEnv('EMAIL_INGESTION_HEALTH_MIN_SAMPLE_SIZE', 10),
  degradedErrorRatePercent: readNumberEnv('EMAIL_INGESTION_DEGRADED_ERROR_RATE_PERCENT', 5),
  criticalErrorRatePercent: readNumberEnv('EMAIL_INGESTION_CRITICAL_ERROR_RATE_PERCENT', 15),
  degradedP95Ms: readNumberEnv('EMAIL_INGESTION_DEGRADED_P95_MS', 1200),
  criticalP95Ms: readNumberEnv('EMAIL_INGESTION_CRITICAL_P95_MS', 2500),
  degradedSuccessRatePercent: readNumberEnv('EMAIL_INGESTION_DEGRADED_SUCCESS_RATE_PERCENT', 90),
  criticalSuccessRatePercent: readNumberEnv('EMAIL_INGESTION_CRITICAL_SUCCESS_RATE_PERCENT', 80),
};

const state: EmailIngestionMetricsState = {
  startedAt: Date.now(),
  total: 0,
  outcomes: {
    success: 0,
    duplicate: 0,
    unauthorized: 0,
    invalid_json: 0,
    invalid_payload: 0,
    tenant_not_found: 0,
    config_error: 0,
    attachment_error: 0,
    server_error: 0,
  },
  categoryCount: {},
  urgencyCount: {},
  tenantCount: {},
  withAttachments: 0,
  durations: [],
  recentErrors: [],
};

export function recordEmailIngestion(event: EmailIngestionMetricEvent): void {
  const at = event.at ?? Date.now();

  state.total += 1;
  state.outcomes[event.outcome] += 1;

  if (event.category) {
    state.categoryCount[event.category] = (state.categoryCount[event.category] || 0) + 1;
  }

  if (event.urgency) {
    state.urgencyCount[event.urgency] = (state.urgencyCount[event.urgency] || 0) + 1;
  }

  if (event.tenantId) {
    state.tenantCount[event.tenantId] = (state.tenantCount[event.tenantId] || 0) + 1;
  }

  if (event.hasAttachments) {
    state.withAttachments += 1;
  }

  if (Number.isFinite(event.durationMs) && event.durationMs >= 0) {
    state.durations.push(event.durationMs);
    if (state.durations.length > MAX_DURATIONS) {
      state.durations.splice(0, state.durations.length - MAX_DURATIONS);
    }
  }

  if (event.outcome !== 'success' || event.error) {
    state.recentErrors.unshift({ at, outcome: event.outcome, error: event.error });
    if (state.recentErrors.length > MAX_RECENT_ERRORS) {
      state.recentErrors.splice(MAX_RECENT_ERRORS);
    }
  }
}

export function getEmailIngestionMetricsSnapshot() {
  const sortedDurations = [...state.durations].sort((a, b) => a - b);
  const avgDurationMs =
    sortedDurations.length > 0
      ? sortedDurations.reduce((acc, value) => acc + value, 0) / sortedDurations.length
      : 0;

  const percentile = (p: number): number => {
    if (sortedDurations.length === 0) return 0;
    const index = Math.max(0, Math.min(sortedDurations.length - 1, Math.ceil((p / 100) * sortedDurations.length) - 1));
    return sortedDurations[index] || 0;
  };

  const success = state.outcomes.success;
  const duplicate = state.outcomes.duplicate;
  const errorCount = state.total - success - duplicate;
  const successRate = state.total > 0 ? (success / state.total) * 100 : 0;
  const duplicateRate = state.total > 0 ? (duplicate / state.total) * 100 : 0;
  const errorRate = state.total > 0 ? (errorCount / state.total) * 100 : 0;
  const p95DurationMs = percentile(95);
  const health = evaluateHealthStatus({
    total: state.total,
    errorRate,
    successRate,
    p95DurationMs,
    configErrorCount: state.outcomes.config_error,
    serverErrorCount: state.outcomes.server_error,
  });

  return {
    startedAt: new Date(state.startedAt).toISOString(),
    uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
    total: state.total,
    outcomes: { ...state.outcomes },
    rates: {
      successRate: successRate.toFixed(2),
      duplicateRate: duplicateRate.toFixed(2),
      errorRate: errorRate.toFixed(2),
      attachmentRate: state.total > 0 ? ((state.withAttachments / state.total) * 100).toFixed(2) : '0.00',
    },
    performance: {
      avgDurationMs: Math.round(avgDurationMs * 100) / 100,
      p50DurationMs: percentile(50),
      p95DurationMs,
      p99DurationMs: percentile(99),
      maxDurationMs: sortedDurations.length > 0 ? sortedDurations[sortedDurations.length - 1] : 0,
    },
    health,
    dimensions: {
      categoryCount: { ...state.categoryCount },
      urgencyCount: { ...state.urgencyCount },
      tenantCount: { ...state.tenantCount },
    },
    recentErrors: [...state.recentErrors],
  };
}

export function resetEmailIngestionMetrics(): void {
  state.startedAt = Date.now();
  state.total = 0;

  (Object.keys(state.outcomes) as IngestionOutcome[]).forEach((key) => {
    state.outcomes[key] = 0;
  });

  state.categoryCount = {};
  state.urgencyCount = {};
  state.tenantCount = {};
  state.withAttachments = 0;
  state.durations = [];
  state.recentErrors = [];
}

function evaluateHealthStatus(input: {
  total: number;
  errorRate: number;
  successRate: number;
  p95DurationMs: number;
  configErrorCount: number;
  serverErrorCount: number;
}): {
  status: IngestionHealthStatus;
  reasons: string[];
  thresholds: Record<string, number>;
  metrics: Record<string, number>;
} {
  const reasons: string[] = [];

  if (input.total > 0 && input.configErrorCount > 0) {
    reasons.push('Configuration invalide detectee');
  }

  if (input.total > 0 && input.serverErrorCount > 0) {
    reasons.push('Erreurs serveur detectees');
  }

  if (input.errorRate >= HEALTH_THRESHOLDS.criticalErrorRatePercent) {
    reasons.push(`Taux derreur eleve (${input.errorRate.toFixed(2)}%)`);
  } else if (input.errorRate >= HEALTH_THRESHOLDS.degradedErrorRatePercent) {
    reasons.push(`Taux derreur degrade (${input.errorRate.toFixed(2)}%)`);
  }

  if (input.p95DurationMs >= HEALTH_THRESHOLDS.criticalP95Ms) {
    reasons.push(`Latence p95 critique (${input.p95DurationMs}ms)`);
  } else if (input.p95DurationMs >= HEALTH_THRESHOLDS.degradedP95Ms) {
    reasons.push(`Latence p95 degradee (${input.p95DurationMs}ms)`);
  }

  if (input.successRate > 0 && input.successRate <= HEALTH_THRESHOLDS.criticalSuccessRatePercent) {
    reasons.push(`Taux de succes critique (${input.successRate.toFixed(2)}%)`);
  } else if (input.successRate > 0 && input.successRate <= HEALTH_THRESHOLDS.degradedSuccessRatePercent) {
    reasons.push(`Taux de succes degrade (${input.successRate.toFixed(2)}%)`);
  }

  let status: IngestionHealthStatus = 'healthy';

  const isCritical =
    input.configErrorCount > 0 ||
    input.errorRate >= HEALTH_THRESHOLDS.criticalErrorRatePercent ||
    input.p95DurationMs >= HEALTH_THRESHOLDS.criticalP95Ms ||
    (input.successRate > 0 && input.successRate <= HEALTH_THRESHOLDS.criticalSuccessRatePercent);

  const isDegraded =
    input.errorRate >= HEALTH_THRESHOLDS.degradedErrorRatePercent ||
    input.p95DurationMs >= HEALTH_THRESHOLDS.degradedP95Ms ||
    (input.successRate > 0 && input.successRate <= HEALTH_THRESHOLDS.degradedSuccessRatePercent);

  if (isCritical) {
    status = 'critical';
  } else if (isDegraded) {
    status = 'degraded';
  }

  if (input.total < HEALTH_THRESHOLDS.minSampleSize && reasons.length === 0) {
    reasons.push('Volume faible, tendance a confirmer');
  }

  return {
    status,
    reasons,
    thresholds: {
      degradedErrorRatePercent: HEALTH_THRESHOLDS.degradedErrorRatePercent,
      criticalErrorRatePercent: HEALTH_THRESHOLDS.criticalErrorRatePercent,
      degradedP95Ms: HEALTH_THRESHOLDS.degradedP95Ms,
      criticalP95Ms: HEALTH_THRESHOLDS.criticalP95Ms,
      degradedSuccessRatePercent: HEALTH_THRESHOLDS.degradedSuccessRatePercent,
      criticalSuccessRatePercent: HEALTH_THRESHOLDS.criticalSuccessRatePercent,
      minSampleSize: HEALTH_THRESHOLDS.minSampleSize,
    },
    metrics: {
      total: input.total,
      errorRatePercent: Number(input.errorRate.toFixed(2)),
      successRatePercent: Number(input.successRate.toFixed(2)),
      p95DurationMs: input.p95DurationMs,
      configErrorCount: input.configErrorCount,
      serverErrorCount: input.serverErrorCount,
    },
  };
}
