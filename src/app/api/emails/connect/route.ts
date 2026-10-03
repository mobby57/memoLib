import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ImapFlow } from 'imapflow';

/**
 * POST /api/emails/connect
 * Body: { email, password }
 * 
 * L'avocat entre son email + mot de passe d'application.
 * L'app détecte le fournisseur, teste la connexion, et sauvegarde.
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
  }

  const domain = email.split('@')[1]?.toLowerCase();
  const imap = getImapConfig(domain);
  if (!imap) {
    return NextResponse.json({ error: `Fournisseur "${domain}" non supporté. Contactez le support.` }, { status: 400 });
  }

  // Test IMAP connection
  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
  });

  try {
    await client.connect();
    await client.logout();
  } catch (e: any) {
    const hint = domain.includes('gmail')
      ? ' Pour Gmail: active la validation en 2 étapes puis crée un mot de passe d\'application sur https://myaccount.google.com/apppasswords'
      : '';
    return NextResponse.json({
      error: `Connexion échouée: identifiants invalides.${hint}`,
    }, { status: 401 });
  }

  // Save
  const tenantId = (user as any).tenantId;
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      emailEnabled: true,
      smtpHost: imap.host,
      smtpPort: imap.port,
      smtpUser: email,
      smtpPassword: password,
    },
  });

  return NextResponse.json({
    success: true,
    message: `${email} connecté via ${imap.name}. Les emails seront analysés automatiquement.`,
  });
}

function getImapConfig(domain: string) {
  const configs: Record<string, { name: string; host: string; port: number }> = {
    'gmail.com': { name: 'Gmail', host: 'imap.gmail.com', port: 993 },
    'googlemail.com': { name: 'Gmail', host: 'imap.gmail.com', port: 993 },
    'outlook.com': { name: 'Outlook', host: 'outlook.office365.com', port: 993 },
    'hotmail.com': { name: 'Outlook', host: 'outlook.office365.com', port: 993 },
    'live.com': { name: 'Outlook', host: 'outlook.office365.com', port: 993 },
    'yahoo.com': { name: 'Yahoo', host: 'imap.mail.yahoo.com', port: 993 },
    'orange.fr': { name: 'Orange', host: 'imap.orange.fr', port: 993 },
    'free.fr': { name: 'Free', host: 'imap.free.fr', port: 993 },
    'sfr.fr': { name: 'SFR', host: 'imap.sfr.fr', port: 993 },
    'laposte.net': { name: 'La Poste', host: 'imap.laposte.net', port: 993 },
  };
  return configs[domain] || null;
}




