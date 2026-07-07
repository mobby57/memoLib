/**
 * CARPA Service
 * Gestion des fonds clients (maniement de fonds - obligation déontologique avocats)
 * 
 * La CARPA (Caisse des Règlements Pécuniaires des Avocats) est un organisme
 * qui garantit la séparation des fonds personnels de l'avocat et des fonds
 * qu'il détient pour le compte de ses clients.
 */

import prisma from '@/lib/prisma';

// Type local — miroir de l'enum Prisma TypeMouvementCARPA
type TypeMouvementCARPA = 'PROVISION' | 'RESTITUTION' | 'REGLEMENT_TIERS' | 'HONORAIRES';

interface MouvementCARPAInput {
  tenantId: string;
  dossierId: string;
  clientId: string;
  type: TypeMouvementCARPA;
  montant: number;
  libelle: string;
  reference?: string;
}

export class CARPAService {
  /**
   * Enregistre un mouvement CARPA et met à jour le solde
   */
  static async enregistrerMouvement(input: MouvementCARPAInput) {
    // Calculer le solde actuel du dossier
    const soldeActuel = await this.getSoldeDossier(input.tenantId, input.dossierId);

    // Calcul nouveau solde
    let nouveauSolde: number;
    switch (input.type) {
      case 'PROVISION':
        nouveauSolde = soldeActuel + input.montant;
        break;
      case 'RESTITUTION':
      case 'REGLEMENT_TIERS':
      case 'HONORAIRES':
        // Vérifier qu'il y a assez de fonds
        if (soldeActuel < input.montant) {
          throw new Error(
            `Fonds insuffisants : solde CARPA=${soldeActuel.toFixed(2)}€, demandé=${input.montant.toFixed(2)}€`
          );
        }
        nouveauSolde = soldeActuel - input.montant;
        break;
      default:
        throw new Error(`Type de mouvement CARPA inconnu : ${input.type}`);
    }

    return prisma.mouvementCARPA.create({
      data: {
        tenantId: input.tenantId,
        dossierId: input.dossierId,
        clientId: input.clientId,
        type: input.type,
        montant: input.montant,
        libelle: input.libelle,
        reference: input.reference || null,
        soldeApres: nouveauSolde,
        date: new Date(),
      },
    });
  }

  /**
   * Solde CARPA pour un dossier
   */
  static async getSoldeDossier(tenantId: string, dossierId: string): Promise<number> {
    const dernierMouvement = await prisma.mouvementCARPA.findFirst({
      where: { tenantId, dossierId },
      orderBy: { date: 'desc' },
      select: { soldeApres: true },
    });

    return dernierMouvement?.soldeApres || 0;
  }

  /**
   * Solde CARPA global du cabinet (tous dossiers)
   */
  static async getSoldeGlobal(tenantId: string): Promise<number> {
    // Somme des derniers soldes de chaque dossier
    const dossiers = await prisma.mouvementCARPA.groupBy({
      by: ['dossierId'],
      where: { tenantId },
      _max: { date: true },
    });

    let total = 0;
    for (const d of dossiers) {
      const solde = await this.getSoldeDossier(tenantId, d.dossierId);
      total += solde;
    }

    return total;
  }

  /**
   * Historique des mouvements CARPA pour un dossier
   */
  static async getHistoriqueDossier(tenantId: string, dossierId: string) {
    return prisma.mouvementCARPA.findMany({
      where: { tenantId, dossierId },
      orderBy: { date: 'desc' },
      include: {
        Client: { select: { firstName: true, lastName: true } },
        Dossier: { select: { numero: true, typeDossier: true } },
      },
    });
  }

  /**
   * Résumé CARPA par client
   */
  static async getResumeParClient(tenantId: string) {
    const mouvements = await prisma.mouvementCARPA.groupBy({
      by: ['clientId', 'dossierId'],
      where: { tenantId },
      _max: { date: true },
    });

    const resume: Array<{
      clientId: string;
      dossierId: string;
      solde: number;
    }> = [];

    for (const m of mouvements) {
      const solde = await this.getSoldeDossier(tenantId, m.dossierId);
      if (solde > 0) {
        resume.push({
          clientId: m.clientId,
          dossierId: m.dossierId,
          solde,
        });
      }
    }

    return resume;
  }

  /**
   * Alerte : dossiers avec provisions CARPA mais sans mouvement depuis X jours
   */
  static async getAlertesProvisionsDormantes(tenantId: string, joursInactivite = 90) {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - joursInactivite);

    // Dossiers avec un solde > 0 et dont le dernier mouvement est ancien
    const dossiers = await prisma.mouvementCARPA.groupBy({
      by: ['dossierId'],
      where: { tenantId },
      _max: { date: true },
    });

    const alertes: Array<{
      dossierId: string;
      solde: number;
      dernierMouvement: Date;
      joursInactif: number;
    }> = [];

    for (const d of dossiers) {
      if (d._max.date && d._max.date < dateLimite) {
        const solde = await this.getSoldeDossier(tenantId, d.dossierId);
        if (solde > 0) {
          const joursInactif = Math.floor(
            (Date.now() - d._max.date.getTime()) / (1000 * 60 * 60 * 24)
          );
          alertes.push({
            dossierId: d.dossierId,
            solde,
            dernierMouvement: d._max.date,
            joursInactif,
          });
        }
      }
    }

    return alertes.sort((a, b) => b.joursInactif - a.joursInactif);
  }
}
