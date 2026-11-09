/**
 * API Route: PATCH /api/user/profile
 * 
 * Permet Ã  l'utilisateur connectÃ© de modifier son profil (nom, email, tÃ©lÃ©phone).
 */

import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  language: z.enum(['fr', 'en']).optional(),
  timezone: z.string().max(50).optional(),
});

export async function PATCH(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'DonnÃ©es invalides', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Si l'email change, vÃ©rifier qu'il n'est pas dÃ©jÃ  pris
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, id: { not: userId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est dÃ©jÃ  utilisÃ© par un autre compte.' }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.language && { language: data.language }),
      ...(data.timezone && { timezone: data.timezone }),
    },
    select: { id: true, name: true, email: true, language: true, timezone: true },
  });

  return NextResponse.json({ success: true, user: updated });
}

export async function GET(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, language: true, timezone: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvÃ©' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

