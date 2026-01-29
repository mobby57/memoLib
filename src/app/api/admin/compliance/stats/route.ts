import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        ] = await Promise.all([
            prisma.user.count(),
            prisma.userConsent.count(),
            prisma.dataExportRequest.count({
                where: { status: 'completed' }
            }),
            prisma.deletionRequest.count({
                where: { status: 'scheduled' }
            }),
            prisma.auditLog.count()
        ]);

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
