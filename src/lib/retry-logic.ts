/**
 * Advanced Retry Logic with Exponential Backoff
 * Phase 5: Optimisations
 *
 * Handles transient failures:
 * - Database connection timeouts
 * - Deadlocks
 * - Rate limit errors
 * - Temporary service unavailability
 */

import * as Sentry from '@sentry/nextjs';
import { StructuredLogger } from './structured-logger';

export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterFactor?: number;
  retryableErrors?: string[]; // Prisma error codes to retry
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDurationMs: number;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitterFactor: 0.1, // 10% random jitter
  retryableErrors: ['P1000', 'P1001', 'P1008', 'P1009', 'P5014'], // Connection errors, timeout
};

/**
 * Default retryable Prisma errors
 * P1000: Unknown client error
 * P1001: Can't reach database server
 * P1008: Operations timed out
 * P1009: Database already exists
 * P5014: Query engine timed out
 */
const RETRYABLE_PRISMA_ERRORS = new Set(['P1000', 'P1001', 'P1008', 'P1009', 'P5014']);

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any, retryableErrors?: string[]): boolean {
  const errorCodes = retryableErrors || DEFAULT_CONFIG.retryableErrors;
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Check explicit error codes
  if (errorCodes.includes(errorCode)) {
    return true;
  }

  // Check for common patterns
  if (
    errorMessage.includes('connect ECONNREFUSED') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('deadlock') ||
    errorMessage.includes('too many connections') ||
    errorMessage.includes('ETIMEDOUT')
  ) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  jitterFactor: number,
): number {
  // Exponential backoff
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter
  const jitter = cappedDelay * jitterFactor * Math.random();
  return Math.round(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn Function to retry
 * @param config Retry configuration
 * @param logger Optional structured logger for logging attempts
 * @returns Retry result with data, error, and attempt count
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
  logger?: StructuredLogger,
): Promise<RetryResult<T>> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = performance.now();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      logger?.debug('retry', `Attempt ${attempt}/${mergedConfig.maxRetries}`);

      const data = await fn();
      const totalDurationMs = Math.round(performance.now() - startTime);

      logger?.info('retry', `Success after ${attempt} attempt(s)`, {
        attempts: attempt,
        totalDurationMs,
      });

      return {
        success: true,
        data,
        attempts: attempt,
        totalDurationMs,
      };
    } catch (error) {
      lastError = error as Error;
      const isRetryable = isRetryableError(lastError, mergedConfig.retryableErrors);

      logger?.warn('retry', `Attempt ${attempt} failed`, {
        error: (lastError as any).code || lastError.message,
        retryable: isRetryable,
        attempt,
      });

      // If error is not retryable, fail immediately
      if (!isRetryable) {
        const totalDurationMs = Math.round(performance.now() - startTime);
        logger?.error('retry', 'Non-retryable error, giving up', lastError, {
          attempts: attempt,
          totalDurationMs,
        });

        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalDurationMs,
        };
      }

      // If max retries reached, fail
      if (attempt === mergedConfig.maxRetries) {
        const totalDurationMs = Math.round(performance.now() - startTime);
        logger?.error(
          'retry',
          `Max retries (${mergedConfig.maxRetries}) reached`,
          lastError,
          {
            attempts: attempt,
            totalDurationMs,
          },
        );

        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalDurationMs,
        };
      }

      // Calculate backoff delay
      const delayMs = calculateBackoffDelay(
        attempt,
        mergedConfig.initialDelayMs,
        mergedConfig.maxDelayMs,
        mergedConfig.backoffMultiplier,
        mergedConfig.jitterFactor,
      );

      logger?.debug('retry', `Waiting ${delayMs}ms before retry`);
      await sleep(delayMs);
    }
  }

  // Should not reach here due to maxRetries check above
  const totalDurationMs = Math.round(performance.now() - startTime);
  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts: mergedConfig.maxRetries,
    totalDurationMs,
  };
}

/**
 * Helper to retry Prisma operations
 */
export async function retryPrismaOperation<T>(
  fn: () => Promise<T>,
  operationName: string,
  maxAttempts: number = 3,
  logger?: StructuredLogger,
): Promise<RetryResult<T>> {
  logger?.info('prisma-retry', `Starting Prisma operation: ${operationName}`);

  const result = await retryWithBackoff(
    fn,
    {
      maxRetries: maxAttempts,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      retryableErrors: Array.from(RETRYABLE_PRISMA_ERRORS),
    },
    logger,
  );

  if (!result.success && result.error) {
    logger?.error('prisma-retry', `Prisma operation failed: ${operationName}`, result.error, {
      totalAttempts: result.attempts,
      totalDurationMs: result.totalDurationMs,
    });

    // Report to Sentry
    Sentry.captureException(result.error, {
      tags: {
        operation: operationName,
        finalAttempt: result.attempts,
      },
      extra: {
        totalDurationMs: result.totalDurationMs,
      },
    });
  }

  return result;
}

/**
 * Retry a webhook operation (generic)
 */
export async function retryWebhookOperation<T>(
  fn: () => Promise<T>,
  operationName: string,
  logger?: StructuredLogger,
): Promise<RetryResult<T>> {
  return retryWithBackoff(
    fn,
    {
      maxRetries: 3,
      initialDelayMs: 200,
      maxDelayMs: 2000,
    },
    logger,
  );
}
