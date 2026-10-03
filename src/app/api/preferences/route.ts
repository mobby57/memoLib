import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Préférences utilisateur (clé/valeur JSON) — thème, colonnes, filtres, etc.
 *
 * Modèle de sécurité : chaque utilisateur ne peut lire/écrire QUE ses propres
 * préférences. Le scope est le `userId` de la session serveur (jamais issu du
 * corps de requête), ce qui garantit l'isolation entre utilisateurs et tenants.
 * Aucune permission RBAC supplémentaire n'est requise (données personnelles de
 * l'utilisateur courant uniquement).
 *
 * Distinct de /api/settings/tenant (config cabinet, RBAC settings:read/write).
 */

export async function GET() {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prefs = await prisma.userPreference.findMany({ where: { userId: user.id } });

  const result: Record<string, unknown> = {};
  for (const p of prefs) {
    try {
      result[p.key] = JSON.parse(p.value);
    } catch {
      result[p.key] = p.value;
    }
  }
  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId || '';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { key, value } = (body ?? {}) as { key?: unknown; value?: unknown };

  if (typeof key !== 'string' || key.trim().length === 0) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 });
  }
  if (key.length > 100) {
    return NextResponse.json({ error: 'key too long (max 100)' }, { status: 400 });
  }

  const serialized = JSON.stringify(value ?? null);

  const pref = await prisma.userPreference.upsert({
    where: { userId_key: { userId: user.id, key } },
    update: { value: serialized },
    create: { userId: user.id, tenantId, key, value: serialized },
  });

  return NextResponse.json({ key: pref.key, value: JSON.parse(pref.value) });
}
