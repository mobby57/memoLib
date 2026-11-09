/**
 * Auto-Ecritures Service
 * Génération automatique d'écritures depuis factures et paiements
 * Inspiré Sage : zéro saisie manuelle pour les opérations courantes
 */

import { EcrituresService, LigneEcritureInput } from './ecritures.service';

interface FactureData {
  id: string;
  tenantId: string;
  numero: string;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  dateEmission: Date;
  dossierId?: string | null;
  clientNom: string;
  clientCompte?: string; // Numéro de compte client (411xxx)
  typeDossier?: string;
}

interface PaiementData {
  tenantId: string;
  factureId: string;
  factureNumero: string;
  montant: number;
  date: Date;
  mode: string;
  reference?: string;
  clientNom: string;
  clientCompte?: string;
}

export class AutoEcrituresService {
  /**
   * Génère l'écriture de vente lors de la validation d'une facture
   * 
   * Schéma comptable :
   *   411xxx (Client)    DÉBIT   montantTTC
   *   706xxx (Honoraires) CRÉDIT montantHT
   *   445710 (TVA coll.)  CRÉDIT montantTVA
   */
  static async genererEcritureFacture(facture: FactureData) {
    const compteHonoraires = this.determinerCompteHonoraires(facture.typeDossier);
    const compteClient = facture.clientCompte || '411000';

    const lignes: LigneEcritureInput[] = [
      {
        compteNumero: compteClient,
        libelle: `${facture.clientNom} - Facture ${facture.numero}`,
        debit: facture.montantTTC,
        credit: 0,
      },
      {
        compteNumero: compteHonoraires,
        libelle: `Honoraires - ${facture.numero}`,
        debit: 0,
        credit: facture.montantHT,
      },
    ];

    // Ligne TVA si applicable
    if (facture.montantTVA > 0) {
      lignes.push({
        compteNumero: '445710',
        libelle: `TVA ${facture.tauxTVA}% - ${facture.numero}`,
        debit: 0,
        credit: facture.montantTVA,
      });
    }

    return EcrituresService.creerEcriture({
      tenantId: facture.tenantId,
      journalCode: 'VE',
      date: facture.dateEmission,
      libelle: `Facture ${facture.numero} - ${facture.clientNom}`,
      reference: facture.numero,
      factureId: facture.id,
      dossierId: facture.dossierId || undefined,
      source: 'FACTURE',
      lignes,
    });
  }

  /**
   * Génère l'écriture d'encaissement lors d'un paiement
   * 
   * Schéma comptable :
   *   512000 (Banque)   DÉBIT   montant
   *   411xxx (Client)    CRÉDIT  montant
   */
  static async genererEcriturePaiement(paiement: PaiementData) {
    const compteClient = paiement.clientCompte || '411000';
    const compteBanque = '512000';

    const lignes: LigneEcritureInput[] = [
      {
        compteNumero: compteBanque,
        libelle: `Encaissement ${paiement.clientNom} - ${paiement.mode}`,
        debit: paiement.montant,
        credit: 0,
      },
      {
        compteNumero: compteClient,
        libelle: `Règlement facture ${paiement.factureNumero}`,
        debit: 0,
        credit: paiement.montant,
      },
    ];

    return EcrituresService.creerEcriture({
      tenantId: paiement.tenantId,
      journalCode: 'BQ',
      date: paiement.date,
      libelle: `Encaissement ${paiement.clientNom} - Fact. ${paiement.factureNumero}`,
      reference: paiement.reference || paiement.factureNumero,
      factureId: paiement.factureId,
      source: 'PAIEMENT',
      lignes,
    });
  }

  /**
   * Génère une écriture de débours (frais avancés pour un client)
   * 
   * Schéma :
   *   468600 (Débours)   DÉBIT   montant
   *   512000 (Banque)    CRÉDIT  montant
   */
  static async genererEcritureDebours(input: {
    tenantId: string;
    dossierId: string;
    clientNom: string;
    montant: number;
    libelle: string;
    date: Date;
  }) {
    const lignes: LigneEcritureInput[] = [
      {
        compteNumero: '468600',
        libelle: `Débours ${input.clientNom} - ${input.libelle}`,
        debit: input.montant,
        credit: 0,
      },
      {
        compteNumero: '512000',
        libelle: input.libelle,
        debit: 0,
        credit: input.montant,
      },
    ];

    return EcrituresService.creerEcriture({
      tenantId: input.tenantId,
      journalCode: 'BQ',
      date: input.date,
      libelle: `Débours - ${input.clientNom} - ${input.libelle}`,
      dossierId: input.dossierId,
      source: 'MANUELLE',
      lignes,
    });
  }

  /**
   * Détermine le compte d'honoraires selon le type de dossier
   */
  private static determinerCompteHonoraires(typeDossier?: string): string {
    if (!typeDossier) return '706100';

    const mapping: Record<string, string> = {
      // Contentieux
      'oqtf': '706200',
      'recours_contentieux': '706200',
      'appel': '706200',
      'cassation': '706200',
      'contentieux': '706200',
      // Consultation / assistance
      'consultation': '706100',
      'titre_sejour': '706100',
      'naturalisation': '706100',
      'regroupement_familial': '706100',
      // Forfait
      'forfait': '706300',
      'abonnement': '706300',
    };

    return mapping[typeDossier.toLowerCase()] || '706100';
  }
}
