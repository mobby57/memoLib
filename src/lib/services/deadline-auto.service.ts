/**
 * Service de création automatique de deadlines CESEDA
 * Appelé à la création d'un dossier pour calculer et persister les échéances.
 */

import { prisma } from '@/lib/prisma';
import { calculateDeadline } from '@/lib/cesda/deadlineEngine';
import { ProcedureType } from '@/types/cesda';

// Mapping type dossier → ProcedureType du moteur CESEDA
const TYPE_TO_PROCEDURE: Record<string, ProcedureType> = {
  'OQTF': ProcedureType.OQTF,
  'RECOURS_OQTF': ProcedureType.OQTF,
  'ASILE': ProcedureType.ASILE,
  'TITRE_SEJOUR': ProcedureType.REFUS_TITRE,
  'NATURALISATION': ProcedureType.NATURALISATION,
  'REGROUPEMENT_FAMILIAL': ProcedureType.REGROUPEMENT_FAMILIAL,
  'RECOURS': ProcedureType.REFUS_TITRE,
};

// Mapping type dossier → DeadlineType enum Prisma
const TYPE_TO_DEADLINE_TYPE: Record<string, string> = {
  'OQTF': 'OQTF',
  'RECOURS_OQTF': 'OQTF',
  'ASILE': 'RECOURS_CONTENTIEUX',
  'TITRE_SEJOUR': 'RECOURS_GRACIEUX',
  'NATURALISATION': 'REPONSE_PREFECTURE',
  'REGROUPEMENT_FAMILIAL': 'REPONSE_PREFECTURE',
  'RECOURS': 'RECOURS_CONTENTIEUX',
};

interface CreateDeadlineParams {
  dossierId: string;
  tenantId: string;
  clientId: string;
  typeDossier: string;
  caseSubType?: string;
  notificationDate?: Date;
  createdBy: string;
}

/**
 * Crée automatiquement une LegalDeadline pour un dossier nouvellement créé
 */
export async function createAutoDeadline(params: CreateDeadlineParams) {
  const { dossierId, tenantId, clientId, typeDossier, caseSubType, createdBy } = params;

  const procedureType = TYPE_TO_PROCEDURE[typeDossier];
  if (!procedureType) return null; // Type non reconnu, pas de deadline auto

  const notificationDate = params.notificationDate || new Date();

  const metadata: Record<string, string> = {};
  if (typeDossier === 'OQTF' && caseSubType === 'sans_delai') {
    metadata.oqtfType = 'sans_delai';
  }

  const calc = calculateDeadline(procedureType, notificationDate, metadata);

  const deadlineType = TYPE_TO_DEADLINE_TYPE[typeDossier] || 'CUSTOM';

  const deadline = await prisma.legalDeadline.create({
    data: {
      tenantId,
      dossierId,
      clientId,
      type: deadlineType as any,
      label: `Échéance ${typeDossier} — ${calc.daysRemaining}j restants`,
      description: `Calculée automatiquement. Notification: ${notificationDate.toLocaleDateString('fr-FR')}`,
      referenceDate: notificationDate,
      dueDate: calc.deadlineDate,
      status: calc.isExpired ? 'OVERDUE' : calc.hoursRemaining <= 48 ? 'CRITICAL' : 'PENDING',
      legalBasis: `CESEDA — ${procedureType}`,
      legalDays: calc.daysRemaining,
      createdBy,
    },
  });

  // Mettre à jour la dateEcheance du dossier
  await prisma.dossier.update({
    where: { id: dossierId },
    data: { dateEcheance: calc.deadlineDate },
  });

  return deadline;
}
