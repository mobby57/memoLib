import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/demo/seed
 * 
 * Injecte des données de démonstration pour un nouveau tenant :
 * - 1 client fictif (M. Amadou Diallo)
 * - 1 email fictif avec résumé IA pré-rempli
 * - 1 dossier OQTF lié au client et à l'email
 * - 1 deadline légale (30 jours OQTF)
 * 
 * Ne s'exécute que si le tenant a 0 clients ET 0 emails ET 0 dossiers.
 * Idempotent : ne fait rien si des données existent déjà.
 */
export async function POST(request: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = user.tenantId;
  const userId = user.id;

  try {
    // Vérifier si le tenant a déjà des données
    const [clientCount, emailCount, dossierCount] = await Promise.all([
      prisma.client.count({ where: { tenantId } }),
      prisma.email.count({ where: { tenantId } }),
      prisma.dossier.count({ where: { tenantId } }),
    ]);

    if (clientCount > 0 || emailCount > 0 || dossierCount > 0) {
      return NextResponse.json({
        success: true,
        seeded: false,
        message: 'Des données existent déjà — démo non nécessaire.',
      });
    }

    // === SEED DEMO DATA ===
    const now = new Date();
    const clientId = randomUUID();
    const emailId = randomUUID();
    const dossierId = randomUUID();
    const deadlineId = randomUUID();

    // Date de réception email = il y a 2 jours
    const emailDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    // Deadline OQTF = 30 jours après réception
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
          nationality: 'Guinée',
          address: '15 rue de la République',
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
          description: 'M. Diallo a reçu une OQTF avec délai de départ volontaire de 30 jours. Il souhaite contester cette décision au tribunal administratif.',
          responsableId: userId,
          updatedAt: now,
        },
      });

      // 3. Email fictif avec analyse IA pré-remplie
      const aiAnalysis = JSON.stringify({
        client: 'Amadou Diallo',
        type: 'OQTF',
        urgence: 'haute',
        deadline: deadlineDate.toISOString().split('T')[0],
        summary: 'La préfecture de Paris notifie à M. Amadou Diallo une Obligation de Quitter le Territoire Français (OQTF) avec un délai de départ volontaire de 30 jours. Motif : refus de renouvellement du titre de séjour. M. Diallo dispose de 30 jours pour former un recours devant le tribunal administratif.',
        confidence: 0.92,
        actions_suggerees: [
          'Vérifier la notification (date, voie de recours mentionnées)',
          'Préparer recours TA sous 30 jours',
          'Demander aide juridictionnelle',
          'Rassembler preuves d\'intégration (travail, famille, logement)',
        ],
      });

      await tx.email.create({
        data: {
          id: emailId,
          tenantId,
          messageId: `demo-oqtf-${tenantId}-${Date.now()}`,
          from: 'prefecture-paris@demo.gouv.fr',
          to: 'cabinet@memolib.demo',
          subject: '[URGENT] Notification OQTF - M. DIALLO Amadou - Réf. PREF75/2026/OQTF/4521',
          body: `Maître,

Nous avons l'honneur de vous informer que, par décision en date du ${emailDate.toLocaleDateString('fr-FR')}, le Préfet de Paris a prononcé à l'encontre de votre client, M. Amadou DIALLO, né le 12 mars 1985 à Conakry (Guinée), une Obligation de Quitter le Territoire Français (OQTF) assortie d'un délai de départ volontaire de 30 jours.

Cette décision est fondée sur les dispositions de l'article L.611-1 du CESEDA, le titre de séjour de l'intéressé n'ayant pas été renouvelé (décision de refus du 15 juin 2026).

M. DIALLO dispose d'un délai de 30 jours à compter de la notification de la présente décision pour quitter volontairement le territoire français.

Conformément aux dispositions de l'article L.614-1 du CESEDA, cette décision peut faire l'objet d'un recours en annulation devant le Tribunal Administratif de Paris dans un délai de 30 jours à compter de sa notification.

Veuillez agréer, Maître, l'expression de nos salutations distinguées.

Le Préfet de Paris,
Direction des Étrangers
Service de l'éloignement`,
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

      // 4. Deadline légale
      await tx.legalDeadline.create({
        data: {
          id: deadlineId,
          tenantId,
          dossierId,
          clientId,
          type: 'OQTF',
          label: 'Recours TA contre OQTF',
          description: 'Délai de recours devant le Tribunal Administratif de Paris contre l\'OQTF notifiée le ' + emailDate.toLocaleDateString('fr-FR'),
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

    logger.info(`[DEMO] Données de démonstration créées pour tenant ${tenantId}`);

    return NextResponse.json({
      success: true,
      seeded: true,
      message: 'Données de démonstration créées avec succès.',
      data: {
        client: { id: clientId, name: 'Amadou Diallo' },
        email: { id: emailId, subject: 'Notification OQTF - M. DIALLO' },
        dossier: { id: dossierId, numero: dossierNumero },
        deadline: { id: deadlineId, dueDate: deadlineDate.toISOString() },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[DEMO] Erreur seed données démo', error);

    return NextResponse.json(
      { error: 'Erreur lors de la création des données de démonstration', details: message },
      { status: 500 }
    );
  }
}




