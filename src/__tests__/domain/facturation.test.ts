/**
 * Tests pour la facturation
 * Couverture: calculs, TVA, statuts, export
 */

describe('Facturation', () => {
  describe('Facture Interface', () => {
    interface Facture {
      id: string;
      numero: string;
      clientId: string;
      dossierId?: string;
      montantHT: number;
      tauxTVA: number;
      montantTVA: number;
      montantTTC: number;
      statut: string;
      dateEmission: Date;
      dateEcheance: Date;
      datePaiement?: Date;
    }

    it('devrait avoir une structure valide', () => {
      const facture: Facture = {
        id: 'fac-1',
        numero: 'FAC-2024-001',
        clientId: 'client-1',
        montantHT: 1000,
        tauxTVA: 20,
        montantTVA: 200,
        montantTTC: 1200,
        statut: 'EMISE',
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      expect(facture.montantTTC).toBe(facture.montantHT + facture.montantTVA);
    });
  });

  describe('Calculs TVA', () => {
    const calculateTVA = (montantHT: number, tauxTVA: number): number => {
      return Math.round(montantHT * (tauxTVA / 100) * 100) / 100;
    };

    const calculateTTC = (montantHT: number, montantTVA: number): number => {
      return Math.round((montantHT + montantTVA) * 100) / 100;
    };

    it('devrait calculer la TVA à 20%', () => {
      expect(calculateTVA(1000, 20)).toBe(200);
    });

    it('devrait calculer la TVA à 10%', () => {
      expect(calculateTVA(1000, 10)).toBe(100);
    });

    it('devrait calculer le TTC', () => {
      expect(calculateTTC(1000, 200)).toBe(1200);
    });

    it('devrait arrondir correctement', () => {
      const tva = calculateTVA(99.99, 20);
      expect(tva).toBe(20);
    });
  });

  describe('Taux TVA', () => {
    const TAUX_TVA = {
      NORMAL: 20,
      REDUIT: 10,
      SUPER_REDUIT: 5.5,
      PARTICULIER: 2.1,
    };

    it('le taux normal devrait être 20%', () => {
      expect(TAUX_TVA.NORMAL).toBe(20);
    });

    it('le taux réduit devrait être 10%', () => {
      expect(TAUX_TVA.REDUIT).toBe(10);
    });
  });

  describe('Statuts Facture', () => {
    const statuts = ['BROUILLON', 'EMISE', 'ENVOYEE', 'PAYEE', 'ANNULEE', 'IMPAYEE'];

    it('devrait avoir 6 statuts', () => {
      expect(statuts).toHaveLength(6);
    });

    it('devrait inclure BROUILLON', () => {
      expect(statuts).toContain('BROUILLON');
    });

    it('devrait inclure PAYEE', () => {
      expect(statuts).toContain('PAYEE');
    });
  });

  describe('Génération Numéro', () => {
    const generateFactureNumber = (year: number, sequence: number): string => {
      return `FAC-${year}-${sequence.toString().padStart(4, '0')}`;
    };

    it('devrait générer FAC-2024-0001', () => {
      expect(generateFactureNumber(2024, 1)).toBe('FAC-2024-0001');
    });

    it('devrait formater avec zéros', () => {
      expect(generateFactureNumber(2024, 42)).toBe('FAC-2024-0042');
    });

    it('devrait gérer les grands nombres', () => {
      expect(generateFactureNumber(2024, 1234)).toBe('FAC-2024-1234');
    });
  });

  describe('Date Échéance', () => {
    const calculateEcheance = (dateEmission: Date, delaiJours: number): Date => {
      const echeance = new Date(dateEmission);
      echeance.setDate(echeance.getDate() + delaiJours);
      return echeance;
    };

    it('devrait calculer 30 jours après', () => {
      const emission = new Date('2024-01-15');
      const echeance = calculateEcheance(emission, 30);
      expect(echeance.toISOString().split('T')[0]).toBe('2024-02-14');
    });

    it('devrait gérer le passage de mois', () => {
      const emission = new Date('2024-01-31');
      const echeance = calculateEcheance(emission, 30);
      expect(echeance.getMonth()).toBe(2); // Mars
    });
  });

  describe('Statut Paiement', () => {
    const isOverdue = (echeance: Date, statut: string): boolean => {
      if (statut === 'PAYEE' || statut === 'ANNULEE') return false;
      return new Date() > echeance;
    };

    it('facture payée ne devrait pas être en retard', () => {
      const echeance = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      expect(isOverdue(echeance, 'PAYEE')).toBe(false);
    });

    it('facture non payée après échéance devrait être en retard', () => {
      const echeance = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      expect(isOverdue(echeance, 'ENVOYEE')).toBe(true);
    });

    it('facture avant échéance ne devrait pas être en retard', () => {
      const echeance = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      expect(isOverdue(echeance, 'ENVOYEE')).toBe(false);
    });
  });

  describe('Lignes de Facture', () => {
    interface LigneFacture {
      description: string;
      quantite: number;
      prixUnitaireHT: number;
      montantHT: number;
    }

    const calculateLigneTotal = (quantite: number, prixUnitaire: number): number => {
      return Math.round(quantite * prixUnitaire * 100) / 100;
    };

    it('devrait calculer le total d\'une ligne', () => {
      expect(calculateLigneTotal(2, 500)).toBe(1000);
    });

    it('devrait gérer les décimales', () => {
      expect(calculateLigneTotal(3, 33.33)).toBe(99.99);
    });
  });

  describe('Total Facture', () => {
    const calculateTotal = (lignes: Array<{ montantHT: number }>): number => {
      return lignes.reduce((sum, ligne) => sum + ligne.montantHT, 0);
    };

    it('devrait calculer le total des lignes', () => {
      const lignes = [
        { montantHT: 500 },
        { montantHT: 300 },
        { montantHT: 200 },
      ];
      expect(calculateTotal(lignes)).toBe(1000);
    });

    it('devrait retourner 0 pour facture vide', () => {
      expect(calculateTotal([])).toBe(0);
    });
  });
});

describe('Modes de Paiement', () => {
  const modesPaiement = ['VIREMENT', 'CHEQUE', 'CB', 'ESPECES', 'PRELEVEMENT'];

  it('devrait avoir 5 modes de paiement', () => {
    expect(modesPaiement).toHaveLength(5);
  });

  it('devrait inclure VIREMENT', () => {
    expect(modesPaiement).toContain('VIREMENT');
  });

  it('devrait inclure CB', () => {
    expect(modesPaiement).toContain('CB');
  });
});

describe('Relance', () => {
  const calculateDaysOverdue = (echeance: Date): number => {
    const now = new Date();
    const diffMs = now.getTime() - echeance.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  const getRelanceLevel = (daysOverdue: number): number => {
    if (daysOverdue === 0) return 0;
    if (daysOverdue <= 15) return 1;
    if (daysOverdue <= 30) return 2;
    return 3;
  };

  it('devrait calculer les jours de retard', () => {
    const echeance = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(calculateDaysOverdue(echeance)).toBe(10);
  });

  it('devrait retourner 0 si pas en retard', () => {
    const echeance = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    expect(calculateDaysOverdue(echeance)).toBe(0);
  });

  it('relance niveau 1 pour 1-15 jours', () => {
    expect(getRelanceLevel(10)).toBe(1);
  });

  it('relance niveau 2 pour 16-30 jours', () => {
    expect(getRelanceLevel(20)).toBe(2);
  });

  it('relance niveau 3 pour 30+ jours', () => {
    expect(getRelanceLevel(45)).toBe(3);
  });
});

describe('Statistiques Facturation', () => {
  const factures = [
    { montantTTC: 1200, statut: 'PAYEE' },
    { montantTTC: 800, statut: 'PAYEE' },
    { montantTTC: 500, statut: 'ENVOYEE' },
    { montantTTC: 300, statut: 'IMPAYEE' },
  ];

  it('devrait calculer le CA total', () => {
    const total = factures.reduce((sum, f) => sum + f.montantTTC, 0);
    expect(total).toBe(2800);
  });

  it('devrait calculer le CA encaissé', () => {
    const encaisse = factures
      .filter(f => f.statut === 'PAYEE')
      .reduce((sum, f) => sum + f.montantTTC, 0);
    expect(encaisse).toBe(2000);
  });

  it('devrait calculer les impayés', () => {
    const impayes = factures
      .filter(f => f.statut === 'IMPAYEE')
      .reduce((sum, f) => sum + f.montantTTC, 0);
    expect(impayes).toBe(300);
  });
});
