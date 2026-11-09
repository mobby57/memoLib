/**
 * API Route: POST /api/emails/send
 * 
 * Permet Ã  un avocat d'envoyer un email depuis MemoLib.
 * L'email est envoyÃ© via le service email configurÃ© (Resend/SendGrid/SMTP)
 * et une copie est sauvegardÃ©e dans la base pour l'historique du dossier.
 */

import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { sendEmail } from '@/lib/email/email-service';
import { z } from 'zod';
import crypto from 'crypto';

const sendEmailSchema = z.object({
  to: z.string().email('Adresse email destinataire invalide'),
  subject: z.string().min(1, 'Objet requis').max(500),
  body: z.string().min(1, 'Corps du message requis').max(50000),
  dossierId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  replyToEmailId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
  }

  const user = session.user as any;
  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });
  }

  let requestBody: Record<string, unknown>;
  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = sendEmailSchema.safeParse(requestBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'DonnÃ©es invalides' },
      { status: 400 }
    );
  }

  const { to, subject, body, dossierId, clientId, replyToEmailId } = parsed.data;

  try {
    // RÃ©cupÃ©rer les infos du tenant pour le from
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, billingEmail: true },
    });

    const fromName = user.name || tenant?.name || 'MemoLib';
    const fromEmail = tenant?.billingEmail || user.email || 'noreply@memolib.fr';

    // Envoyer l'email via le service
    await sendEmail({
      to,
      subject,
      html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${body.replace(/\n/g, '<br>')}</div>
        <br><hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
        <p style="font-size: 12px; color: #999;">EnvoyÃ© via MemoLib par ${fromName}</p>`,
      from: `${fromName} <${fromEmail}>`,
      replyTo: user.email,
    });

    // Sauvegarder dans l'historique (email sortant)
    const savedEmail = await prisma.email.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        body,
        sourceDirection: 'outbound',
        sourceChannel: 'email',
        sourceProvider: 'app',
        isRead: true,
        isProcessed: true,
        dossierId: dossierId || undefined,
        clientId: clientId || undefined,
        receivedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Si c'est une rÃ©ponse, lier au thread
    if (replyToEmailId) {
      const originalEmail = await prisma.email.findUnique({
        where: { id: replyToEmailId },
        select: { threadId: true },
      });
      if (originalEmail?.threadId) {
        await prisma.email.update({
          where: { id: savedEmail.id },
          data: { threadId: originalEmail.threadId },
        });
      }
    }

    return NextResponse.json({
      success: true,
      emailId: savedEmail.id,
      message: `Email envoyÃ© Ã  ${to}`,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Impossible d\'envoyer l\'email. VÃ©rifiez la configuration email (RESEND_API_KEY).' },
      { status: 500 }
    );
  }
}

