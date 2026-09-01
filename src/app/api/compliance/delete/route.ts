import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { GDPRCompliance } from '@/lib/compliance/gdpr';

export async function POST(req: NextRequest) {
    try {
        const { user } = await auth();
    const session = user ? { user } : null;

        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { reason } = await req.json();

        // Request account deletion
        const deletion = await GDPRCompliance.requestDeletion(
            user.email,
            reason
        );

        return NextResponse.json({
            message: 'Account deletion scheduled',
            scheduledFor: deletion.scheduledFor,
            gracePeriod: '30 days',
            note: 'You can cancel this request anytime before the scheduled date'
        });
    } catch (error: any) {
        console.error('Error requesting deletion:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { user } = await auth();
    const session = user ? { user } : null;

        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Cancel deletion request
        await GDPRCompliance.cancelDeletion(user.email);

        return NextResponse.json({
            message: 'Deletion request cancelled successfully'
        });
    } catch (error: any) {
        console.error('Error cancelling deletion:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}




