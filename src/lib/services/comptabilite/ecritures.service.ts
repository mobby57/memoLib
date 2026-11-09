// @ts-nocheck
/**
 * Ecritures Service
 * CRUD Ã©critures comptables + validation + lettrage
 */

import prisma from '@/lib/prisma';

// Types locaux â€” miroir des enums Prisma
type SourceEcriture = 'MANUELLE' | 'FACTURE' | 'PAIEMENT' | 'BANQUE' | 'IA';
type StatutEcriture = 'BROUILLON' | 'VALIDEE' | 'LETTREE';

export interface LigneEcritureInput {
  compteNumero: string;
  libelle?: string;
  debit: number;
  credit: number;
}

export interface CreateEcritureInput {
  tenantId: string;
  journalCode: string;
  date: Date;
  libelle: string;
  reference?: string;
  factureId?: string;
  dossierId?: string;
  source?: SourceEcriture;
  lignes: LigneEcritureInput[];
}

export class EcrituresService {
  /**
   * CrÃ©e une Ã©criture comptable avec ses lignes
   * VÃ©rifie l'Ã©quilibre dÃ©bit/crÃ©dit avant insertion
   */
  static async creerEcriture(input: CreateEcritureInput) {
    // VÃ©rification Ã©quilibre
    const totalDebit = input.lignes.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = input.lignes.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Ã‰criture dÃ©sÃ©quilibrÃ©e : dÃ©bit=${totalDebit.toFixed(2)}, crÃ©dit=${totalCredit.toFixed(2)}`
      );
    }

    // RÃ©cupÃ©rer le journal
    const journal = await prisma.journal.findUnique({
      where: { tenantId_code: { tenantId: input.tenantId, code: input.journalCode } },
    });

    if (!journal) {
      throw new Error(`Journal "${input.journalCode}" introuvable pour ce cabinet`);
    }

    // GÃ©nÃ©rer le numÃ©ro d'Ã©criture (sÃ©quentiel par tenant)
    const numero = await this.genererNumeroEcriture(input.tenantId, input.journalCode);

    // RÃ©soudre les comptes par numÃ©ro
    const comptesMap = new Map<string, string>();
    for (const ligne of input.lignes) {
      if (!comptesMap.has(ligne.compteNumero)) {
        const compte = await prisma.compteComptable.findUnique({
          where: { tenantId_numero: { tenantId: input.tenantId, numero: ligne.compteNumero } },
        });
        if (!compte) {
          throw new Error(`Compte "${ligne.compteNumero}" introuvable`);
        }
        comptesMap.set(ligne.compteNumero, compte.id);
      }
    }

    // CrÃ©er l'Ã©criture + lignes en transaction
    const ecriture = await prisma.$transaction(async (tx) => {
      const ecr = await tx.ecriture.create({
        data: {
          tenantId: input.tenantId,
          journalId: journal.id,
          numero,
          date: input.date,
          libelle: input.libelle,
          reference: input.reference || null,
          factureId: input.factureId || null,
          dossierId: input.dossierId || null,
          source: input.source || 'MANUELLE',
          statut: 'BROUILLON',
          updatedAt: new Date(),
          Lignes: {
            create: input.lignes.map(l => ({
              compteId: comptesMap.get(l.compteNumero)!,
              libelle: l.libelle || null,
              debit: l.debit,
              credit: l.credit,
            })),
          },
        },
        include: { Lignes: { include: { Compte: true } }, Journal: true },
      });

      return ecr;
    });

    return ecriture;
  }

  /**
   * Valide un lot d'Ã©critures (passage brouillon â†’ validÃ©e)
   * Une Ã©criture validÃ©e ne peut plus Ãªtre modifiÃ©e
   */
  static async validerEcritures(tenantId: string, ecritureIds: string[], userId: string) {
    const result = await prisma.ecriture.updateMany({
      where: {
        id: { in: ecritureIds },
        tenantId,
        statut: 'BROUILLON',
      },
      data: {
        statut: 'VALIDEE',
        validatedBy: userId,
        validatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { validated: result.count };
  }

  /**
   * Liste les Ã©critures avec filtres
   */
  static async listerEcritures(tenantId: string, options?: {
    journalCode?: string;
    dateDebut?: Date;
    dateFin?: Date;
    statut?: StatutEcriture;
    compteNumero?: string;
    dossierId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { tenantId };

    if (options?.journalCode) {
      where.Journal = { code: options.journalCode };
    }
    if (options?.dateDebut || options?.dateFin) {
      where.date = {};
      if (options?.dateDebut) where.date.gte = options.dateDebut;
      if (options?.dateFin) where.date.lte = options.dateFin;
    }
    if (options?.statut) where.statut = options.statut;
    if (options?.dossierId) where.dossierId = options.dossierId;
    if (options?.compteNumero) {
      where.Lignes = { some: { Compte: { numero: options.compteNumero } } };
    }

    const [ecritures, total] = await Promise.all([
      prisma.ecriture.findMany({
        where,
        include: {
          Lignes: { include: { Compte: { select: { numero: true, libelle: true } } } },
          Journal: { select: { code: true, libelle: true } },
        },
        orderBy: { date: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.ecriture.count({ where }),
    ]);

    return { ecritures, total };
  }

  /**
   * Lettrage : rapproche deux Ã©critures (ex: facture + paiement)
   */
  static async lettrer(tenantId: string, ligneIds: string[]) {
    // VÃ©rifier que les lignes sont sur le mÃªme compte et s'Ã©quilibrent
    const lignes = await prisma.ligneEcriture.findMany({
      where: { id: { in: ligneIds } },
      include: { Ecriture: true, Compte: true },
    });

    if (lignes.length < 2) {
      throw new Error('Au moins 2 lignes nÃ©cessaires pour le lettrage');
    }

    const compteIds = Array.from(new Set(lignes.map(l => l.compteId)));
    if (compteIds.length > 1) {
      throw new Error('Toutes les lignes doivent Ãªtre sur le mÃªme compte');
    }

    const totalDebit = lignes.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lignes.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Lettrage dÃ©sÃ©quilibrÃ© : dÃ©bit=${totalDebit.toFixed(2)}, crÃ©dit=${totalCredit.toFixed(2)}`
      );
    }

    // GÃ©nÃ©rer un code de lettrage
    const codeLettrage = await this.genererCodeLettrage(tenantId);

    // Appliquer le lettrage
    await prisma.ligneEcriture.updateMany({
      where: { id: { in: ligneIds } },
      data: { lettrage: codeLettrage },
    });

    // Marquer les Ã©critures comme lettrÃ©es si toutes leurs lignes le sont
    const ecritureIds = Array.from(new Set(lignes.map(l => l.ecritureId)));
    for (const ecritureId of ecritureIds) {
      const lignesNonLettrees = await prisma.ligneEcriture.count({
        where: { ecritureId, lettrage: null },
      });
      if (lignesNonLettrees === 0) {
        await prisma.ecriture.update({
          where: { id: ecritureId },
          data: { statut: 'LETTREE', updatedAt: new Date() },
        });
      }
    }

    return { codeLettrage, lignesLettrees: ligneIds.length };
  }

  /**
   * GÃ©nÃ¨re le prochain numÃ©ro d'Ã©criture sÃ©quentiel
   */
  private static async genererNumeroEcriture(tenantId: string, journalCode: string): Promise<string> {
    const annee = new Date().getFullYear();
    const prefix = `${journalCode}-${annee}-`;

    const derniere = await prisma.ecriture.findFirst({
      where: { tenantId, numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });

    const dernierNum = derniere
      ? parseInt(derniere.numero.replace(prefix, ''))
      : 0;

    return `${prefix}${String(dernierNum + 1).padStart(5, '0')}`;
  }

  /**
   * GÃ©nÃ¨re le prochain code de lettrage (AA, AB, AC... ZZ)
   */
  private static async genererCodeLettrage(tenantId: string): Promise<string> {
    const dernier = await prisma.ligneEcriture.findFirst({
      where: {
        Ecriture: { tenantId },
        lettrage: { not: null },
      },
      orderBy: { lettrage: 'desc' },
      select: { lettrage: true },
    });

    if (!dernier?.lettrage) return 'AA';

    const code = dernier.lettrage;
    const second = code.charCodeAt(1);
    const first = code.charCodeAt(0);

    if (second < 90) { // Z = 90
      return String.fromCharCode(first) + String.fromCharCode(second + 1);
    }
    return String.fromCharCode(first + 1) + 'A';
  }
}

