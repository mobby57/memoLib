import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GDPRCompliance, type DataCategory } from '@/lib/compliance/gdpr';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { format = 'json', categories } = await req.json();

        // Validate format
        if (!['json', 'csv', 'pdf'].includes(format)) {
            return NextResponse.json(
                { error: 'Invalid format. Must be json, csv, or pdf' },
                { status: 400 }
            );
        }

        // Request export
        const requestId = await GDPRCompliance.requestDataExport(
            session.user.email,
            format,
            categories as DataCategory[]
        );

        return NextResponse.json({
            message: 'Export request received. You will be notified when ready.',
            requestId,
            estimatedTime: '5-10 minutes'
        });
    } catch (error: any) {
        console.error('Error requesting export:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's export requests
        // This would query the database for DataExportRequest records
        // For now, return empty array

        return NextResponse.json({ exports: [] });
    } catch (error: any) {
        console.error('Error fetching exports:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
