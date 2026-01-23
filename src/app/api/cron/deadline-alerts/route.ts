import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '@/lib/email/email-service';

const prisma = new PrismaClient();

// Protection par token secret
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 secondes max

/**
 * GET /api/cron/deadline-alerts
 * Cron job pour envoyer les alertes d'échéances
 * Appelé quotidiennement par Vercel Cron ou manuellement
 */
export async function GET(request: NextRequest) {
  try {
    // Vérification du secret
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const tokenParam = searchParams.get('token');
    
    const token = authHeader?.replace('Bearer ', '') || tokenParam;
    
    if (token !== CRON_SECRET) {
      console.warn('[CRON] Tentative non autorisée');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('[CRON] Début vérification échéances...');

    const now = new Date();
    const alerts = {
      sent: 0,
      errors: 0,
      dossiers: [] as string[],
    };

    // Trouver les dossiers avec échéance proche (7, 3, 1 jours)
    const alertThresholds = [7, 3, 1]; // jours

    for (const days of alertThresholds) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Chercher les dossiers avec échéance ce jour-là
      const dossiers = await prisma.dossier.findMany({
        where: {
          dateEcheance: {
            gte: targetDate,
            lt: nextDay,
          },
          statut: {
            notIn: ['archive', 'accepte', 'refuse'],
          },
        },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          tenant: {
            select: {
              name: true,
              subdomain: true,
            },
          },
        },
      });

      console.log(`[CRON] ${dossiers.length} dossiers à échéance J-${days}`);

      for (const dossier of dossiers) {
        if (!dossier.client?.email) continue;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://iapostemanage.vercel.app';
        const lienDossier = `${baseUrl}/dashboard/dossiers/${dossier.id}`;

        const template = emailTemplates.deadlineAlert({
          clientName: `${dossier.client.firstName} ${dossier.client.lastName}`,
          dossierNumero: dossier.numero,
          dossierType: dossier.typeDossier || 'Non spécifié',
          echeance: dossier.dateEcheance!,
          joursRestants: days,
          lienDossier,
        });

        const result = await sendEmail({
          to: dossier.client.email,
          subject: template.subject,
          html: template.html,
        });

        if (result.success) {
          alerts.sent++;
          alerts.dossiers.push(dossier.numero);
          console.log(`[CRON] Email envoyé: ${dossier.numero} -> ${dossier.client.email}`);
        } else {
          alerts.errors++;
          console.error(`[CRON] Erreur email: ${dossier.numero}`, result.error);
        }
      }
    }

    // Vérifier aussi les dossiers OQTF (toujours critiques)
    const oqtfDossiers = await prisma.dossier.findMany({
      where: {
        typeDossier: 'OQTF',
        statut: {
          notIn: ['archive', 'accepte', 'refuse'],
        },
        dateEcheance: {
          lte: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 jours
          gte: now,
        },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log(`[CRON] ${oqtfDossiers.length} dossiers OQTF urgents détectés`);

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      alerts: {
        sent: alerts.sent,
        errors: alerts.errors,
        dossiers: alerts.dossiers,
      },
      oqtfUrgents: oqtfDossiers.length,
    };

    console.log('[CRON] Terminé:', summary);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('[CRON] Erreur:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/cron/deadline-alerts
 * Envoyer une alerte manuelle pour un dossier spécifique
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { dossierId, type } = body;

    if (!dossierId) {
      return NextResponse.json({ error: 'dossierId requis' }, { status: 400 });
    }

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!dossier || !dossier.client?.email) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://iapostemanage.vercel.app';
    const lienDossier = `${baseUrl}/dashboard/dossiers/${dossier.id}`;

    // Calculer jours restants
    const joursRestants = dossier.dateEcheance 
      ? Math.ceil((dossier.dateEcheance.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : 0;

    const template = emailTemplates.deadlineAlert({
      clientName: `${dossier.client.firstName} ${dossier.client.lastName}`,
      dossierNumero: dossier.numero,
      dossierType: dossier.typeDossier || 'Non spécifié',
      echeance: dossier.dateEcheance || new Date(),
      joursRestants: Math.max(0, joursRestants),
      lienDossier,
    });

    const result = await sendEmail({
      to: dossier.client.email,
      subject: template.subject,
      html: template.html,
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });

  } catch (error) {
    console.error('[CRON] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
