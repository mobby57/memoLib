import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RevenueAnalytics } from '@/lib/analytics/revenue';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'current';
        const months = parseInt(searchParams.get('months') || '12');

        let data;

        switch (type) {
            case 'current':
                data = await RevenueAnalytics.getCurrentMetrics();
                break;
            case 'trend':
                data = await RevenueAnalytics.getRevenueTrend(months);
                break;
            case 'by-plan':
                data = await RevenueAnalytics.getRevenueByPlan();
                break;
            case 'churn':
                data = await RevenueAnalytics.analyzeChurn();
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid type parameter' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Revenue analytics error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
