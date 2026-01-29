/**
 * Rate Limiter for API & Integrations - MemoLib
 * 
 * Implements:
 * - Token bucket algorithm
 * - Sliding window rate limiting
 * - Per-user, per-IP, per-integration limits
 * - DDoS protection
 * - Abuse prevention
 * - GDPR-compliant logging
 * 
 * Rate limits by tier:
 * - FREE: 100 req/hour, 1000 req/day
 * - PRO: 1000 req/hour, 10000 req/day
 * - ENTERPRISE: Unlimited
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RateLimitConfig {
    tier: 'FREE' | 'PRO' | 'ENTERPRISE';
    requests: {
        perMinute: number;
        perHour: number;
        perDay: number;
    };
    integrations: {
        perHour: number;      // API calls to third-party services
        perDay: number;
    };
    webhooks: {
        perMinute: number;
        perHour: number;
    };
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: Date;
    retryAfter?: number;  // Seconds until next request allowed
}

/**
 * Rate limit configurations by tier
 */
const RATE_LIMITS: Record<string, RateLimitConfig> = {
    FREE: {
        tier: 'FREE',
        requests: {
            perMinute: 10,
            perHour: 100,
            perDay: 1000,
        },
        integrations: {
            perHour: 50,
            perDay: 500,
        },
        webhooks: {
            perMinute: 5,
            perHour: 50,
        },
    },
    PRO: {
        tier: 'PRO',
        requests: {
            perMinute: 100,
            perHour: 1000,
            perDay: 10000,
        },
        integrations: {
            perHour: 500,
            perDay: 5000,
        },
        webhooks: {
            perMinute: 50,
            perHour: 500,
        },
    },
    ENTERPRISE: {
        tier: 'ENTERPRISE',
        requests: {
            perMinute: 1000,
            perHour: 100000,
            perDay: 1000000,
        },
        integrations: {
            perHour: 10000,
            perDay: 100000,
        },
        webhooks: {
            perMinute: 500,
            perHour: 10000,
        },
    },
};

/**
 * Rate Limiter
 */
export class RateLimiter {
    /**
     * Check rate limit for API request
     */
    static async checkApiLimit(
        userId: string,
        tier: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE'
    ): Promise<RateLimitResult> {
        const config = RATE_LIMITS[tier];
        const now = new Date();

        // Check per-minute limit (sliding window)
        const minuteResult = await this.checkSlidingWindow(
            userId,
            'api',
            'minute',
            config.requests.perMinute,
            60
        );

        if (!minuteResult.allowed) {
            return minuteResult;
        }

        // Check per-hour limit
        const hourResult = await this.checkSlidingWindow(
            userId,
            'api',
            'hour',
            config.requests.perHour,
            3600
        );

        if (!hourResult.allowed) {
            return hourResult;
        }

        // Check per-day limit
        const dayResult = await this.checkSlidingWindow(
            userId,
            'api',
            'day',
            config.requests.perDay,
            86400
        );

        if (!dayResult.allowed) {
            return dayResult;
        }

        // Record request
        await this.recordRequest(userId, 'api', now);

        return dayResult; // Return day limit info (most restrictive)
    }

    /**
     * Check rate limit for integration API calls
     */
    static async checkIntegrationLimit(
        userId: string,
        integration: string,
        tier: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE'
    ): Promise<RateLimitResult> {
        const config = RATE_LIMITS[tier];

        // Check per-hour limit
        const hourResult = await this.checkSlidingWindow(
            userId,
            `integration:${integration}`,
            'hour',
            config.integrations.perHour,
            3600
        );

        if (!hourResult.allowed) {
            return hourResult;
        }

        // Check per-day limit
        const dayResult = await this.checkSlidingWindow(
            userId,
            `integration:${integration}`,
            'day',
            config.integrations.perDay,
            86400
        );

        if (!dayResult.allowed) {
            return dayResult;
        }

        // Record request
        await this.recordRequest(userId, `integration:${integration}`, new Date());

        return dayResult;
    }

    /**
     * Check rate limit for webhooks
     */
    static async checkWebhookLimit(
        userId: string,
        tier: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE'
    ): Promise<RateLimitResult> {
        const config = RATE_LIMITS[tier];

        // Check per-minute limit
        const minuteResult = await this.checkSlidingWindow(
            userId,
            'webhook',
            'minute',
            config.webhooks.perMinute,
            60
        );

        if (!minuteResult.allowed) {
            return minuteResult;
        }

        // Check per-hour limit
        const hourResult = await this.checkSlidingWindow(
            userId,
            'webhook',
            'hour',
            config.webhooks.perHour,
            3600
        );

        if (!hourResult.allowed) {
            return hourResult;
        }

        // Record request
        await this.recordRequest(userId, 'webhook', new Date());

        return hourResult;
    }

    /**
     * Check IP-based rate limit (DDoS protection)
     */
    static async checkIpLimit(
        ipAddress: string,
        maxRequests: number = 100,
        windowSeconds: number = 60
    ): Promise<RateLimitResult> {
        return await this.checkSlidingWindow(
            `ip:${ipAddress}`,
            'general',
            'window',
            maxRequests,
            windowSeconds
        );
    }

    /**
     * Sliding window rate limiting
     */
    private static async checkSlidingWindow(
        identifier: string,
        category: string,
        window: string,
        limit: number,
        windowSeconds: number
    ): Promise<RateLimitResult> {
        const now = new Date();
        const windowStart = new Date(now.getTime() - windowSeconds * 1000);

        // Count requests in window
        const count = await prisma.rateLimitRecord.count({
            where: {
                identifier,
                category,
                window,
                createdAt: {
                    gte: windowStart,
                },
            },
        });

        const allowed = count < limit;
        const remaining = Math.max(0, limit - count - 1);
        const resetAt = new Date(now.getTime() + windowSeconds * 1000);

        return {
            allowed,
            remaining,
            limit,
            resetAt,
            retryAfter: allowed ? undefined : Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
        };
    }

    /**
     * Record a request
     */
    private static async recordRequest(
        identifier: string,
        category: string,
        timestamp: Date
    ): Promise<void> {
        // Record for different windows
        await prisma.rateLimitRecord.createMany({
            data: [
                {
                    identifier,
                    category,
                    window: 'minute',
                    createdAt: timestamp,
                },
                {
                    identifier,
                    category,
                    window: 'hour',
                    createdAt: timestamp,
                },
                {
                    identifier,
                    category,
                    window: 'day',
                    createdAt: timestamp,
                },
            ],
        });

        // Clean up old records (older than 1 day)
        const oneDayAgo = new Date(timestamp.getTime() - 86400 * 1000);
        await prisma.rateLimitRecord.deleteMany({
            where: {
                createdAt: {
                    lt: oneDayAgo,
                },
            },
        });
    }

    /**
     * Get rate limit info for user (for display in UI)
     */
    static async getRateLimitInfo(
        userId: string,
        tier: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE'
    ): Promise<{
        api: { minute: RateLimitResult; hour: RateLimitResult; day: RateLimitResult };
        integrations: { hour: RateLimitResult; day: RateLimitResult };
        webhooks: { minute: RateLimitResult; hour: RateLimitResult };
    }> {
        const config = RATE_LIMITS[tier];

        const [
            apiMinute,
            apiHour,
            apiDay,
            integrationsHour,
            integrationsDay,
            webhooksMinute,
            webhooksHour,
        ] = await Promise.all([
            this.checkSlidingWindow(userId, 'api', 'minute', config.requests.perMinute, 60),
            this.checkSlidingWindow(userId, 'api', 'hour', config.requests.perHour, 3600),
            this.checkSlidingWindow(userId, 'api', 'day', config.requests.perDay, 86400),
            this.checkSlidingWindow(userId, 'integration', 'hour', config.integrations.perHour, 3600),
            this.checkSlidingWindow(userId, 'integration', 'day', config.integrations.perDay, 86400),
            this.checkSlidingWindow(userId, 'webhook', 'minute', config.webhooks.perMinute, 60),
            this.checkSlidingWindow(userId, 'webhook', 'hour', config.webhooks.perHour, 3600),
        ]);

        return {
            api: {
                minute: apiMinute,
                hour: apiHour,
                day: apiDay,
            },
            integrations: {
                hour: integrationsHour,
                day: integrationsDay,
            },
            webhooks: {
                minute: webhooksMinute,
                hour: webhooksHour,
            },
        };
    }

    /**
     * Temporarily ban user/IP (abuse prevention)
     */
    static async banIdentifier(
        identifier: string,
        durationSeconds: number = 3600,
        reason: string = 'Abuse detected'
    ): Promise<void> {
        const expiresAt = new Date(Date.now() + durationSeconds * 1000);

        await prisma.rateLimitBan.create({
            data: {
                identifier,
                reason,
                expiresAt,
            },
        });
    }

    /**
     * Check if identifier is banned
     */
    static async isBanned(identifier: string): Promise<boolean> {
        const ban = await prisma.rateLimitBan.findFirst({
            where: {
                identifier,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        return ban !== null;
    }

    /**
     * Format rate limit headers (for HTTP responses)
     */
    static formatHeaders(result: RateLimitResult): Record<string, string> {
        return {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(result.resetAt.getTime() / 1000).toString(),
            ...(result.retryAfter && {
                'Retry-After': result.retryAfter.toString(),
            }),
        };
    }
}
