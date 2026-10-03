import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { encryptFile } from '@/lib/security/encryption';
import { getIntakeRequest } from '@/lib/services/intake.service';
import { createAuditLog } from '@/lib/security/audit-trail';

/**
 * Export "coffre-fort" chiffré des demandes d'intake.
 *
 * Génère un classeur Excel (ExcelJS) côté serveur à partir des demandes
 * DÉCHIFFRÉES, puis chiffre le fichier entier (AES-256-GCM via encryptFile).
 * Le buffer renvoyé n'est lisible qu'avec la clé maître : c'est le "coffre-fort".
 *
 * Sécurité :
 *  - Génération 100% serveur (jamais les données en clair côté client).
 *  - Le fichier .xlsx.enc produit est chiffré au repos.
 *  - Chaque export est audité (traçabilité RGPD).
 *  - Scope tenant strict.
 */

export interface EncryptedExport {
  /** Buffer chiffré ([iv][tag][ciphertext]) prêt à stocker/transmettre. */
  encrypted: Buffer;
  filename: string;
  count: number;
}

function buildWorksheetRows(intake: {
  type: string;
  status: string;
  clientEmail: string | null;
  completeness: number;
  data: Record<string, unknown>;
  requiredDocuments: string[];
  providedDocuments: string[];
}): Record<string, unknown> {
  const missingDocs = intake.requiredDocuments.filter((d) => !intake.providedDocuments.includes(d));
  return {
    Type: intake.type,
    Statut: intake.status,
    Email: intake.clientEmail ?? '',
    'Complétude (%)': intake.completeness,
    'Documents fournis': intake.providedDocuments.join(', '),
    'Documents manquants': missingDocs.join(', '),
    Données: JSON.stringify(intake.data),
  };
}

/**
 * Exporte toutes les demandes d'un tenant (ou un sous-ensemble) en un classeur
 * Excel chiffré.
 */
export async function exportIntakeVault(
  tenantId: string,
  options: { ids?: string[]; actorUserId?: string } = {}
): Promise<EncryptedExport> {
  if (!tenantId) throw new Error('tenantId is required');

  const rows = await prisma.intakeRequest.findMany({
    where: { tenantId, ...(options.ids ? { id: { in: options.ids } } : {}) },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Intake');

  const headers = [
    'Type',
    'Statut',
    'Email',
    'Complétude (%)',
    'Documents fournis',
    'Documents manquants',
    'Données',
  ];
  sheet.addRow(headers);

  let count = 0;
  for (const { id } of rows) {
    const intake = await getIntakeRequest(tenantId, id);
    if (!intake) continue;
    const record = buildWorksheetRows(intake);
    sheet.addRow(headers.map((h) => record[h] ?? ''));
    count++;
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const encrypted = await encryptFile(buffer);

  await createAuditLog({
    userId: options.actorUserId ?? 'system',
    tenantId,
    action: 'EXPORT',
    resource: 'CLIENT',
    resourceId: tenantId,
    description: `Export coffre-fort intake chiffré (${count} demandes)`,
    metadata: { count },
    success: true,
    sensitiveData: true,
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    encrypted,
    filename: `intake-vault-${stamp}.xlsx.enc`,
    count,
  };
}
