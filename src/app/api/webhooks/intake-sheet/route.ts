import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createIntakeRequest, type IntakeFieldDef } from '@/lib/services/intake.service';
import { getTemplateForIntakeType } from '@/lib/intake/templates';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/intake-sheet
 *
 * Ingestion des demandes clients depuis un Google Sheet (via Google Apps
 * Script). Chaque ligne identifiée dans le Sheet est poussée ici et crée une
 * IntakeRequest en base (données chiffrées au niveau applicatif).
 *
 * Sécurité :
 *  - Signature HMAC-SHA256 du corps brut avec INTAKE_WEBHOOK_SECRET
 *    (header x-webhook-signature: sha256=<hex>), comparaison timing-safe.
 *  - Le tenant est résolu côté serveur depuis `tenantSubdomain` (le script est
 *    configuré par cabinet) ; jamais un tenantId arbitraire non vérifié.
 *  - Déduplication par (tenantId, origin, sourceRef) dans le service.
 */

const payloadSchema = z.object({
  tenantSubdomain: z.string().trim().min(1).max(100),
  type: z.string().trim().min(1).max(50),
  /** Identifiant stable de la ligne Sheet (pour dédup). */
  rowId: z.string().trim().min(1).max(200),
  clientEmail: z.string().trim().email().max(320).optional(),
  /** Réponses déjà présentes dans la ligne (clé → valeur). */
  data: z.record(z.string(), z.unknown()).default({}),
});

function safeEqual(actual: string, expected: string): boolean {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.INTAKE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Service webhook indisponible' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-webhook-signature');
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  if (!signature || !safeEqual(signature, `sha256=${expected}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = payloadSchema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }
  const payload = result.data;

  // Résolution tenant côté serveur (jamais depuis un id fourni tel quel).
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: payload.tenantSubdomain },
    select: { id: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: 'Unknown tenant' }, { status: 404 });
  }

  const template = getTemplateForIntakeType(payload.type);
  const requiredFields: IntakeFieldDef[] = template.fields;
  const requiredDocuments = template.documents;

  const intake = await createIntakeRequest({
    tenantId: tenant.id,
    type: payload.type,
    origin: 'googlesheet',
    sourceRef: payload.rowId,
    clientEmail: payload.clientEmail ?? null,
    data: payload.data,
    requiredFields,
    requiredDocuments,
    actorUserId: 'system',
  });

  return NextResponse.json(
    { id: intake.id, status: intake.status, completeness: intake.completeness },
    { status: 201 }
  );
}
