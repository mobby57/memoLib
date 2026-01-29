/**
 * User Engagement Analytics for MemoLib
 * 
 * Tracks:
 * - DAU (Daily Active Users)
 * - MAU (Monthly Active Users)
 * - WAU (Weekly Active Users)
 * - Session Duration
 * - Retention Cohorts
 * - Feature Usage
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EngagementMetrics {
    dau: number;              // Daily Active Users
    wau: number;              // Weekly Active Users
    mau: number;              // Monthly Active Users
    dauMauRatio: number;      // DAU/MAU ratio (stickiness)
    averageSessionDuration: number; // In seconds
    averageSessionsPerUser: number;
    bounceRate: number;       // Percentage of single-session users
}

export interface RetentionCohort {
    cohortDate: Date;         // When users signed up
    users: number;            // Total users in cohort
    retention: {
        day0: number;           // Sign-up day (100%)
        day1: number;
        day7: number;
        day14: number;
        day30: number;
        day60: number;
        day90: number;
    };
}

export interface FeatureUsage {
    featureName: string;
    totalUses: number;
    uniqueUsers: number;
    averageUsesPerUser: number;
    percentage: number;       // Of total users
}

export interface SessionAnalytics {
    date: Date;
    sessions: number;
    averageDuration: number;  // In seconds
    uniqueUsers: number;
}

/**
 * Engagement Analytics Calculator
 */
export class EngagementAnalytics {
    /**
     * Get current engagement metrics
     */
    static async getCurrentMetrics(): Promise<EngagementMetrics> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // DAU - users active today
        const dau = await prisma.auditLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: {
                    gte: today,
                },
                action: {
                    in: ['login', 'page_view', 'email_read', 'email_send'],
                },
            },
        });

        // WAU - users active in last 7 days
        const wau = await prisma.auditLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: {
                    gte: weekAgo,
                },
                action: {
                    in: ['login', 'page_view', 'email_read', 'email_send'],
                },
            },
        });

        // MAU - users active in last 30 days
        const mau = await prisma.auditLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: {
                    gte: monthAgo,
                },
                action: {
                    in: ['login', 'page_view', 'email_read', 'email_send'],
                },
            },
        });

        // DAU/MAU ratio (stickiness)
        const dauMauRatio = mau.length > 0 ? (dau.length / mau.length) * 100 : 0;

        // Session analytics (using session table if available)
        const sessions = await prisma.session.findMany({
            where: {
                createdAt: {
                    gte: today,
                },
            },
            select: {
                createdAt: true,
                expires: true,
                userId: true,
            },
        });

        // Calculate average session duration (simplified)
        const sessionDurations = sessions.map((s: any) => {
            const created = new Date(s.createdAt);
            const expires = new Date(s.expires);
            // Assume actual duration is 1/10th of expiry time
            return Math.min((expires.getTime() - created.getTime()) / 1000, 3600); // Max 1 hour
        });

        const averageSessionDuration = sessionDurations.length > 0
            ? Math.round(sessionDurations.reduce((sum: any, d: any) => sum + d, 0) / sessionDurations.length)
            : 0;

        // Average sessions per user
        const uniqueSessionUsers = new Set(sessions.map((s: any) => s.userId)).size;
        const averageSessionsPerUser = uniqueSessionUsers > 0
            ? sessions.length / uniqueSessionUsers
            : 0;

        // Bounce rate (users with only 1 session today)
        const userSessionCounts = new Map<string, number>();
        for (const session of sessions) {
            const userId = session.userId || 'anonymous';
            userSessionCounts.set(userId, (userSessionCounts.get(userId) || 0) + 1);
        }
        const singleSessionUsers = Array.from(userSessionCounts.values()).filter(count => count === 1).length;
        const bounceRate = uniqueSessionUsers > 0
            ? (singleSessionUsers / uniqueSessionUsers) * 100
            : 0;

        return {
            dau: dau.length,
            wau: wau.length,
            mau: mau.length,
            dauMauRatio,
            averageSessionDuration,
            averageSessionsPerUser,
            bounceRate,
        };
    }

    /**
     * Calculate retention cohorts
     */
    static async getRetentionCohorts(months: number = 6): Promise<RetentionCohort[]> {
        const cohorts: RetentionCohort[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(cohortDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            // Get users who signed up in this cohort
            const cohortUsers = await prisma.user.findMany({
                where: {
                    createdAt: {
                        gte: cohortDate,
                        lt: nextMonth,
                    },
                },
                select: {
                    id: true,
                    createdAt: true,
                },
            });

            const totalUsers = cohortUsers.length;

            if (totalUsers === 0) {
                continue;
            }

            // Calculate retention for each period
            const retention = {
                day0: 100, // All users on signup day
                day1: await this.calculateRetentionRate(cohortUsers, 1),
                day7: await this.calculateRetentionRate(cohortUsers, 7),
                day14: await this.calculateRetentionRate(cohortUsers, 14),
                day30: await this.calculateRetentionRate(cohortUsers, 30),
                day60: await this.calculateRetentionRate(cohortUsers, 60),
                day90: await this.calculateRetentionRate(cohortUsers, 90),
            };

            cohorts.push({
                cohortDate,
                users: totalUsers,
                retention,
            });
        }

        return cohorts;
    }

    /**
     * Calculate retention rate for a cohort after N days
     */
    private static async calculateRetentionRate(
        cohortUsers: { id: string; createdAt: Date }[],
        daysAfter: number
    ): Promise<number> {
        if (cohortUsers.length === 0) return 0;

        // Check how many users were active N days after signup
        const activeUsers = await Promise.all(
            cohortUsers.map(async (user) => {
                const checkDate = new Date(user.createdAt);
                checkDate.setDate(checkDate.getDate() + daysAfter);
                const nextDay = new Date(checkDate);
                nextDay.setDate(nextDay.getDate() + 1);

                const activity = await prisma.auditLog.findFirst({
                    where: {
                        userId: user.id,
                        createdAt: {
                            gte: checkDate,
                            lt: nextDay,
                        },
                    },
                });

                return activity !== null;
            })
        );

        const retainedCount = activeUsers.filter(Boolean).length;
        return (retainedCount / cohortUsers.length) * 100;
    }

    /**
     * Get feature usage statistics
     */
    static async getFeatureUsage(
        startDate?: Date,
        endDate?: Date
    ): Promise<FeatureUsage[]> {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate || now;

        // Get all audit logs for feature usage
        const logs = await prisma.auditLog.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
                action: {
                    not: 'login', // Exclude login events
                },
            },
            select: {
                action: true,
                userId: true,
            },
        });

        // Group by feature (action)
        const featureMap = new Map<string, { users: Set<string>; count: number }>();

        for (const log of logs) {
            if (!featureMap.has(log.action)) {
                featureMap.set(log.action, { users: new Set(), count: 0 });
            }

            const feature = featureMap.get(log.action)!;
            feature.users.add(log.userId);
            feature.count += 1;
        }

        // Get total users
        const totalUsers = await prisma.user.count();

        // Convert to array
        return Array.from(featureMap.entries()).map(([featureName, data]) => ({
            featureName,
            totalUses: data.count,
            uniqueUsers: data.users.size,
            averageUsesPerUser: data.users.size > 0 ? data.count / data.users.size : 0,
            percentage: totalUsers > 0 ? (data.users.size / totalUsers) * 100 : 0,
        }))
            .sort((a, b) => b.totalUses - a.totalUses);
    }

    /**
     * Get session analytics over time
     */
    static async getSessionTrend(days: number = 30): Promise<SessionAnalytics[]> {
        const trends: SessionAnalytics[] = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const sessions = await prisma.session.findMany({
                where: {
                    createdAt: {
                        gte: date,
                        lt: nextDay,
                    },
                },
                select: {
                    createdAt: true,
                    expires: true,
                    userId: true,
                },
            });

            const sessionDurations = sessions.map((s: any) => {
                const created = new Date(s.createdAt);
                const expires = new Date(s.expires);
                return Math.min((expires.getTime() - created.getTime()) / 1000, 3600);
            });

            const averageDuration = sessionDurations.length > 0
                ? Math.round(sessionDurations.reduce((sum: any, d: any) => sum + d, 0) / sessionDurations.length)
                : 0;

            const uniqueUsers = new Set(sessions.map((s: any) => s.userId)).size;

            trends.push({
                date,
                sessions: sessions.length,
                averageDuration,
                uniqueUsers,
            });
        }

        return trends;
    }

    /**
     * Format duration (seconds to human readable)
     */
    static formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    /**
     * Format percentage
     */
    static formatPercentage(value: number): string {
        return `${value.toFixed(2)}%`;
    }
}
