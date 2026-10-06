import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { EncryptionService } from '@/lib/security/encryption';

/**
 * POST /api/email/disconnect
 * Body: { email: string }
 *
 * Deconnecte une boite mail du cabinet (EMAIL-SEC-002).
 * Revoque REELLEMENT le token cote provider (Google), puis supprime la
 * connexion en base. "Deconnexion a tout moment" doit vraiment couper l'acces,
 * pas seulement masquer la ligne (isActive=false ne revoque rien cote Google).
 */
export async function POST(req: NextRequest) {
  const { isAuthenticated, user } = await auth();
  if (!isAuthenticated || !user?.tenantId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let email: string;
  try {
    const body = await req.json();
    email = body.email;
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: 'email requis' }, { status: 400 });
  }

  // Isolation tenant: on ne peut deconnecter qu'une boite de SON cabinet.
  const account = await prisma.emailAccount.findUnique({
    where: { tenantId_email: { tenantId: user.tenantId, email } },
  });
  if (!account) {
    return NextResponse.json({ error: 'Connexion introuvable' }, { status: 404 });
  }

  // 1. Revocation reelle cote provider (best effort — on continue meme si echec,
  //    car la suppression en base reste la garantie minimale).
  try {
    if (account.provider === 'gmail' && account.accessToken) {
      const token = EncryptionService.decrypt(account.accessToken);
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10000),
      });
    }
    // Microsoft Graph n'expose pas d'endpoint de revocation par token simple ;
    // la suppression en base + expiration naturelle s'appliquent. A documenter.
  } catch (error) {
    logger.warn('[Email Disconnect] Révocation provider échouée (poursuite)', {
      error,
      provider: account.provider,
    });
  }

  // 2. Supprimer la connexion en base (plus de token conserve = plus d'acces).
  await prisma.emailAccount.delete({ where: { id: account.id } });

  logger.info('[Email Disconnect] Boîte déconnectée', {
    tenantId: user.tenantId,
    provider: account.provider,
  });

  return NextResponse.json({ success: true, email, provider: account.provider });
}
