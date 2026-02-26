import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface DeletionRequestRecord {
    id: string;
    userId: string;
    reason: string;
    status: string;
    requestedAt: Date;
    scheduledFor: Date | null;
    user: {
        email: string | null;
    };
}

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

        const requests = await prisma.deletionRequest.findMany({
            include: {
                user: {
                    select: {
                        email: true
                    }
                }
            },
            orderBy: {
                requestedAt: 'desc'
            },
            take: 100
        }) as DeletionRequestRecord[];

        const formatted = requests.map((req) => ({
            id: req.id,
            userId: req.userId,
            userEmail: req.user.email,
            reason: req.reason,
            status: req.status,
            requestedAt: req.requestedAt,
            scheduledFor: req.scheduledFor
        }));

        return NextResponse.json({
            requests: formatted
        });
    } catch (error: any) {
        console.error('Error fetching deletion requests:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
