import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { GDPRCompliance } from '@/lib/compliance/gdpr';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const consentSchema = z.object({
    consents: z.array(z.object({
        type: z.enum(['essential', 'analytics', 'marketing', 'personalization', 'third_party']),
        granted: z.boolean()
    }).strict()).min(1).max(5)
}).strict();

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSessionCompat();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Non authentifie' },
                { status: 401 }
            );
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 });
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
        }
        const validation = consentSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Donnees de consentement invalides' }, { status: 400 });
        }

        const userId = session.user.id;
        const ipAddress = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        await GDPRCompliance.recordConsents(
            tenantId,
            userId,
            validation.data.consents.map(consent => ({
                ...consent,
                ipAddress,
                userAgent,
                version: '1.0.0'
            }))
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Erreur enregistrement consentement RGPD', error instanceof Error ? error : undefined, {
            route: '/api/compliance/consent',
        });
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await getServerSessionCompat();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
        }
        const tenantId = session.user.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 });
        }

        const consents = await GDPRCompliance.getUserConsents(tenantId, session.user.id);

        return NextResponse.json({ consents });
    } catch (error) {
        logger.error('Erreur lecture consentements RGPD', error instanceof Error ? error : undefined, {
            route: '/api/compliance/consent',
        });
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
