import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EngagementAnalytics } from '@/lib/analytics/engagement';

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
        const days = parseInt(searchParams.get('days') || '30');
        const months = parseInt(searchParams.get('months') || '6');

        let data;

        switch (type) {
            case 'current':
                data = await EngagementAnalytics.getCurrentMetrics();
                break;
            case 'retention':
                data = await EngagementAnalytics.getRetentionCohorts(months);
                break;
            case 'features':
                data = await EngagementAnalytics.getFeatureUsage();
                break;
            case 'sessions':
                data = await EngagementAnalytics.getSessionTrend(days);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid type parameter' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Engagement analytics error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
