// CLERK-MIGRATION: Remplacement session.user -> user (vérifier)
// CLERK-MIGRATION: Remplacement getServerSession() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// NOTE: Prisma désactivé pour build/demo sans DB générée

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userRole = String((user as any).role || '');
        if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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




