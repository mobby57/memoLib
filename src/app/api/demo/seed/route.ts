import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { randomUUID } from 'crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/demo/seed
 * 
 * Injecte des donnÃ©es de dÃ©monstration pour un nouveau tenant :
 * - 1 client fictif (M. Amadou Diallo)
 * - 1 email fictif avec rÃ©sumÃ© IA prÃ©-rempli
 * - 1 dossier OQTF liÃ© au client et Ã  l'email
 * - 1 deadline lÃ©gale (30 jours OQTF)
 * 
 * Ne s'exÃ©cute que si le tenant a 0 clients ET 0 emails ET 0 dossiers.
 * Idempotent : ne fait rien si des donnÃ©es existent dÃ©jÃ .
 */
export async function POST(request: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  try {
    // VÃ©rifier si le tenant a dÃ©jÃ  des donnÃ©es
    const [clientCount, emailCount, dossierCount] = await Promise.all([
      prisma.client.count({ where: { tenantId } }),
      prisma.email.count({ where: { tenantId } }),
      prisma.dossier.count({ where: { tenantId } }),
    ]);

    if (clientCount > 0 || emailCount > 0 || dossierCount > 0) {
      return NextResponse.json({
        success: true,
        seeded: false,
        message: 'Des donnÃ©es existent dÃ©jÃ  â€” dÃ©mo non nÃ©cessaire.',
      });
    }

    // === SEED DEMO DATA ===
    const now = new Date();
    const clientId = randomUUID();
    const emailId = randomUUID();
    const dossierId = randomUUID();
    const deadlineId = randomUUID();

    // Date de rÃ©ception email = il y a 2 jours
    const emailDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    // Deadline OQTF = 30 jours aprÃ¨s rÃ©ception
    const deadlineDate = new Date(emailDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const dossierNumero = `D-${now.getFullYear()}-0001`;

    await prisma.$transaction(async (tx) => {
      // 1. Client fictif
      await tx.client.create({
        data: {
          id: clientId,
          tenantId,
          civilite: 'M.',
          firstName: 'Amadou',
          lastName: 'Diallo',
          email: 'amadou.diallo.demo@exemple.fr',
          phone: '06 12 34 56 78',
          nationality: 'GuinÃ©e',
          address: '15 rue de la RÃ©publique',
          codePostal: '75011',
          ville: 'Paris',
          pays: 'France',
          status: 'active',
          updatedAt: now,
        },
      });

      // 2. Dossier OQTF
      await tx.dossier.create({
        data: {
          id: dossierId,
          tenantId,
          numero: dossierNumero,
          clientId,
          typeDossier: 'OQTF',
          articleCeseda: 'L611-1',
          statut: 'en_cours',
          priorite: 'urgente',
          phase: 'instruction',
          dateCreation: emailDate,
          dateOuverture: emailDate,
          dateEcheance: deadlineDate,
          objet: 'Contestation OQTF - M. Diallo',
          description: 'M. Diallo a reÃ§u une OQTF avec dÃ©lai de dÃ©part volontaire de 30 jours. Il souhaite contester cette dÃ©cision au tribunal administratif.',
          responsableId: userId,
          updatedAt: now,
        },
      });

      // 3. Email fictif avec analyse IA prÃ©-remplie
      const aiAnalysis = JSON.stringify({
        client: 'Amadou Diallo',
        type: 'OQTF',
        urgence: 'haute',
        deadline: deadlineDate.toISOString().split('T')[0],
        summary: 'La prÃ©fecture de Paris notifie Ã  M. Amadou Diallo une Obligation de Quitter le Territoire FranÃ§ais (OQTF) avec un dÃ©lai de dÃ©part volontaire de 30 jours. Motif : refus de renouvellement du titre de sÃ©jour. M. Diallo dispose de 30 jours pour former un recours devant le tribunal administratif.',
        confidence: 0.92,
        actions_suggerees: [
          'VÃ©rifier la notification (date, voie de recours mentionnÃ©es)',
          'PrÃ©parer recours TA sous 30 jours',
          'Demander aide juridictionnelle',
          'Rassembler preuves d\'intÃ©gration (travail, famille, logement)',
        ],
      });

      await tx.email.create({
        data: {
          id: emailId,
          tenantId,
          messageId: `demo-oqtf-${tenantId}-${Date.now()}`,
          from: 'prefecture-paris@demo.gouv.fr',
          to: 'cabinet@memolib.demo',
          subject: '[URGENT] Notification OQTF - M. DIALLO Amadou - RÃ©f. PREF75/2026/OQTF/4521',
          body: `MaÃ®tre,

Nous avons l'honneur de vous informer que, par dÃ©cision en date du ${emailDate.toLocaleDateString('fr-FR')}, le PrÃ©fet de Paris a prononcÃ© Ã  l'encontre de votre client, M. Amadou DIALLO, nÃ© le 12 mars 1985 Ã  Conakry (GuinÃ©e), une Obligation de Quitter le Territoire FranÃ§ais (OQTF) assortie d'un dÃ©lai de dÃ©part volontaire de 30 jours.

Cette dÃ©cision est fondÃ©e sur les dispositions de l'article L.611-1 du CESEDA, le titre de sÃ©jour de l'intÃ©ressÃ© n'ayant pas Ã©tÃ© renouvelÃ© (dÃ©cision de refus du 15 juin 2026).

M. DIALLO dispose d'un dÃ©lai de 30 jours Ã  compter de la notification de la prÃ©sente dÃ©cision pour quitter volontairement le territoire franÃ§ais.

ConformÃ©ment aux dispositions de l'article L.614-1 du CESEDA, cette dÃ©cision peut faire l'objet d'un recours en annulation devant le Tribunal Administratif de Paris dans un dÃ©lai de 30 jours Ã  compter de sa notification.

Veuillez agrÃ©er, MaÃ®tre, l'expression de nos salutations distinguÃ©es.

Le PrÃ©fet de Paris,
Direction des Ã‰trangers
Service de l'Ã©loignement`,
          category: 'OQTF',
          urgency: 'high',
          sentiment: 'negative',
          isRead: false,
          isProcessed: true,
          aiAnalysis,
          clientId,
          dossierId,
          contentHash: `demo-hash-${tenantId}`,
          receivedAt: emailDate,
          updatedAt: now,
        },
      });

      // 4. Deadline lÃ©gale
      await tx.legalDeadline.create({
        data: {
          id: deadlineId,
          tenantId,
          dossierId,
          clientId,
          type: 'OQTF',
          label: 'Recours TA contre OQTF',
          description: 'DÃ©lai de recours devant le Tribunal Administratif de Paris contre l\'OQTF notifiÃ©e le ' + emailDate.toLocaleDateString('fr-FR'),
          referenceDate: emailDate,
          dueDate: deadlineDate,
          status: 'PENDING',
          legalBasis: 'Article L.614-1 CESEDA',
          legalDays: 30,
          createdBy: userId,
          updatedAt: now,
        },
      });
    });

    logger.info(`[DEMO] DonnÃ©es de dÃ©monstration crÃ©Ã©es pour tenant ${tenantId}`);

    return NextResponse.json({
      success: true,
      seeded: true,
      message: 'DonnÃ©es de dÃ©monstration crÃ©Ã©es avec succÃ¨s.',
      data: {
        client: { id: clientId, name: 'Amadou Diallo' },
        email: { id: emailId, subject: 'Notification OQTF - M. DIALLO' },
        dossier: { id: dossierId, numero: dossierNumero },
        deadline: { id: deadlineId, dueDate: deadlineDate.toISOString() },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[DEMO] Erreur seed donnÃ©es dÃ©mo', error);

    return NextResponse.json(
      { error: 'Erreur lors de la crÃ©ation des donnÃ©es de dÃ©monstration', details: message },
      { status: 500 }
    );
  }
}

