import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/clerk-auth';
import { DATA_CATEGORIES, GDPRCompliance } from '@/lib/compliance/gdpr';
import { logger } from '@/lib/logger';

const exportQuerySchema = z.object({
  categories: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(',') : undefined))
    .pipe(z.array(z.enum(DATA_CATEGORIES)).min(1).max(DATA_CATEGORIES.length).optional()),
});

export async function GET(request: NextRequest) {
  const { user } = await auth();
  if (!user?.tenantId) {
    return NextResponse.json({ error: user ? 'Accès refusé' : 'Non authentifié' }, { status: user ? 403 : 401 });
  }

  const parsed = exportQuerySchema.safeParse({
    categories: request.nextUrl.searchParams.get('categories') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Paramètres d’export invalides' }, { status: 400 });
  }

  try {
    const data = await GDPRCompliance.exportUserData(user.id, parsed.data.categories);
    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': 'attachment; filename="memolib-personal-data.json"',
        'Cache-Control': 'no-store, private',
      },
    });
  } catch (error) {
    logger.error('Personal data export failed', error, { userId: user.id, tenantId: user.tenantId });
    return NextResponse.json({ error: 'Impossible de préparer l’export' }, { status: 500 });
  }
}
