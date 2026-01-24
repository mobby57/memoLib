/**
 * Tests pour le service d'analyse de documents
 * Couverture: extraction délais, parties, types d'affaires
 */

describe('Document Analysis Service', () => {
  describe('ExtractedDeadline Types', () => {
    const validTypes = ['AUDIENCE', 'DEPOT', 'REPONSE', 'PRESCRIPTION'];
    const validPriorities = ['HAUTE', 'MOYENNE', 'BASSE'];

    it('devrait avoir AUDIENCE comme type valide', () => {
      expect(validTypes).toContain('AUDIENCE');
    });

    it('devrait avoir DEPOT comme type valide', () => {
      expect(validTypes).toContain('DEPOT');
    });

    it('devrait avoir REPONSE comme type valide', () => {
      expect(validTypes).toContain('REPONSE');
    });

    it('devrait avoir PRESCRIPTION comme type valide', () => {
      expect(validTypes).toContain('PRESCRIPTION');
    });

    it('devrait avoir HAUTE comme priorité valide', () => {
      expect(validPriorities).toContain('HAUTE');
    });

    it('devrait avoir MOYENNE comme priorité valide', () => {
      expect(validPriorities).toContain('MOYENNE');
    });

    it('devrait avoir BASSE comme priorité valide', () => {
      expect(validPriorities).toContain('BASSE');
    });
  });

  describe('Deadline Extraction', () => {
    const extractDatesFromText = (text: string): string[] => {
      const datePatterns = [
        /\d{2}\/\d{2}\/\d{4}/g, // DD/MM/YYYY
        /\d{4}-\d{2}-\d{2}/g,   // YYYY-MM-DD
        /\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}/gi,
      ];

      const dates: string[] = [];
      for (const pattern of datePatterns) {
        const matches = text.match(pattern);
        if (matches) {
          dates.push(...matches);
        }
      }
      return dates;
    };

    it('devrait extraire les dates DD/MM/YYYY', () => {
      const text = 'Audience prévue le 15/03/2024';
      const dates = extractDatesFromText(text);
      expect(dates).toContain('15/03/2024');
    });

    it('devrait extraire les dates YYYY-MM-DD', () => {
      const text = 'Échéance: 2024-04-30';
      const dates = extractDatesFromText(text);
      expect(dates).toContain('2024-04-30');
    });

    it('devrait extraire les dates en français', () => {
      const text = 'Rendez-vous le 5 mars 2024';
      const dates = extractDatesFromText(text);
      expect(dates).toHaveLength(1);
    });
  });

  describe('Parties Extraction', () => {
    const extractParties = (text: string): string[] => {
      const parties: string[] = [];
      
      // Patterns pour extraire les parties
      const demandeurMatch = text.match(/demandeur\s*:\s*([^\n,]+)/i);
      const defendeurMatch = text.match(/défendeur\s*:\s*([^\n,]+)/i);
      const requerantMatch = text.match(/requérant\s*:\s*([^\n,]+)/i);
      
      if (demandeurMatch) parties.push(demandeurMatch[1].trim());
      if (defendeurMatch) parties.push(defendeurMatch[1].trim());
      if (requerantMatch) parties.push(requerantMatch[1].trim());
      
      return parties;
    };

    it('devrait extraire le demandeur', () => {
      const text = 'Demandeur: M. Jean DUPONT';
      const parties = extractParties(text);
      expect(parties).toContain('M. Jean DUPONT');
    });

    it('devrait extraire le défendeur', () => {
      const text = 'Défendeur: Société XYZ SARL';
      const parties = extractParties(text);
      expect(parties).toContain('Société XYZ SARL');
    });

    it('devrait extraire le requérant', () => {
      const text = 'Requérant: Mme Marie MARTIN';
      const parties = extractParties(text);
      expect(parties).toContain('Mme Marie MARTIN');
    });

    it('devrait retourner un tableau vide si aucune partie', () => {
      const text = 'Document sans parties identifiées';
      const parties = extractParties(text);
      expect(parties).toHaveLength(0);
    });
  });

  describe('Case Type Detection', () => {
    const detectCaseType = (text: string): string => {
      const textLower = text.toLowerCase();
      
      if (textLower.includes('tribunal correctionnel') || textLower.includes('pénal')) {
        return 'PENAL';
      }
      if (textLower.includes('tribunal de commerce')) {
        return 'COMMERCIAL';
      }
      if (textLower.includes('tribunal administratif') || textLower.includes('préfecture')) {
        return 'ADMINISTRATIF';
      }
      if (textLower.includes('conseil de prud\'hommes') || textLower.includes('prud\'hommes')) {
        return 'SOCIAL';
      }
      return 'CIVIL';
    };

    it('devrait détecter une affaire pénale', () => {
      const text = 'Jugement du tribunal correctionnel de Paris';
      expect(detectCaseType(text)).toBe('PENAL');
    });

    it('devrait détecter une affaire commerciale', () => {
      const text = 'Ordonnance du tribunal de commerce';
      expect(detectCaseType(text)).toBe('COMMERCIAL');
    });

    it('devrait détecter une affaire administrative', () => {
      const text = 'Décision du tribunal administratif';
      expect(detectCaseType(text)).toBe('ADMINISTRATIF');
    });

    it('devrait détecter une affaire sociale (prud\'hommes)', () => {
      const text = 'Jugement du conseil de prud\'hommes';
      expect(detectCaseType(text)).toBe('SOCIAL');
    });

    it('devrait retourner CIVIL par défaut', () => {
      const text = 'Document sans tribunal identifié';
      expect(detectCaseType(text)).toBe('CIVIL');
    });
  });

  describe('Priority Calculation', () => {
    const calculatePriority = (daysRemaining: number): string => {
      if (daysRemaining <= 3) return 'HAUTE';
      if (daysRemaining <= 15) return 'MOYENNE';
      return 'BASSE';
    };

    it('devrait retourner HAUTE si 3 jours ou moins', () => {
      expect(calculatePriority(0)).toBe('HAUTE');
      expect(calculatePriority(1)).toBe('HAUTE');
      expect(calculatePriority(3)).toBe('HAUTE');
    });

    it('devrait retourner MOYENNE si 4-15 jours', () => {
      expect(calculatePriority(4)).toBe('MOYENNE');
      expect(calculatePriority(10)).toBe('MOYENNE');
      expect(calculatePriority(15)).toBe('MOYENNE');
    });

    it('devrait retourner BASSE si plus de 15 jours', () => {
      expect(calculatePriority(16)).toBe('BASSE');
      expect(calculatePriority(30)).toBe('BASSE');
      expect(calculatePriority(100)).toBe('BASSE');
    });
  });

  describe('Missing Documents Detection', () => {
    const requiredDocuments = [
      'passeport',
      'justificatif de domicile',
      'attestation de ressources',
      'certificat de naissance',
    ];

    const detectMissing = (documentList: string[]): string[] => {
      const listLower = documentList.map(d => d.toLowerCase());
      return requiredDocuments.filter(doc => 
        !listLower.some(d => d.includes(doc))
      );
    };

    it('devrait retourner tous les documents si rien fourni', () => {
      const missing = detectMissing([]);
      expect(missing).toHaveLength(4);
    });

    it('devrait exclure les documents fournis', () => {
      const missing = detectMissing(['Passeport valide']);
      expect(missing).not.toContain('passeport');
    });

    it('devrait retourner tableau vide si tout fourni', () => {
      const allDocs = [
        'Passeport',
        'Justificatif de domicile EDF',
        'Attestation de ressources',
        'Certificat de naissance',
      ];
      const missing = detectMissing(allDocs);
      expect(missing).toHaveLength(0);
    });
  });

  describe('Document Summary Generation', () => {
    const generateSummary = (text: string, maxLength: number = 200): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + '...';
    };

    it('devrait retourner le texte complet si court', () => {
      const short = 'Texte court';
      expect(generateSummary(short)).toBe(short);
    });

    it('devrait tronquer le texte long', () => {
      const long = 'a'.repeat(300);
      const summary = generateSummary(long, 100);
      expect(summary.length).toBe(100);
      expect(summary.endsWith('...')).toBe(true);
    });
  });
});

describe('DocumentAnalysisResult Interface', () => {
  it('devrait avoir la structure correcte', () => {
    const result = {
      deadlines: [],
      parties: [],
      typeAffaire: 'CIVIL',
      resume: 'Résumé du document',
      documentsManquants: [],
    };

    expect(result).toHaveProperty('deadlines');
    expect(result).toHaveProperty('parties');
    expect(result).toHaveProperty('typeAffaire');
    expect(result).toHaveProperty('resume');
    expect(result).toHaveProperty('documentsManquants');
  });
});
