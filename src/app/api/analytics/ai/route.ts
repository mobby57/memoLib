import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIAnalytics } from '@/lib/analytics/ai';

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

        let data;

        switch (type) {
            case 'current':
                data = await AIAnalytics.getCurrentMetrics();
                break;
            case 'tokens':
                data = await AIAnalytics.getTokenUsageTrend(days);
                break;
            case 'inference':
                data = await AIAnalytics.getInferenceStats();
                break;
            case 'cost':
                data = await AIAnalytics.getCostBreakdown();
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid type parameter' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('AI analytics error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
