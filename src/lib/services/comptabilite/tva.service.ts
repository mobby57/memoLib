/**
 * TVA Service
 * Calcul et déclaration de TVA (régime réel simplifié / normal)
 */

import prisma from '@/lib/prisma';
import { RegimeTVA } from '@prisma/client';

interface CalculTVA {
  tvaCollectee: number;
  tvaDeductible: number;
  tvaNette: number;
  details: {
    collectee: { compte: string; montant: number }[];
    deductible: { compte: string; montant: number }[];
  };
}

export class TVAService {
  /**
   * Calcule la TVA pour une période donnée
   */
  static async calculerTVA(tenantId: string, periode: { debut: Date; fin: Date }): Promise<CalculTVA> {
    // TVA collectée : crédit sur compte 445710
    const lignesCollectee = await prisma.ligneEcriture.findMany({
      where: {
        Ecriture: {
          tenantId,
          date: { gte: periode.debut, lte: periode.fin },
          statut: { in: ['VALIDEE', 'LETTREE'] },
        },
        Compte: { numero: { startsWith: '44571' } }, // 445710, 445711...
        credit: { gt: 0 },
      },
      include: { Compte: { select: { numero: true } } },
    });

    // TVA déductible : débit sur comptes 44566x
    const lignesDeductible = await prisma.ligneEcriture.findMany({
      where: {
        Ecriture: {
          tenantId,
          date: { gte: periode.debut, lte: periode.fin },
          statut: { in: ['VALIDEE', 'LETTREE'] },
        },
        Compte: { numero: { startsWith: '44566' } }, // 445660, 445661...
        debit: { gt: 0 },
      },
      include: { Compte: { select: { numero: true } } },
    });

    const tvaCollectee = lignesCollectee.reduce((sum, l) => sum + l.credit, 0);
    const tvaDeductible = lignesDeductible.reduce((sum, l) => sum + l.debit, 0);

    return {
      tvaCollectee: Math.round(tvaCollectee * 100) / 100,
      tvaDeductible: Math.round(tvaDeductible * 100) / 100,
      tvaNette: Math.round((tvaCollectee - tvaDeductible) * 100) / 100,
      details: {
        collectee: lignesCollectee.map(l => ({ compte: l.Compte.numero, montant: l.credit })),
        deductible: lignesDeductible.map(l => ({ compte: l.Compte.numero, montant: l.debit })),
      },
    };
  }

  /**
   * Crée ou met à jour une déclaration de TVA
   */
  static async creerDeclaration(tenantId: string, input: {
    periode: string; // "2026-Q2" ou "2026-06"
    regime: RegimeTVA;
  }) {
    const { debut, fin } = this.parsePeriode(input.periode);
    const dateLimite = this.calculerDateLimite(fin, input.regime);

    const calcul = await this.calculerTVA(tenantId, { debut, fin });

    return prisma.declarationTVA.upsert({
      where: { tenantId_periode: { tenantId, periode: input.periode } },
      create: {
        tenantId,
        periode: input.periode,
        regime: input.regime,
        tvaCollectee: calcul.tvaCollectee,
        tvaDeductible: calcul.tvaDeductible,
        tvaNette: calcul.tvaNette,
        dateLimite,
        statut: 'brouillon',
        updatedAt: new Date(),
      },
      update: {
        tvaCollectee: calcul.tvaCollectee,
        tvaDeductible: calcul.tvaDeductible,
        tvaNette: calcul.tvaNette,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Liste les déclarations TVA d'un tenant
   */
  static async listerDeclarations(tenantId: string, annee?: number) {
    const where: any = { tenantId };
    if (annee) {
      where.periode = { startsWith: String(annee) };
    }

    return prisma.declarationTVA.findMany({
      where,
      orderBy: { periode: 'desc' },
    });
  }

  /**
   * Parse une période ("2026-Q2" → dates, "2026-06" → dates)
   */
  private static parsePeriode(periode: string): { debut: Date; fin: Date } {
    if (periode.includes('Q')) {
      // Trimestriel : "2026-Q2"
      const [annee, q] = periode.split('-Q');
      const trimestre = parseInt(q);
      const moisDebut = (trimestre - 1) * 3; // 0-indexed
      const debut = new Date(parseInt(annee), moisDebut, 1);
      const fin = new Date(parseInt(annee), moisDebut + 3, 0); // Dernier jour du trimestre
      return { debut, fin };
    }

    // Mensuel : "2026-06"
    const [annee, mois] = periode.split('-').map(Number);
    const debut = new Date(annee, mois - 1, 1);
    const fin = new Date(annee, mois, 0); // Dernier jour du mois
    return { debut, fin };
  }

  /**
   * Calcule la date limite de déclaration
   */
  private static calculerDateLimite(finPeriode: Date, regime: RegimeTVA): Date {
    const dateLimite = new Date(finPeriode);

    switch (regime) {
      case 'MENSUEL':
        // Déclaration avant le 19 du mois suivant
        dateLimite.setMonth(dateLimite.getMonth() + 1);
        dateLimite.setDate(19);
        break;
      case 'TRIMESTRIEL':
        // Déclaration avant le 19 du mois suivant la fin du trimestre
        dateLimite.setMonth(dateLimite.getMonth() + 1);
        dateLimite.setDate(19);
        break;
      case 'ANNUEL_SIMPLIFIE':
        // CA12 : avant le 2ème jour ouvré suivant le 1er mai
        dateLimite.setMonth(4); // Mai
        dateLimite.setDate(3);
        break;
    }

    return dateLimite;
  }
}
