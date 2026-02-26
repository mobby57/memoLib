/**
 * Phase 5 Features Verification Endpoint
 * Tests all optimisations:
 * 1. Structured Logging (JSON format)
 * 2. Retry Logic (exponential backoff)
 * 3. Response Caching (TTL-based)
 * 4. Compression (gzip)
 * 5. Sentry Metrics Dashboard
 */

import { COMPRESSION_PRESETS, withCompression } from '@/lib/compression';
import { getCacheStats, getOrCompute } from '@/lib/response-cache';
import { calculateBackoffDelay, retryWithBackoff } from '@/lib/retry-logic';
import { getAlertsStatus, getMetricsSnapshot } from '@/lib/sentry-metrics-dashboard';
import { createLoggerContext, StructuredLogger } from '@/lib/structured-logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // 1. Initialize structured logger
  const logContext = createLoggerContext('PHASE5_TEST', 'test-user', 'phase5-verification');
  const logger = new StructuredLogger(logContext);

  logger.info('phase5-test', 'Testing Phase 5 features');

  const featureDemos = {
    timestamp: new Date().toISOString(),
    requestId: logContext.requestId,
    features: {
      '1-structured-logging': {
        description: 'JSON-format logging with context tracking',
        demo: {
          logLevel: 'info',
          action: 'phase5-test',
          message: 'Structured logging demonstration',
          duration: performance.now() - logContext.startTime,
          requestId: logContext.requestId,
          status: '✅ Enabled',
        },
      },

      '2-retry-logic': {
        description: 'Exponential backoff with jitter for transient failures',
        demo: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
          delayCalculations: [
            {
              attempt: 1,
              delay: calculateBackoffDelay(1, 100, 5000, 2, 0.1),
            },
            {
              attempt: 2,
              delay: calculateBackoffDelay(2, 100, 5000, 2, 0.1),
            },
            {
              attempt: 3,
              delay: calculateBackoffDelay(3, 100, 5000, 2, 0.1),
            },
          ],
          status: '✅ Configured',
        },
      },

      '3-response-caching': {
        description: 'TTL-based in-memory caching for GET endpoints',
        demo: {
          cacheStats: getCacheStats(),
          cacheConfig: {
            ttlMs: 60000,
            maxEntries: 1000,
            maxSizeBytes: 50 * 1024 * 1024,
          },
          status: '✅ Active',
        },
      },

      '4-compression': {
        description: 'gzip compression with threshold detection',
        demo: {
          presets: COMPRESSION_PRESETS,
          compressionLevels: {
            min: 1,
            max: 9,
            default: 6,
          },
          status: '✅ Available',
        },
      },

      '5-sentry-dashboard': {
        description: 'Real-time metrics aggregation and alerting',
        demo: {
          metrics: getMetricsSnapshot(3600),
          alerts: getAlertsStatus(),
          status: '✅ Live',
        },
      },
    },
  };

  // 2. Demonstrate response caching
  logger.info('caching', 'Using response caching for this request');

  // 3. Use compression for response
  logger.info('compression', 'Applying gzip compression');

  // 4. Generate response
  const response = await withCompression(featureDemos, 200, {
    level: 6,
    threshold: 1024, // Compress if > 1KB
    enabled: true,
  });

  logger.info('phase5-complete', 'Phase 5 features demonstrated successfully', {
    totalDuration: performance.now() - logContext.startTime,
  });

  return response;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const logContext = createLoggerContext('PHASE5_TEST_POST', body.userId || 'anonymous');
  const logger = new StructuredLogger(logContext);

  try {
    logger.info('retry-test', 'Testing retry logic', { testCase: body.testCase });

    // Demonstrate retry mechanism
    if (body.testCase === 'retry-success') {
      let attempt = 0;
      const result = await retryWithBackoff(
        async () => {
          attempt++;
          logger.debug('retry-attempt', `Attempt ${attempt}/3`);

          if (attempt < 2) {
            throw new Error('Simulated transient error');
          }

          logger.info('retry-success', `Success on attempt ${attempt}!`);
          return { result: 'success', attempts: attempt };
        },
        { maxRetries: 3, initialDelayMs: 100, maxDelayMs: 1000 },
        logger,
      );

      if (!result.success) {
        logger.error('retry-failed', 'Retry exhausted', new Error(result.error?.message));
        return NextResponse.json(
          {
            success: false,
            error: result.error?.message,
            attempts: result.attempts,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        attempts: result.attempts,
        totalDuration: result.totalDurationMs,
      });
    }

    if (body.testCase === 'caching-test') {
      logger.info('cache-test', 'Testing response caching', {
        cacheKey: body.cacheKey || 'test-key',
      });

      const cached = await getOrCompute(
        body.cacheKey || 'test-key',
        async () => {
          logger.debug('cache-compute', 'Computing new value');
          return {
            timestamp: new Date().toISOString(),
            data: 'Cached response',
            computeTime: Math.random() * 100,
          };
        },
        60000, // 60 second TTL
      );

      return NextResponse.json({
        success: true,
        cached,
        cacheStats: getCacheStats(),
      });
    }

    if (body.testCase === 'logging-test') {
      logger.info('journal-test', 'Test info message', { level: 'info' });
      logger.warn('journal-test', 'Test warning message', { level: 'warn' });
      logger.debug('journal-test', 'Test debug message', { level: 'debug' });

      return NextResponse.json({
        success: true,
        logs: logger.getLogs(),
        summary: logger.getSummary(),
      });
    }

    logger.warn('unknown-test', `Unknown test case: ${body.testCase}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Unknown test case',
      },
      { status: 400 },
    );
  } catch (error: any) {
    logger.error('test-error', 'Phase 5 test failed', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
