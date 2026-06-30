/**
 * Rapprochement Bancaire Service
 * Import de relevés + matching IA (inspiré Sage Copilot)
 */

import prisma from '@/lib/prisma';

interface MouvementImport {
  date: string; // YYYY-MM-DD
  libelle: string;
  montant: number; // positif = crédit, négatif = débit
  reference?: string;
}

interface SuggestionRapprochement {
  mouvementId: string;
  mouvementLibelle: string;
  mouvementMontant: number;
  suggestion: {
    type: 'FACTURE' | 'ECRITURE' | 'INCONNU';
    factureId?: string;
    factureNumero?: string;
    ecritureId?: string;
    clientNom?: string;
  } | null;
  confidence: number;
}

export class RapprochementService {
  /**
   * Importe des mouvements bancaires depuis un CSV ou OFX
   */
  static async importerMouvements(
    tenantId: string,
    compteBancaire: string,
    mouvements: MouvementImport[]
  ) {
    const data = mouvements.map(m => ({
      tenantId,
      compteBancaire,
      date: new Date(m.date),
      libelle: m.libelle,
      montant: m.montant,
      reference: m.reference || null,
      isRapproche: false,
    }));

    const result = await prisma.mouvementBancaire.createMany({
      data,
      skipDuplicates: true,
    });

    return { imported: result.count };
  }

  /**
   * Parse un fichier CSV bancaire (format standard français)
   * Colonnes attendues : Date;Libellé;Débit;Crédit ou Date;Libellé;Montant
   */
  static parseCSV(content: string): MouvementImport[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    const separator = header.includes(';') ? ';' : ',';
    const columns = header.split(separator).map(c => c.trim());

    const dateIdx = columns.findIndex(c => c.includes('date'));
    const libelleIdx = columns.findIndex(c => c.includes('libell') || c.includes('description'));
    const montantIdx = columns.findIndex(c => c.includes('montant') || c.includes('amount'));
    const debitIdx = columns.findIndex(c => c.includes('debit') || c.includes('débit'));
    const creditIdx = columns.findIndex(c => c.includes('credit') || c.includes('crédit'));

    if (dateIdx === -1 || libelleIdx === -1) {
      throw new Error('Format CSV non reconnu : colonnes Date et Libellé requises');
    }

    return lines.slice(1).filter(l => l.trim()).map(line => {
      const cols = line.split(separator).map(c => c.trim().replace(/"/g, ''));

      let montant: number;
      if (montantIdx !== -1) {
        montant = parseFloat(cols[montantIdx].replace(',', '.').replace(/\s/g, '')) || 0;
      } else {
        const debit = parseFloat((cols[debitIdx] || '0').replace(',', '.').replace(/\s/g, '')) || 0;
        const credit = parseFloat((cols[creditIdx] || '0').replace(',', '.').replace(/\s/g, '')) || 0;
        montant = credit - debit;
      }

      // Parse date (DD/MM/YYYY → YYYY-MM-DD)
      const dateStr = cols[dateIdx];
      let date: string;
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else {
        date = dateStr;
      }

      return {
        date,
        libelle: cols[libelleIdx],
        montant,
      };
    });
  }

  /**
   * Suggère des rapprochements entre mouvements bancaires et factures
   * Utilise un matching par montant + similarité du libellé
   */
  static async suggererRapprochements(tenantId: string): Promise<SuggestionRapprochement[]> {
    // Mouvements non rapprochés
    const mouvements = await prisma.mouvementBancaire.findMany({
      where: { tenantId, isRapproche: false },
      orderBy: { date: 'desc' },
      take: 100,
    });

    // Factures en attente de paiement
    const facturesEnAttente = await prisma.facture.findMany({
      where: {
        tenantId,
        statut: { in: ['envoyee', 'en_retard'] },
      },
      include: {
        Client: { select: { firstName: true, lastName: true } },
      },
    });

    const suggestions: SuggestionRapprochement[] = [];

    for (const mouvement of mouvements) {
      // On cherche parmi les encaissements (montant positif)
      if (mouvement.montant <= 0) {
        suggestions.push({
          mouvementId: mouvement.id,
          mouvementLibelle: mouvement.libelle,
          mouvementMontant: mouvement.montant,
          suggestion: null,
          confidence: 0,
        });
        continue;
      }

      // Match par montant exact
      const matchExact = facturesEnAttente.find(f =>
        Math.abs(f.montantTTC - mouvement.montant) < 0.01
      );

      if (matchExact) {
        const clientNom = `${matchExact.Client.firstName} ${matchExact.Client.lastName}`;
        const libelleMatch = this.similarite(
          mouvement.libelle.toLowerCase(),
          clientNom.toLowerCase()
        );

        suggestions.push({
          mouvementId: mouvement.id,
          mouvementLibelle: mouvement.libelle,
          mouvementMontant: mouvement.montant,
          suggestion: {
            type: 'FACTURE',
            factureId: matchExact.id,
            factureNumero: matchExact.numero,
            clientNom,
          },
          confidence: libelleMatch > 0.3 ? 0.95 : 0.7,
        });
        continue;
      }

      // Match par montant approchant (± 5%)
      const matchApprox = facturesEnAttente.find(f =>
        Math.abs(f.montantTTC - mouvement.montant) / f.montantTTC < 0.05
      );

      if (matchApprox) {
        const clientNom = `${matchApprox.Client.firstName} ${matchApprox.Client.lastName}`;
        suggestions.push({
          mouvementId: mouvement.id,
          mouvementLibelle: mouvement.libelle,
          mouvementMontant: mouvement.montant,
          suggestion: {
            type: 'FACTURE',
            factureId: matchApprox.id,
            factureNumero: matchApprox.numero,
            clientNom,
          },
          confidence: 0.5,
        });
        continue;
      }

      suggestions.push({
        mouvementId: mouvement.id,
        mouvementLibelle: mouvement.libelle,
        mouvementMontant: mouvement.montant,
        suggestion: null,
        confidence: 0,
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Confirme un rapprochement et marque le mouvement comme traité
   */
  static async confirmerRapprochement(
    tenantId: string,
    mouvementId: string,
    ecritureId: string
  ) {
    await prisma.mouvementBancaire.update({
      where: { id: mouvementId },
      data: { isRapproche: true, ecritureId },
    });

    return { success: true };
  }

  /**
   * Statistiques de rapprochement
   */
  static async getStats(tenantId: string) {
    const [total, rapproches, nonRapproches] = await Promise.all([
      prisma.mouvementBancaire.count({ where: { tenantId } }),
      prisma.mouvementBancaire.count({ where: { tenantId, isRapproche: true } }),
      prisma.mouvementBancaire.count({ where: { tenantId, isRapproche: false } }),
    ]);

    return {
      total,
      rapproches,
      nonRapproches,
      tauxRapprochement: total > 0 ? Math.round((rapproches / total) * 100) : 0,
    };
  }

  /**
   * Calcul de similarité simple (Jaccard sur trigrammes)
   */
  private static similarite(a: string, b: string): number {
    if (!a || !b) return 0;
    const trigramsA = this.trigrammes(a);
    const trigramsB = this.trigrammes(b);
    const setA = new Set(trigramsA);
    const setB = new Set(trigramsB);
    const intersection = trigramsA.filter(t => setB.has(t)).length;
    const unionSet = new Set(trigramsA.concat(trigramsB));
    const union = unionSet.size;
    return union > 0 ? intersection / union : 0;
  }

  private static trigrammes(s: string): string[] {
    const result: string[] = [];
    for (let i = 0; i <= s.length - 3; i++) {
      result.push(s.slice(i, i + 3));
    }
    return result;
  }
}
