import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// NOTE: Prisma désactivé pour build/demo sans DB générée

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // TODO: Add admin role check
        // if (session.user.role !== 'admin') {
        //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        // }

        // Calculate compliance stats
        const [
            totalUsers,
            totalConsents,
            activeExports,
            pendingDeletions,
            auditLogCount
        ] = [0, 0, 0, 0, 0];

        const consentRate = totalUsers > 0 ? (totalConsents / totalUsers) * 100 : 0;

        return NextResponse.json({
            totalConsents,
            consentRate,
            activeExports,
            pendingDeletions,
            auditLogCount,
            dataBreaches: 0 // Count from DataBreach model
        });
    } catch (error: any) {
        console.error('Error fetching compliance stats:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
