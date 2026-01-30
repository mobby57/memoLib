/**
 * API Response Compression Middleware
 * 
 * Implements Brotli/Gzip compression for API responses
 * Reduces payload size and improves transfer speed
 * 
 * GDPR compliant - no data modification, only compression
 */

import { NextRequest, NextResponse } from 'next/server';
import { gzip, brotliCompress } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

// Minimum size to compress (bytes)
const MIN_COMPRESS_SIZE = 1024; // 1KB

// Compressible MIME types
const COMPRESSIBLE_TYPES = [
    'application/json',
    'application/javascript',
    'text/html',
    'text/css',
    'text/plain',
    'text/xml',
    'application/xml',
    'image/svg+xml',
];

/**
 * Compression middleware
 */
export async function compressResponse(
    request: NextRequest,
    response: NextResponse
): Promise<NextResponse> {
    // Skip if already compressed
    if (response.headers.get('Content-Encoding')) {
        return response;
    }

    // Check Accept-Encoding header
    const acceptEncoding = request.headers.get('Accept-Encoding') || '';
    const supportsBrotli = acceptEncoding.includes('br');
    const supportsGzip = acceptEncoding.includes('gzip');

    if (!supportsBrotli && !supportsGzip) {
        return response; // Client doesn't support compression
    }

    // Check content type
    const contentType = response.headers.get('Content-Type') || '';
    const isCompressible = COMPRESSIBLE_TYPES.some(type =>
        contentType.includes(type)
    );

    if (!isCompressible) {
        return response; // Not a compressible type
    }

    // Get response body
    const body = await response.text();

    // Check size threshold
    if (body.length < MIN_COMPRESS_SIZE) {
        return response; // Too small to benefit from compression
    }

    try {
        let compressed: Buffer;
        let encoding: string;

        // Prefer Brotli (better compression)
        if (supportsBrotli) {
            compressed = await brotliAsync(Buffer.from(body));
            encoding = 'br';
        } else {
            compressed = await gzipAsync(Buffer.from(body));
            encoding = 'gzip';
        }

        // Only use compression if it reduces size
        if (compressed.length < body.length) {
            // Create new response with compressed body
            const headers = new Headers(response.headers);
            headers.set('Content-Encoding', encoding);
            headers.set('Content-Length', compressed.length.toString());
            headers.set('Vary', 'Accept-Encoding');
            headers.delete('Content-Length'); // Let Next.js set this

            const arrayBuf = compressed.buffer.slice(
                compressed.byteOffset,
                compressed.byteOffset + compressed.byteLength
            ) as ArrayBuffer;
            return new NextResponse(arrayBuf, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        }
    } catch (error) {
        console.error('Compression error:', error);
    }

    // Return original response if compression fails or doesn't help
    return response;
}

/**
 * Compression utility functions
 */
export class CompressionUtils {
    /**
     * Compress string with Brotli
     */
    static async brotli(data: string): Promise<Buffer> {
        return brotliAsync(Buffer.from(data));
    }

    /**
     * Compress string with Gzip
     */
    static async gzip(data: string): Promise<Buffer> {
        return gzipAsync(Buffer.from(data));
    }

    /**
     * Get compression ratio
     */
    static getCompressionRatio(original: number, compressed: number): number {
        return Math.round((1 - compressed / original) * 100);
    }

    /**
     * Format bytes
     */
    static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

/**
 * API endpoint wrapper with compression
 */
export function withCompression(
    handler: (req: NextRequest) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        const response = await handler(req);
        return compressResponse(req, response);
    };
}

/**
 * Compression stats for monitoring
 */
export class CompressionMonitor {
    private static stats = {
        requests: 0,
        compressed: 0,
        originalSize: 0,
        compressedSize: 0,
    };

    static record(originalSize: number, compressedSize: number) {
        this.stats.requests++;
        this.stats.compressed++;
        this.stats.originalSize += originalSize;
        this.stats.compressedSize += compressedSize;
    }

    static getStats() {
        const {
            requests,
            compressed,
            originalSize,
            compressedSize,
        } = this.stats;

        const compressionRate = requests > 0 ? (compressed / requests) * 100 : 0;
        const avgRatio = originalSize > 0
            ? CompressionUtils.getCompressionRatio(originalSize, compressedSize)
            : 0;

        return {
            totalRequests: requests,
            compressedRequests: compressed,
            compressionRate: Math.round(compressionRate * 100) / 100,
            originalSize: CompressionUtils.formatBytes(originalSize),
            compressedSize: CompressionUtils.formatBytes(compressedSize),
            savedBytes: CompressionUtils.formatBytes(originalSize - compressedSize),
            avgCompressionRatio: avgRatio,
        };
    }

    static reset() {
        this.stats = {
            requests: 0,
            compressed: 0,
            originalSize: 0,
            compressedSize: 0,
        };
    }
}
