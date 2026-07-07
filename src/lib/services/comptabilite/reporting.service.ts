/**
 * Reporting Comptable Service
 * Grand livre, balance, compte de résultat, export FEC
 */

import prisma from '@/lib/prisma';

interface GrandLivreEntry {
  date: Date;
  journal: string;
  ecritureNumero: string;
  libelle: string;
  debit: number;
  credit: number;
  solde: number;
}

interface BalanceLine {
  numero: string;
  libelle: string;
  classe: number;
  totalDebit: number;
  totalCredit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

interface CompteResultat {
  produits: { compte: string; libelle: string; montant: number }[];
  charges: { compte: string; libelle: string; montant: number }[];
  totalProduits: number;
  totalCharges: number;
  resultat: number;
}

export class ReportingService {
  /**
   * Grand livre : toutes les écritures d'un compte sur une période
   */
  static async grandLivre(tenantId: string, options: {
    compteNumero: string;
    dateDebut: Date;
    dateFin: Date;
  }): Promise<{ compte: { numero: string; libelle: string }; ecritures: GrandLivreEntry[] }> {
    const compte = await prisma.compteComptable.findUnique({
      where: { tenantId_numero: { tenantId, numero: options.compteNumero } },
    });

    if (!compte) {
      throw new Error(`Compte ${options.compteNumero} introuvable`);
    }

    const lignes = await prisma.ligneEcriture.findMany({
      where: {
        compteId: compte.id,
        Ecriture: {
          tenantId,
          date: { gte: options.dateDebut, lte: options.dateFin },
          statut: { in: ['VALIDEE', 'LETTREE'] },
        },
      },
      include: {
        Ecriture: {
          select: { date: true, numero: true, libelle: true, Journal: { select: { code: true } } },
        },
      },
      orderBy: { Ecriture: { date: 'asc' } },
    });

    let solde = 0;
    const ecritures: GrandLivreEntry[] = lignes.map(l => {
      solde += l.debit - l.credit;
      return {
        date: l.Ecriture.date,
        journal: l.Ecriture.Journal.code,
        ecritureNumero: l.Ecriture.numero,
        libelle: l.libelle || l.Ecriture.libelle,
        debit: l.debit,
        credit: l.credit,
        solde,
      };
    });

    return {
      compte: { numero: compte.numero, libelle: compte.libelle },
      ecritures,
    };
  }

  /**
   * Balance générale : soldes de tous les comptes
   */
  static async balance(tenantId: string, options: {
    dateDebut: Date;
    dateFin: Date;
    classeMin?: number;
    classeMax?: number;
  }): Promise<{ lignes: BalanceLine[]; totaux: { debit: number; credit: number } }> {
    const comptes = await prisma.compteComptable.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(options.classeMin || options.classeMax ? {
          classe: {
            ...(options.classeMin ? { gte: options.classeMin } : {}),
            ...(options.classeMax ? { lte: options.classeMax } : {}),
          },
        } : {}),
      },
      orderBy: { numero: 'asc' },
    });

    const lignes: BalanceLine[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const compte of comptes) {
      const agg = await prisma.ligneEcriture.aggregate({
        where: {
          compteId: compte.id,
          Ecriture: {
            tenantId,
            date: { gte: options.dateDebut, lte: options.dateFin },
            statut: { in: ['VALIDEE', 'LETTREE'] },
          },
        },
        _sum: { debit: true, credit: true },
      });

      const debit = agg._sum.debit || 0;
      const credit = agg._sum.credit || 0;

      // Ne montrer que les comptes mouvementés
      if (debit === 0 && credit === 0) continue;

      const solde = debit - credit;
      lignes.push({
        numero: compte.numero,
        libelle: compte.libelle,
        classe: compte.classe,
        totalDebit: Math.round(debit * 100) / 100,
        totalCredit: Math.round(credit * 100) / 100,
        soldeDebiteur: solde > 0 ? Math.round(solde * 100) / 100 : 0,
        soldeCrediteur: solde < 0 ? Math.round(Math.abs(solde) * 100) / 100 : 0,
      });

      totalDebit += debit;
      totalCredit += credit;
    }

    return {
      lignes,
      totaux: {
        debit: Math.round(totalDebit * 100) / 100,
        credit: Math.round(totalCredit * 100) / 100,
      },
    };
  }

  /**
   * Compte de résultat (produits - charges)
   */
  static async compteDeResultat(tenantId: string, options: {
    dateDebut: Date;
    dateFin: Date;
  }): Promise<CompteResultat> {
    // Classe 7 = Produits
    const produitsBalance = await this.balance(tenantId, {
      ...options,
      classeMin: 7,
      classeMax: 7,
    });

    // Classe 6 = Charges
    const chargesBalance = await this.balance(tenantId, {
      ...options,
      classeMin: 6,
      classeMax: 6,
    });

    const produits = produitsBalance.lignes.map(l => ({
      compte: l.numero,
      libelle: l.libelle,
      montant: l.soldeCrediteur || -l.soldeDebiteur,
    }));

    const charges = chargesBalance.lignes.map(l => ({
      compte: l.numero,
      libelle: l.libelle,
      montant: l.soldeDebiteur || -l.soldeCrediteur,
    }));

    const totalProduits = produits.reduce((sum, p) => sum + p.montant, 0);
    const totalCharges = charges.reduce((sum, c) => sum + c.montant, 0);

    return {
      produits,
      charges,
      totalProduits: Math.round(totalProduits * 100) / 100,
      totalCharges: Math.round(totalCharges * 100) / 100,
      resultat: Math.round((totalProduits - totalCharges) * 100) / 100,
    };
  }

  /**
   * Export FEC (Fichier des Écritures Comptables)
   * Conforme à l'article L47 A-1 du LPF
   * Format TSV avec colonnes normalisées
   */
  static async exportFEC(tenantId: string, annee: number): Promise<string> {
    const debut = new Date(annee, 0, 1);
    const fin = new Date(annee, 11, 31, 23, 59, 59);

    const ecritures = await prisma.ecriture.findMany({
      where: {
        tenantId,
        date: { gte: debut, lte: fin },
        statut: { in: ['VALIDEE', 'LETTREE'] },
      },
      include: {
        Journal: { select: { code: true, libelle: true } },
        Lignes: {
          include: { Compte: { select: { numero: true, libelle: true } } },
        },
      },
      orderBy: [{ date: 'asc' }, { numero: 'asc' }],
    });

    // En-tête FEC (18 colonnes obligatoires)
    const header = [
      'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
      'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
      'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
      'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise',
    ].join('\t');

    const lines: string[] = [header];

    for (const ecriture of ecritures) {
      const dateStr = this.formatDateFEC(ecriture.date);
      const validDate = ecriture.validatedAt ? this.formatDateFEC(ecriture.validatedAt) : dateStr;

      for (const ligne of ecriture.Lignes) {
        // CompAuxNum/Lib : sous-compte auxiliaire (clients 411xxx)
        const isAux = ligne.Compte.numero.startsWith('411') || ligne.Compte.numero.startsWith('401');

        lines.push([
          ecriture.Journal.code,
          ecriture.Journal.libelle,
          ecriture.numero,
          dateStr,
          ligne.Compte.numero,
          ligne.Compte.libelle,
          isAux ? ligne.Compte.numero : '',
          isAux ? ligne.Compte.libelle : '',
          ecriture.reference || '',
          dateStr,
          ligne.libelle || ecriture.libelle,
          ligne.debit.toFixed(2).replace('.', ','),
          ligne.credit.toFixed(2).replace('.', ','),
          ligne.lettrage || '',
          '', // DateLet
          validDate,
          (ligne.debit || ligne.credit).toFixed(2).replace('.', ','),
          'EUR',
        ].join('\t'));
      }
    }

    return lines.join('\n');
  }

  /**
   * Dashboard financier : KPIs pour le tableau de bord
   */
  static async dashboard(tenantId: string) {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const debutAnnee = new Date(maintenant.getFullYear(), 0, 1);

    // CA du mois (crédits sur comptes 706xxx)
    const caMois = await prisma.ligneEcriture.aggregate({
      where: {
        Ecriture: {
          tenantId,
          date: { gte: debutMois },
          statut: { in: ['VALIDEE', 'LETTREE'] },
        },
        Compte: { numero: { startsWith: '706' } },
      },
      _sum: { credit: true },
    });

    // CA annuel
    const caAnnuel = await prisma.ligneEcriture.aggregate({
      where: {
        Ecriture: {
          tenantId,
          date: { gte: debutAnnee },
          statut: { in: ['VALIDEE', 'LETTREE'] },
        },
        Compte: { numero: { startsWith: '706' } },
      },
      _sum: { credit: true },
    });

    // Factures impayées
    const facturesImpayees = await prisma.facture.aggregate({
      where: { tenantId, statut: { in: ['envoyee', 'en_retard'] } },
      _sum: { montantTTC: true },
      _count: true,
    });

    // Écritures en brouillon (à valider)
    const ecrituresBrouillon = await prisma.ecriture.count({
      where: { tenantId, statut: 'BROUILLON' },
    });

    return {
      caMois: Math.round((caMois._sum.credit || 0) * 100) / 100,
      caAnnuel: Math.round((caAnnuel._sum.credit || 0) * 100) / 100,
      facturesImpayees: {
        montant: Math.round((facturesImpayees._sum.montantTTC || 0) * 100) / 100,
        nombre: facturesImpayees._count || 0,
      },
      ecrituresAValider: ecrituresBrouillon,
    };
  }

  /**
   * Formate une date au format FEC (YYYYMMDD)
   */
  private static formatDateFEC(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
}
