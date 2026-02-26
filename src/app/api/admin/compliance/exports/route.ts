import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ExportRequestRecord {
    id: string;
    userId: string;
    format: string;
    status: string;
    requestedAt: Date;
    completedAt: Date | null;
    downloadUrl: string | null;
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
        const requests = await prisma.dataExportRequest.findMany({
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
        }) as ExportRequestRecord[];

        const formatted = requests.map((request) => ({
            id: request.id,
            userId: request.userId,
            userEmail: request.user.email,
            format: request.format,
            status: request.status,
            requestedAt: request.requestedAt,
            completedAt: request.completedAt,
            downloadUrl: request.downloadUrl,
        }));

        return NextResponse.json({
            requests: formatted
        });
    } catch (error: any) {
        console.error('Error fetching export requests:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
