import { auth } from '@/lib/clerk-auth';
/**
 * API Route: PATCH /api/user/profile
 * 
 * Permet à l'utilisateur connecté de modifier son profil (nom, email, téléphone).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  language: z.enum(['fr', 'en']).optional(),
  timezone: z.string().max(50).optional(),
});

export async function PATCH(req: NextRequest) {
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const userId = user.id;
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
      { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Si l'email change, vérifier qu'il n'est pas déjà pris
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, id: { not: userId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre compte.' }, { status: 409 });
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
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const userId = user.id;
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, language: true, timezone: true, createdAt: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  return NextResponse.json({ user: dbUser });
}




