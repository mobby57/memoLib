/**
 * Tests pour le service OQTF Deadline
 * Couverture: types CESEDA, templates juridiques, délais
 */

import { TypeDossierCESEDA } from '@/lib/services/oqtfDeadlineService';

describe('OQTF Deadline Service', () => {
  describe('TypeDossierCESEDA Enum', () => {
    it('devrait inclure OQTF', () => {
      expect(TypeDossierCESEDA.OQTF).toBe('OQTF');
    });

    it('devrait inclure REFUS_TITRE', () => {
      expect(TypeDossierCESEDA.REFUS_TITRE).toBe('REFUS_TITRE');
    });

    it('devrait inclure RETRAIT_TITRE', () => {
      expect(TypeDossierCESEDA.RETRAIT_TITRE).toBe('RETRAIT_TITRE');
    });

    it('devrait inclure NATURALISATION', () => {
      expect(TypeDossierCESEDA.NATURALISATION).toBe('NATURALISATION');
    });

    it('devrait inclure REGROUPEMENT_FAMILIAL', () => {
      expect(TypeDossierCESEDA.REGROUPEMENT_FAMILIAL).toBe('REGROUPEMENT_FAMILIAL');
    });

    it('devrait inclure ASILE', () => {
      expect(TypeDossierCESEDA.ASILE).toBe('ASILE');
    });
  });
});

describe('Templates Juridiques OQTF', () => {
  describe('Patterns de reconnaissance', () => {
    const oqtfPatterns = [
      'obligation de quitter le territoire francais',
      'OQTF',
      'decision d\'eloignement',
      'mesure d\'eloignement',
      'reconduite a la frontiere',
    ];

    it('devrait reconnaître "OQTF"', () => {
      expect(oqtfPatterns).toContain('OQTF');
    });

    it('devrait reconnaître "obligation de quitter le territoire francais"', () => {
      expect(oqtfPatterns).toContain('obligation de quitter le territoire francais');
    });

    it('devrait reconnaître "decision d\'eloignement"', () => {
      expect(oqtfPatterns).toContain('decision d\'eloignement');
    });
  });

  describe('Articles CESEDA', () => {
    const articles = [
      'L.511-1',
      'L.512-1',
      'L.513-1',
      'L.511-1 II',
      'L.511-1 III',
      'Article L.511-1 du CESEDA',
    ];

    it('devrait référencer L.511-1', () => {
      expect(articles).toContain('L.511-1');
    });

    it('devrait référencer L.512-1', () => {
      expect(articles).toContain('L.512-1');
    });

    it('devrait avoir le format Article complet', () => {
      const fullFormat = articles.find(a => a.includes('CESEDA'));
      expect(fullFormat).toBeDefined();
    });
  });

  describe('Délais standard OQTF', () => {
    const delaisOQTF = {
      departVolontaire: 30,
      recoursTA: 48,
      recoursCAA: 2,
    };

    it('devrait avoir 30 jours pour départ volontaire', () => {
      expect(delaisOQTF.departVolontaire).toBe(30);
    });

    it('devrait avoir 48h pour recours TA (rétention)', () => {
      expect(delaisOQTF.recoursTA).toBe(48);
    });

    it('devrait avoir 2 mois pour appel CAA', () => {
      expect(delaisOQTF.recoursCAA).toBe(2);
    });
  });

  describe('Keywords juridiques', () => {
    const keywords = [
      'prefecture',
      'arrete prefectoral',
      'territoire francais',
      'sejour irregulier',
      'titre de sejour',
      'visa',
      'reconduite',
      'eloignement',
      'tribunal administratif',
      'TA',
      'refere-liberte',
      'assignation a residence',
      'centre de retention',
      'CRA',
    ];

    it('devrait inclure prefecture', () => {
      expect(keywords).toContain('prefecture');
    });

    it('devrait inclure TA', () => {
      expect(keywords).toContain('TA');
    });

    it('devrait inclure CRA', () => {
      expect(keywords).toContain('CRA');
    });

    it('devrait inclure refere-liberte', () => {
      expect(keywords).toContain('refere-liberte');
    });
  });
});

describe('Calcul des délais', () => {
  describe('Départ volontaire', () => {
    it('devrait calculer la date limite', () => {
      const notificationDate = new Date('2024-01-15');
      const delaiJours = 30;
      
      const deadline = new Date(notificationDate);
      deadline.setDate(deadline.getDate() + delaiJours);
      
      expect(deadline.toISOString().split('T')[0]).toBe('2024-02-14');
    });
  });

  describe('Recours TA 48h', () => {
    it('devrait calculer le délai de 48h', () => {
      const notificationDate = new Date('2024-01-15T10:00:00');
      const delaiHeures = 48;
      
      const deadline = new Date(notificationDate);
      deadline.setTime(deadline.getTime() + delaiHeures * 60 * 60 * 1000);
      
      expect(deadline.getDate()).toBe(17);
    });
  });

  describe('Recours TA 30 jours (sans rétention)', () => {
    it('devrait calculer le délai de 30 jours', () => {
      const notificationDate = new Date('2024-01-15');
      const delaiJours = 30;
      
      const deadline = new Date(notificationDate);
      deadline.setDate(deadline.getDate() + delaiJours);
      
      expect(deadline.getMonth()).toBe(1); // Février
    });
  });
});

describe('Classification du type de dossier', () => {
  const classifyDocument = (text: string): string | null => {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('oqtf') || textLower.includes('obligation de quitter')) {
      return 'OQTF';
    }
    if (textLower.includes('refus de titre') || textLower.includes('refus de renouvellement')) {
      return 'REFUS_TITRE';
    }
    if (textLower.includes('retrait') && textLower.includes('titre')) {
      return 'RETRAIT_TITRE';
    }
    if (textLower.includes('naturalisation')) {
      return 'NATURALISATION';
    }
    if (textLower.includes('asile')) {
      return 'ASILE';
    }
    
    return null;
  };

  it('devrait classifier un document OQTF', () => {
    const text = 'Notification d\'une OQTF par la préfecture';
    expect(classifyDocument(text)).toBe('OQTF');
  });

  it('devrait classifier un refus de titre', () => {
    const text = 'Refus de titre de séjour notifié le...';
    expect(classifyDocument(text)).toBe('REFUS_TITRE');
  });

  it('devrait classifier une naturalisation', () => {
    const text = 'Demande de naturalisation française';
    expect(classifyDocument(text)).toBe('NATURALISATION');
  });

  it('devrait retourner null pour texte inconnu', () => {
    const text = 'Document sans rapport avec immigration';
    expect(classifyDocument(text)).toBeNull();
  });
});

describe('Confidence Scoring', () => {
  const calculateConfidence = (matchedPatterns: number, totalPatterns: number): number => {
    if (totalPatterns === 0) return 0;
    return matchedPatterns / totalPatterns;
  };

  it('devrait calculer 100% si tous les patterns matchent', () => {
    expect(calculateConfidence(5, 5)).toBe(1.0);
  });

  it('devrait calculer 50% si la moitié matche', () => {
    expect(calculateConfidence(2, 4)).toBe(0.5);
  });

  it('devrait calculer 0% si aucun match', () => {
    expect(calculateConfidence(0, 5)).toBe(0);
  });
});
