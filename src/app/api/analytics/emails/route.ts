import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmailAnalytics } from '@/lib/analytics/emails';

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
                data = await EmailAnalytics.getCurrentMetrics();
                break;
            case 'trend':
                data = await EmailAnalytics.getEmailTrend(days);
                break;
            case 'processing':
                data = await EmailAnalytics.getProcessingStats();
                break;
            case 'ai-performance':
                data = await EmailAnalytics.getAIPerformance();
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid type parameter' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Email analytics error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
