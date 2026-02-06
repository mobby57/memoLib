/**
 * Compression Utilities & Middleware
 * Phase 5: Optimisations
 *
 * Support for:
 * - gzip compression
 * - Compression level control
 * - Automatic threshold checking
 * - Compression metrics
 */

import { NextResponse } from 'next/server';
import { promisify } from 'util';
import { gunzip, gzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface CompressionMetrics {
  originalSize: number;
  compressedSize: number;
  ratio: number; // percentage
  timeTaken: number; // ms
  threshold: number; // minimum size for compression
}

export interface CompressionOptions {
  level?: number; // 0-9, default 6
  threshold?: number; // minimum bytes to compress (default 1024)
  enabled?: boolean;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  level: 6,
  threshold: 1024, // 1KB
  enabled: true,
};

/**
 * Compress JSON data with gzip
 */
export async function compressData(
  data: string | Buffer,
  options: CompressionOptions = {},
): Promise<{ compressed: Buffer; metrics: CompressionMetrics }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = performance.now();

  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  const originalSize = buffer.length;

  // Don't compress small payloads
  if (originalSize < opts.threshold) {
    return {
      compressed: buffer,
      metrics: {
        originalSize,
        compressedSize: originalSize,
        ratio: 0,
        timeTaken: 0,
        threshold: opts.threshold,
      },
    };
  }

  try {
    const compressed = await gzipAsync(buffer, {
      level: opts.level,
    });

    const compressedSize = compressed.length;
    const ratio = Math.round(((originalSize - compressedSize) / originalSize) * 10000) / 100;
    const timeTaken = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      compressed,
      metrics: {
        originalSize,
        compressedSize,
        ratio,
        timeTaken,
        threshold: opts.threshold,
      },
    };
  } catch (error) {
    console.error('Compression error:', error);
    // Return uncompressed on error
    return {
      compressed: buffer,
      metrics: {
        originalSize,
        compressedSize: originalSize,
        ratio: 0,
        timeTaken: Math.round((performance.now() - startTime) * 100) / 100,
        threshold: opts.threshold,
      },
    };
  }
}

/**
 * Decompress gzip data
 */
export async function decompressData(compressedBuffer: Buffer): Promise<Buffer> {
  try {
    return await gunzipAsync(compressedBuffer);
  } catch (error) {
    console.error('Decompression error:', error);
    throw error;
  }
}

/**
 * Create a compressed JSON response
 */
export async function createCompressedResponse(
  data: Record<string, any>,
  options: CompressionOptions & { status?: number } = {},
): Promise<Response> {
  const jsonString = JSON.stringify(data);
  const { compressed, metrics } = await compressData(jsonString, options);

  // If compression doesn't save more than 20%, send uncompressed
  if (metrics.ratio < 20 || metrics.compressedSize > metrics.originalSize) {
    const response = new NextResponse(jsonString, {
      status: options.status || 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Compression-Metrics': JSON.stringify({
          status: 'uncompressed',
          reason: metrics.ratio < 20 ? 'low-ratio' : 'size-increase',
        }),
      },
    });
    return response;
  }

  // Send compressed
  const response = new NextResponse(compressed as unknown as BodyInit, {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
      'X-Compression-Metrics': JSON.stringify({
        status: 'compressed',
        originalSize: metrics.originalSize,
        compressedSize: metrics.compressedSize,
        ratio: `${metrics.ratio}%`,
        timeTaken: `${metrics.timeTaken}ms`,
      }),
    },
  });

  return response;
}

/**
 * Compression middleware for large GET responses
 * Usage: return await withCompression(data, { level: 6, threshold: 1024 })
 */
export async function withCompression(
  data: Record<string, any>,
  status: number = 200,
  options: CompressionOptions = {},
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!opts.enabled) {
    return new NextResponse(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return createCompressedResponse(data, { ...opts, status });
}

/**
 * Check if compression would be beneficial
 */
export async function shouldCompress(
  data: any,
  threshold: number = 1024,
): Promise<{
  should: boolean;
  originalSize: number;
  estimatedSavings: number; // percentage
}> {
  const jsonString = JSON.stringify(data);
  const originalSize = jsonString.length;

  if (originalSize < threshold) {
    return {
      should: false,
      originalSize,
      estimatedSavings: 0,
    };
  }

  // Estimate compression ratio (typically 40-60% for JSON)
  const estimatedSavings = Math.round(Math.random() * 20 + 40); // 40-60%

  return {
    should: true,
    originalSize,
    estimatedSavings,
  };
}

/**
 * Get compression statistics
 */
export function getCompressionRecommendation(dataSize: number): {
  recommended: boolean;
  reason: string;
  level: number;
  threshold: number;
} {
  if (dataSize < 512) {
    return {
      recommended: false,
      reason: 'Data too small for compression overhead',
      level: 0,
      threshold: 1024,
    };
  }

  if (dataSize < 5000) {
    return {
      recommended: true,
      reason: 'Use light compression (level 1-3)',
      level: 2,
      threshold: 1024,
    };
  }

  if (dataSize < 100000) {
    return {
      recommended: true,
      reason: 'Use moderate compression (level 4-6)',
      level: 6,
      threshold: 1024,
    };
  }

  return {
    recommended: true,
    reason: 'Use high compression (level 7-9)',
    level: 8,
    threshold: 1024,
  };
}

/**
 * Compression preset configurations
 */
export const COMPRESSION_PRESETS = {
  fast: {
    level: 1,
    threshold: 1024,
    enabled: true,
    description: 'Fast compression, suitable for real-time responses',
  },
  balanced: {
    level: 6,
    threshold: 1024,
    enabled: true,
    description: 'Balanced compression, default option',
  },
  maximum: {
    level: 9,
    threshold: 1024,
    enabled: true,
    description: 'Maximum compression, for large static responses',
  },
  disabled: {
    level: 0,
    threshold: Infinity,
    enabled: false,
    description: 'No compression',
  },
};
