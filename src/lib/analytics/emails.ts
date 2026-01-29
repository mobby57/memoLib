/**
 * Email Processing Analytics for MemoLib
 * 
 * Tracks:
 * - Email volume (received, sent, processed)
 * - Processing time
 * - AI accuracy (label classification, summary quality)
 * - Label distribution
 * - Email categories
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmailMetrics {
    totalReceived: number;
    totalSent: number;
    totalProcessed: number;
    averageProcessingTime: number; // In milliseconds
    aiAccuracy: number;            // Percentage
    topLabels: LabelStats[];
    volumeByHour: HourlyVolume[];
}

export interface LabelStats {
    labelName: string;
    count: number;
    percentage: number;
}

export interface HourlyVolume {
    hour: number; // 0-23
    received: number;
    sent: number;
}

export interface EmailTrend {
    date: Date;
    received: number;
    sent: number;
    processed: number;
}

export interface ProcessingStats {
    averageTime: number;      // In milliseconds
    p50: number;              // Median
    p95: number;              // 95th percentile
    p99: number;              // 99th percentile
    slowest: number;          // Maximum
    fastest: number;          // Minimum
}

export interface AIPerformance {
    totalClassifications: number;
    correctClassifications: number;
    accuracy: number;
    precisionByLabel: {
        label: string;
        precision: number;
        recall: number;
        f1Score: number;
    }[];
}

/**
 * Email Analytics Calculator
 */
export class EmailAnalytics {
    /**
     * Get current email metrics
     */
    static async getCurrentMetrics(
        startDate?: Date,
        endDate?: Date
    ): Promise<EmailMetrics> {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate || now;

        // Get email counts
        const [totalReceived, totalSent, totalProcessed] = await Promise.all([
            prisma.email.count({
                where: {
                    receivedAt: {
                        gte: start,
                        lte: end,
                    },
                    direction: 'inbound',
                },
            }),
            prisma.email.count({
                where: {
                    sentAt: {
                        gte: start,
                        lte: end,
                    },
                    direction: 'outbound',
                },
            }),
            prisma.email.count({
                where: {
                    processedAt: {
                        gte: start,
                        lte: end,
                    },
                },
            }),
        ]);

        // Calculate average processing time
        const processedEmails = await prisma.email.findMany({
            where: {
                processedAt: {
                    gte: start,
                    lte: end,
                },
                receivedAt: { not: null },
            },
            select: {
                receivedAt: true,
                processedAt: true,
            },
        });

        const processingTimes = processedEmails
            .filter((e: any) => e.receivedAt && e.processedAt)
            .map((e: any) => {
                return new Date(e.processedAt!).getTime() - new Date(e.receivedAt!).getTime();
            });

        const averageProcessingTime = processingTimes.length > 0
            ? Math.round(processingTimes.reduce((sum: any, t: any) => sum + t, 0) / processingTimes.length)
            : 0;

        // Get label distribution
        const labels = await prisma.emailLabel.groupBy({
            by: ['name'],
            where: {
                email: {
                    receivedAt: {
                        gte: start,
                        lte: end,
                    },
                },
            },
            _count: {
                name: true,
            },
            orderBy: {
                _count: {
                    name: 'desc',
                },
            },
            take: 10,
        });

        const totalLabeled = labels.reduce((sum: any, l: any) => sum + l._count.name, 0);
        const topLabels: LabelStats[] = labels.map((l: any) => ({
            labelName: l.name,
            count: l._count.name,
            percentage: totalLabeled > 0 ? (l._count.name / totalLabeled) * 100 : 0,
        }));

        // Volume by hour
        const volumeByHour = await this.getVolumeByHour(start, end);

        // AI accuracy (simplified - would need ground truth data)
        const aiAccuracy = 85.5; // Placeholder

        return {
            totalReceived,
            totalSent,
            totalProcessed,
            averageProcessingTime,
            aiAccuracy,
            topLabels,
            volumeByHour,
        };
    }

    /**
     * Get email volume by hour of day
     */
    private static async getVolumeByHour(
        startDate: Date,
        endDate: Date
    ): Promise<HourlyVolume[]> {
        const emails = await prisma.email.findMany({
            where: {
                OR: [
                    {
                        receivedAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    {
                        sentAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                ],
            },
            select: {
                receivedAt: true,
                sentAt: true,
                direction: true,
            },
        });

        const hourlyData = new Array(24).fill(null).map((_, hour) => ({
            hour,
            received: 0,
            sent: 0,
        }));

        for (const email of emails) {
            if (email.receivedAt && email.direction === 'inbound') {
                const hour = new Date(email.receivedAt).getHours();
                hourlyData[hour].received += 1;
            }
            if (email.sentAt && email.direction === 'outbound') {
                const hour = new Date(email.sentAt).getHours();
                hourlyData[hour].sent += 1;
            }
        }

        return hourlyData;
    }

    /**
     * Get email trends over time
     */
    static async getEmailTrend(days: number = 30): Promise<EmailTrend[]> {
        const trends: EmailTrend[] = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const [received, sent, processed] = await Promise.all([
                prisma.email.count({
                    where: {
                        receivedAt: {
                            gte: date,
                            lt: nextDay,
                        },
                        direction: 'inbound',
                    },
                }),
                prisma.email.count({
                    where: {
                        sentAt: {
                            gte: date,
                            lt: nextDay,
                        },
                        direction: 'outbound',
                    },
                }),
                prisma.email.count({
                    where: {
                        processedAt: {
                            gte: date,
                            lt: nextDay,
                        },
                    },
                }),
            ]);

            trends.push({
                date,
                received,
                sent,
                processed,
            });
        }

        return trends;
    }

    /**
     * Get processing time statistics
     */
    static async getProcessingStats(
        startDate?: Date,
        endDate?: Date
    ): Promise<ProcessingStats> {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate || now;

        const processedEmails = await prisma.email.findMany({
            where: {
                processedAt: {
                    gte: start,
                    lte: end,
                },
                receivedAt: { not: null },
            },
            select: {
                receivedAt: true,
                processedAt: true,
            },
        });

        const processingTimes = processedEmails
            .filter((e: any) => e.receivedAt && e.processedAt)
            .map((e: any) => new Date(e.processedAt!).getTime() - new Date(e.receivedAt!).getTime())
            .sort((a: any, b: any) => a - b);

        if (processingTimes.length === 0) {
            return {
                averageTime: 0,
                p50: 0,
                p95: 0,
                p99: 0,
                slowest: 0,
                fastest: 0,
            };
        }

        const average = Math.round(
            processingTimes.reduce((sum: any, t: any) => sum + t, 0) / processingTimes.length
        );

        const p50Index = Math.floor(processingTimes.length * 0.50);
        const p95Index = Math.floor(processingTimes.length * 0.95);
        const p99Index = Math.floor(processingTimes.length * 0.99);

        return {
            averageTime: average,
            p50: processingTimes[p50Index],
            p95: processingTimes[p95Index],
            p99: processingTimes[p99Index],
            slowest: processingTimes[processingTimes.length - 1],
            fastest: processingTimes[0],
        };
    }

    /**
     * Get AI performance metrics
     */
    static async getAIPerformance(
        startDate?: Date,
        endDate?: Date
    ): Promise<AIPerformance> {
        // This would require ground truth labels
        // For now, return placeholder data
        return {
            totalClassifications: 1250,
            correctClassifications: 1069,
            accuracy: 85.5,
            precisionByLabel: [
                { label: 'work', precision: 0.89, recall: 0.87, f1Score: 0.88 },
                { label: 'personal', precision: 0.85, recall: 0.83, f1Score: 0.84 },
                { label: 'spam', precision: 0.92, recall: 0.95, f1Score: 0.93 },
                { label: 'important', precision: 0.78, recall: 0.82, f1Score: 0.80 },
            ],
        };
    }

    /**
     * Format processing time
     */
    static formatProcessingTime(ms: number): string {
        if (ms < 1000) {
            return `${ms}ms`;
        } else {
            return `${(ms / 1000).toFixed(2)}s`;
        }
    }

    /**
     * Format percentage
     */
    static formatPercentage(value: number): string {
        return `${value.toFixed(2)}%`;
    }
}
