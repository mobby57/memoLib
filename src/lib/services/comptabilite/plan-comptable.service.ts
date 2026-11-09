// @ts-nocheck
/**
 * Plan Comptable Service
 * Gestion du plan comptable par tenant (inspirÃ© PCG franÃ§ais)
 * 
 * Classes PCG :
 * 1 - Comptes de capitaux
 * 2 - Comptes d'immobilisations
 * 3 - Comptes de stocks
 * 4 - Comptes de tiers
 * 5 - Comptes financiers
 * 6 - Comptes de charges
 * 7 - Comptes de produits
 */

import prisma from '@/lib/prisma';

// Type local â€” miroir de l'enum Prisma TypeCompte
type TypeCompte = 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT';

export interface CompteInput {
  numero: string;
  libelle: string;
  classe: number;
  type: TypeCompte;
  parentId?: string;
}

/**
 * Plan comptable prÃ©-configurÃ© pour cabinets d'avocats
 */
const PLAN_COMPTABLE_AVOCAT: CompteInput[] = [
  // Classe 4 - Tiers
  { numero: '411000', libelle: 'Clients - Honoraires', classe: 4, type: 'ACTIF' },
  { numero: '401000', libelle: 'Fournisseurs', classe: 4, type: 'PASSIF' },
  { numero: '421000', libelle: 'Personnel - RÃ©munÃ©rations dues', classe: 4, type: 'PASSIF' },
  { numero: '431000', libelle: 'SÃ©curitÃ© sociale', classe: 4, type: 'PASSIF' },
  { numero: '445710', libelle: 'TVA collectÃ©e', classe: 4, type: 'PASSIF' },
  { numero: '445660', libelle: 'TVA dÃ©ductible sur ABS', classe: 4, type: 'ACTIF' },
  { numero: '445670', libelle: 'CrÃ©dit de TVA', classe: 4, type: 'ACTIF' },
  { numero: '455000', libelle: 'AssociÃ©s - Comptes courants', classe: 4, type: 'PASSIF' },
  { numero: '467000', libelle: 'CARPA - Fonds clients', classe: 4, type: 'ACTIF' },
  { numero: '468600', libelle: 'DÃ©bours Ã  refacturer', classe: 4, type: 'ACTIF' },

  // Classe 5 - Financiers
  { numero: '512000', libelle: 'Banque', classe: 5, type: 'ACTIF' },
  { numero: '512100', libelle: 'Banque CARPA', classe: 5, type: 'ACTIF' },
  { numero: '530000', libelle: 'Caisse', classe: 5, type: 'ACTIF' },

  // Classe 6 - Charges
  { numero: '606000', libelle: 'Fournitures non stockÃ©es', classe: 6, type: 'CHARGE' },
  { numero: '613200', libelle: 'Locations immobiliÃ¨res', classe: 6, type: 'CHARGE' },
  { numero: '616000', libelle: 'Primes d\'assurance', classe: 6, type: 'CHARGE' },
  { numero: '618100', libelle: 'Documentation juridique', classe: 6, type: 'CHARGE' },
  { numero: '622600', libelle: 'Honoraires rÃ©trocÃ©dÃ©s', classe: 6, type: 'CHARGE' },
  { numero: '625100', libelle: 'Voyages et dÃ©placements', classe: 6, type: 'CHARGE' },
  { numero: '625600', libelle: 'Frais de missions (audiences)', classe: 6, type: 'CHARGE' },
  { numero: '626100', libelle: 'Frais postaux et tÃ©lÃ©coms', classe: 6, type: 'CHARGE' },
  { numero: '627000', libelle: 'Services bancaires', classe: 6, type: 'CHARGE' },
  { numero: '631000', libelle: 'ImpÃ´ts et taxes', classe: 6, type: 'CHARGE' },
  { numero: '641000', libelle: 'RÃ©munÃ©rations du personnel', classe: 6, type: 'CHARGE' },
  { numero: '645000', libelle: 'Charges sociales', classe: 6, type: 'CHARGE' },
  { numero: '646000', libelle: 'Cotisations Ordre des avocats', classe: 6, type: 'CHARGE' },
  { numero: '681000', libelle: 'Dotations amortissements', classe: 6, type: 'CHARGE' },

  // Classe 7 - Produits
  { numero: '706100', libelle: 'Honoraires de consultation', classe: 7, type: 'PRODUIT' },
  { numero: '706200', libelle: 'Honoraires de contentieux', classe: 7, type: 'PRODUIT' },
  { numero: '706300', libelle: 'Honoraires forfaitaires', classe: 7, type: 'PRODUIT' },
  { numero: '706400', libelle: 'Honoraires de rÃ©sultat', classe: 7, type: 'PRODUIT' },
  { numero: '708500', libelle: 'DÃ©bours refacturÃ©s', classe: 7, type: 'PRODUIT' },
  { numero: '764000', libelle: 'Revenus valeurs mobiliÃ¨res', classe: 7, type: 'PRODUIT' },
  { numero: '791000', libelle: 'Transferts de charges', classe: 7, type: 'PRODUIT' },
];

export class PlanComptableService {
  /**
   * Initialise le plan comptable pour un nouveau tenant
   */
  static async initialiserPlanComptable(tenantId: string): Promise<number> {
    const comptes = PLAN_COMPTABLE_AVOCAT.map(compte => ({
      tenantId,
      numero: compte.numero,
      libelle: compte.libelle,
      classe: compte.classe,
      type: compte.type,
      parentId: compte.parentId || null,
      updatedAt: new Date(),
    }));

    const result = await prisma.compteComptable.createMany({
      data: comptes,
      skipDuplicates: true,
    });

    return result.count;
  }

  /**
   * RÃ©cupÃ¨re le plan comptable d'un tenant
   */
  static async getPlanComptable(tenantId: string, options?: {
    classe?: number;
    type?: TypeCompte;
    actifOnly?: boolean;
  }) {
    return prisma.compteComptable.findMany({
      where: {
        tenantId,
        ...(options?.classe ? { classe: options.classe } : {}),
        ...(options?.type ? { type: options.type } : {}),
        ...(options?.actifOnly !== false ? { isActive: true } : {}),
      },
      orderBy: { numero: 'asc' },
    });
  }

  /**
   * CrÃ©e un compte (ex: sous-compte client 411001)
   */
  static async creerCompte(tenantId: string, input: CompteInput) {
    return prisma.compteComptable.create({
      data: {
        tenantId,
        numero: input.numero,
        libelle: input.libelle,
        classe: input.classe,
        type: input.type,
        parentId: input.parentId || null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * CrÃ©e un sous-compte client automatiquement (411 + code client)
   */
  static async creerCompteClient(tenantId: string, clientId: string, clientNom: string) {
    // Trouver le prochain numÃ©ro disponible
    const dernierCompteClient = await prisma.compteComptable.findFirst({
      where: { tenantId, numero: { startsWith: '411' } },
      orderBy: { numero: 'desc' },
    });

    const dernierNum = dernierCompteClient
      ? parseInt(dernierCompteClient.numero.slice(3))
      : 0;
    const nouveauNumero = `411${String(dernierNum + 1).padStart(3, '0')}`;

    return prisma.compteComptable.create({
      data: {
        tenantId,
        numero: nouveauNumero,
        libelle: `Client - ${clientNom}`,
        classe: 4,
        type: 'ACTIF',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Trouve un compte par numÃ©ro
   */
  static async getCompteByNumero(tenantId: string, numero: string) {
    return prisma.compteComptable.findUnique({
      where: { tenantId_numero: { tenantId, numero } },
    });
  }

  /**
   * Met Ã  jour le solde d'un compte
   */
  static async recalculerSolde(compteId: string) {
    const lignes = await prisma.ligneEcriture.findMany({
      where: {
        compteId,
        Ecriture: { statut: { in: ['VALIDEE', 'LETTREE'] } },
      },
      select: { debit: true, credit: true },
    });

    const solde = lignes.reduce((acc, l) => acc + l.debit - l.credit, 0);

    return prisma.compteComptable.update({
      where: { id: compteId },
      data: { solde },
    });
  }
}

