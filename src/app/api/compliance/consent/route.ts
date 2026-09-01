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
        const { consents } = await req.json();

        if (!consents || !Array.isArray(consents)) {
            return NextResponse.json(
                { error: 'Invalid consent data' },
                { status: 400 }
            );
        }

        // Get user info
        const userId = user?.email || 'anonymous';
        const ipAddress = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // Record each consent
        for (const consent of consents) {
            if (user?.email) {
                await GDPRCompliance.recordConsent(userId, {
                    type: consent.type,
                    granted: consent.granted,
                    ipAddress,
                    userAgent,
                    version: '1.0.0' // Privacy policy version
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error recording consent:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { user } = await auth();
    const session = user ? { user } : null;

        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const consents = await GDPRCompliance.getUserConsents(user.email);

        return NextResponse.json({ consents });
    } catch (error: any) {
        console.error('Error fetching consents:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}




