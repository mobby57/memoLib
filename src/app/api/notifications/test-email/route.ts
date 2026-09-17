import { auth } from '@/lib/clerk-auth';
/**
 * API Route: POST /api/notifications/test-email
 *
 * Permet d'envoyer un vrai email de test (échéance, facture ou résumé
 * hebdomadaire) à l'utilisateur connecté, en utilisant le service d'envoi
 * réel (Resend/SendGrid/SMTP) plutôt qu'une simulation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/email-service';
import {
  generateEcheanceReminderEmail,
  generateFactureOverdueEmail,
  generateWeeklySummaryEmail,
} from '@/lib/services/emailService';

const bodySchema = z.object({
  type: z.enum(['echeance', 'facture', 'summary']),
});

export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let requestBody: Record<string, unknown>;
  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(requestBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Type de test invalide' },
      { status: 400 }
    );
  }

  let template: { subject: string; htmlBody: string; textBody: string };
  switch (parsed.data.type) {
    case 'echeance':
      template = generateEcheanceReminderEmail(
        {
          titre: 'Depot des conclusions',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          dossier: 'DOS-2026-001',
          description: 'Depot des conclusions au greffe du tribunal',
        },
        3
      );
      break;
    case 'facture':
      template = generateFactureOverdueEmail(
        {
          numero: 'FACT-2026-001',
          client: 'Martin Dupont',
          montant: 1500,
          dateEcheance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        7
      );
      break;
    case 'summary':
      template = generateWeeklySummaryEmail({
        newDossiers: 5,
        newFactures: 8,
        totalRevenue: 12500,
        upcomingEcheances: 3,
        overdueFactures: 2,
      });
      break;
  }

  const to = user.email as string | undefined;
  if (!to) {
    return NextResponse.json(
      { error: 'Aucune adresse email associée à votre compte' },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to,
    subject: `[TEST] ${template.subject}`,
    html: template.htmlBody,
    text: template.textBody,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Échec de l'envoi de l'email de test" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
}




