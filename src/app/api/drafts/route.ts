import { auth } from '@/lib/clerk-auth';
/**
 * GET  /api/drafts — Liste les drafts du tenant
 * POST /api/drafts — Crée un draft depuis un email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractDraft } from '@/lib/adapters/email.adapter';

export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const tenantId = (user as any).tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

    const status = new URL(request.url).searchParams.get('status') || 'PENDING';

    const drafts = await prisma.draft.findMany({
      where: { tenantId, status },
      orderBy: { createdAt: 'desc' },
      include: {
        sourceEmail: { select: { id: true, from: true, subject: true, receivedAt: true } },
        createdDossier: { select: { id: true, numero: true } },
      },
    });

    const parsed = drafts.map(d => ({
      ...d,
      extractedData: JSON.parse(d.extractedData),
      confidence: d.confidence ? JSON.parse(d.confidence) : {},
    }));

    return NextResponse.json({ success: true, drafts: parsed, count: parsed.length });
  } catch (error) {
    console.error('[DRAFTS] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const tenantId = (user as any).tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

    const { emailId, from, subject, bodyText } = await request.json();
    if (!from || !subject) return NextResponse.json({ error: 'from et subject requis' }, { status: 400 });

    if (emailId) {
      const existing = await prisma.draft.findFirst({ where: { tenantId, sourceEmailId: emailId } });
      if (existing) return NextResponse.json({ success: true, duplicate: true, draftId: existing.id });
    }

    const extracted = extractDraft({ from, subject, body: bodyText || '' });

    const draft = await prisma.draft.create({
      data: {
        tenantId,
        status: 'PENDING',
        extractedData: JSON.stringify(extracted),
        confidence: JSON.stringify(extracted.confidence),
        sourceEmailId: emailId || null,
      },
    });

    return NextResponse.json({ success: true, draftId: draft.id, extractedData: extracted }, { status: 201 });
  } catch (error) {
    console.error('[DRAFTS] POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




