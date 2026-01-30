/**
 * Revenue Analytics System for MemoLib
 * 
 * Tracks and analyzes:
 * - MRR (Monthly Recurring Revenue)
 * - ARR (Annual Recurring Revenue)
 * - Churn Rate
 * - LTV (Lifetime Value)
 * - CAC (Customer Acquisition Cost)
 * - Revenue Growth
 */

// Prisma désactivé pour build/demo
const prisma: any = new Proxy({}, { get: () => async () => [] });

export interface RevenueMetrics {
    mrr: number;              // Monthly Recurring Revenue (in cents)
    arr: number;              // Annual Recurring Revenue (in cents)
    churnRate: number;        // Percentage (0-100)
    ltv: number;              // Lifetime Value per customer (in cents)
    cac: number;              // Customer Acquisition Cost (in cents)
    growthRate: number;       // Month-over-month growth (percentage)
    activeSubscriptions: number;
    newSubscriptions: number; // This month
    canceledSubscriptions: number; // This month
    averageRevenuePerUser: number; // ARPU (in cents)
}

export interface RevenueTrend {
    date: Date;
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    newSubscriptions: number;
    canceledSubscriptions: number;
}

export interface RevenueByPlan {
    planId: string;
    planName: string;
    subscribers: number;
    mrr: number;
    percentage: number; // Of total MRR
}

export interface ChurnAnalysis {
    totalChurned: number;
    churnRate: number;
    churnReasons: {
        reason: string;
        count: number;
        percentage: number;
    }[];
    averageLifetime: number; // In days
}

/**
 * Revenue Analytics Calculator
 */
export class RevenueAnalytics {
    /**
     * Calculate current revenue metrics
     */
    static async getCurrentMetrics(
        startDate?: Date,
        endDate?: Date
    ): Promise<RevenueMetrics> {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate || now;

        // Get all active subscriptions
        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                status: 'active',
            },
            include: {
                plan: true,
            },
        });

        // Calculate MRR (sum of all active monthly recurring revenue)
        const mrr = activeSubscriptions.reduce((total: any, sub: any) => {
            const price = sub.plan.price;
            const interval = sub.plan.interval;

            // Convert to monthly
            if (interval === 'month') {
                return total + price;
            } else if (interval === 'year') {
                return total + Math.round(price / 12);
            }
            return total;
        }, 0);

        // Calculate ARR (MRR * 12)
        const arr = mrr * 12;

        // Get new subscriptions this month
        const newSubscriptions = await prisma.subscription.count({
            where: {
                status: 'active',
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
        });

        // Get canceled subscriptions this month
        const canceledSubscriptions = await prisma.subscription.count({
            where: {
                status: 'canceled',
                canceledAt: {
                    gte: start,
                    lte: end,
                },
            },
        });

        // Calculate churn rate
        const previousMonthStart = new Date(start);
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);

        const previousMonthActive = await prisma.subscription.count({
            where: {
                status: 'active',
                createdAt: {
                    lt: start,
                },
            },
        });

        const churnRate = previousMonthActive > 0
            ? (canceledSubscriptions / previousMonthActive) * 100
            : 0;

        // Calculate LTV (Lifetime Value)
        const averageCustomerLifetime = await this.calculateAverageCustomerLifetime();
        const arpu = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0;
        const ltv = Math.round(arpu * averageCustomerLifetime);

        // Calculate CAC (simplified - would need marketing spend data)
        const cac = 5000; // $50 (placeholder)

        // Calculate growth rate
        const previousMRR = await this.getMRRForMonth(previousMonthStart);
        const growthRate = previousMRR > 0
            ? ((mrr - previousMRR) / previousMRR) * 100
            : 0;

        return {
            mrr,
            arr,
            churnRate,
            ltv,
            cac,
            growthRate,
            activeSubscriptions: activeSubscriptions.length,
            newSubscriptions,
            canceledSubscriptions,
            averageRevenuePerUser: arpu,
        };
    }

    /**
     * Get revenue trend over time
     */
    static async getRevenueTrend(
        months: number = 12
    ): Promise<RevenueTrend[]> {
        const trends: RevenueTrend[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(date);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            const activeSubscriptions = await prisma.subscription.findMany({
                where: {
                    status: 'active',
                    createdAt: {
                        lt: nextMonth,
                    },
                    OR: [
                        { canceledAt: null },
                        { canceledAt: { gte: date } },
                    ],
                },
                include: {
                    plan: true,
                },
            });

            const mrr = activeSubscriptions.reduce((total: any, sub: any) => {
                const price = sub.plan.price;
                const interval = sub.plan.interval;

                if (interval === 'month') {
                    return total + price;
                } else if (interval === 'year') {
                    return total + Math.round(price / 12);
                }
                return total;
            }, 0);

            const newSubscriptions = await prisma.subscription.count({
                where: {
                    createdAt: {
                        gte: date,
                        lt: nextMonth,
                    },
                },
            });

            const canceledSubscriptions = await prisma.subscription.count({
                where: {
                    status: 'canceled',
                    canceledAt: {
                        gte: date,
                        lt: nextMonth,
                    },
                },
            });

            trends.push({
                date,
                mrr,
                arr: mrr * 12,
                activeSubscriptions: activeSubscriptions.length,
                newSubscriptions,
                canceledSubscriptions,
            });
        }

        return trends;
    }

    /**
     * Get revenue breakdown by plan
     */
    static async getRevenueByPlan(): Promise<RevenueByPlan[]> {
        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                status: 'active',
            },
            include: {
                plan: true,
            },
        });

        // Group by plan
        const planGroups = new Map<string, { name: string; subscribers: number; mrr: number }>();

        for (const sub of activeSubscriptions) {
            const planId = sub.planId;
            const planName = sub.plan.name;
            const price = sub.plan.price;
            const interval = sub.plan.interval;

            const monthlyPrice = interval === 'month' ? price : Math.round(price / 12);

            if (!planGroups.has(planId)) {
                planGroups.set(planId, {
                    name: planName,
                    subscribers: 0,
                    mrr: 0,
                });
            }

            const group = planGroups.get(planId)!;
            group.subscribers += 1;
            group.mrr += monthlyPrice;
        }

        // Calculate total MRR
        const totalMRR = Array.from(planGroups.values()).reduce((sum, g) => sum + g.mrr, 0);

        // Convert to array with percentages
        return Array.from(planGroups.entries()).map(([planId, data]) => ({
            planId,
            planName: data.name,
            subscribers: data.subscribers,
            mrr: data.mrr,
            percentage: totalMRR > 0 ? (data.mrr / totalMRR) * 100 : 0,
        }));
    }

    /**
     * Analyze churn
     */
    static async analyzeChurn(
        startDate?: Date,
        endDate?: Date
    ): Promise<ChurnAnalysis> {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate || now;

        const churned = await prisma.subscription.findMany({
            where: {
                status: 'canceled',
                canceledAt: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                user: true,
            },
        });

        // Calculate churn rate
        const previousMonthStart = new Date(start);
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);

        const previousMonthActive = await prisma.subscription.count({
            where: {
                status: 'active',
                createdAt: {
                    lt: start,
                },
            },
        });

        const churnRate = previousMonthActive > 0
            ? (churned.length / previousMonthActive) * 100
            : 0;

        // Analyze churn reasons (would need a cancellationReason field)
        const reasons = new Map<string, number>();
        for (const sub of churned) {
            // const reason = sub.cancellationReason || 'Not specified';
            const reason = 'Not specified'; // Placeholder
            reasons.set(reason, (reasons.get(reason) || 0) + 1);
        }

        const churnReasons = Array.from(reasons.entries()).map(([reason, count]) => ({
            reason,
            count,
            percentage: churned.length > 0 ? (count / churned.length) * 100 : 0,
        }));

        // Calculate average customer lifetime
        const lifetimes = churned
            .filter((sub: any) => sub.canceledAt && sub.createdAt)
            .map((sub: any) => {
                const created = new Date(sub.createdAt);
                const canceled = new Date(sub.canceledAt!);
                return Math.floor((canceled.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            });

        const averageLifetime = lifetimes.length > 0
            ? Math.round(lifetimes.reduce((sum: any, days: any) => sum + days, 0) / lifetimes.length)
            : 0;

        return {
            totalChurned: churned.length,
            churnRate,
            churnReasons,
            averageLifetime,
        };
    }

    /**
     * Calculate MRR for a specific month
     */
    private static async getMRRForMonth(date: Date): Promise<number> {
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                status: 'active',
                createdAt: {
                    lt: nextMonth,
                },
                OR: [
                    { canceledAt: null },
                    { canceledAt: { gte: date } },
                ],
            },
            include: {
                plan: true,
            },
        });

        return activeSubscriptions.reduce((total: any, sub: any) => {
            const price = sub.plan.price;
            const interval = sub.plan.interval;

            if (interval === 'month') {
                return total + price;
            } else if (interval === 'year') {
                return total + Math.round(price / 12);
            }
            return total;
        }, 0);
    }

    /**
     * Calculate average customer lifetime in months
     */
    private static async calculateAverageCustomerLifetime(): Promise<number> {
        const canceledSubs = await prisma.subscription.findMany({
            where: {
                status: 'canceled',
                canceledAt: { not: null },
            },
            select: {
                createdAt: true,
                canceledAt: true,
            },
        });

        if (canceledSubs.length === 0) {
            return 12; // Default to 12 months
        }

        const lifetimes = canceledSubs.map((sub: any) => {
            const created = new Date(sub.createdAt);
            const canceled = new Date(sub.canceledAt!);
            const months = (canceled.getFullYear() - created.getFullYear()) * 12 +
                (canceled.getMonth() - created.getMonth());
            return Math.max(1, months); // At least 1 month
        });

        return Math.round(lifetimes.reduce((sum: any, m: any) => sum + m, 0) / lifetimes.length);
    }

    /**
     * Format currency (cents to dollars)
     */
    static formatCurrency(cents: number, currency: string = 'USD'): string {
        const dollars = cents / 100;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(dollars);
    }

    /**
     * Format percentage
     */
    static formatPercentage(value: number): string {
        return `${value.toFixed(2)}%`;
    }
}
