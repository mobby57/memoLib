/**
 * API Route: POST /api/auth/change-password
 * 
 * Permet à l'utilisateur connecté de changer son mot de passe.
 * Requiert l'ancien mot de passe pour validation.
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Données invalides' },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  // Récupérer l'utilisateur avec son mot de passe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user || !user.password) {
    return NextResponse.json(
      { error: 'Impossible de changer le mot de passe (compte OAuth).' },
      { status: 400 }
    );
  }

  // Vérifier l'ancien mot de passe
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });
  }

  // Vérifier que le nouveau est différent
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    return NextResponse.json(
      { error: 'Le nouveau mot de passe doit être différent de l\'ancien.' },
      { status: 400 }
    );
  }

  // Hasher et sauvegarder
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ success: true, message: 'Mot de passe modifié avec succès.' });
}
