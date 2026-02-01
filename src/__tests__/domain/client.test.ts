/**
 * Tests pour les clients
 * Couverture: CRUD, validation, recherche
 */

describe('Client Domain', () => {
  describe('Client Interface', () => {
    interface Client {
      id: string;
      nom: string;
      prenom: string;
      email?: string;
      telephone?: string;
      adresse?: string;
      nationalite?: string;
      dateNaissance?: Date;
      numeroEtranger?: string;
      createdAt: Date;
      updatedAt: Date;
    }

    it('devrait avoir une structure valide', () => {
      const client: Client = {
        id: 'client-1',
        nom: 'DUPONT',
        prenom: 'Jean',
        email: 'jean@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('nom');
      expect(client).toHaveProperty('prenom');
    });
  });

  describe('Name Formatting', () => {
    const formatFullName = (nom: string, prenom: string): string => {
      return `${nom.toUpperCase()} ${prenom}`;
    };

    it('devrait formater le nom complet', () => {
      expect(formatFullName('dupont', 'Jean')).toBe('DUPONT Jean');
    });

    it('devrait mettre le nom en majuscules', () => {
      const result = formatFullName('martin', 'Marie');
      expect(result.startsWith('MARTIN')).toBe(true);
    });
  });

  describe('Email Validation', () => {
    const isValidEmail = (email: string): boolean => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    it('devrait accepter un email valide', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('devrait rejeter un email sans @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('devrait rejeter un email sans domaine', () => {
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('Phone Validation', () => {
    const formatPhone = (phone: string): string => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
      }
      return phone;
    };

    it('devrait formater un numéro français', () => {
      expect(formatPhone('0612345678')).toBe('06 12 34 56 78');
    });

    it('devrait nettoyer les caractères non numériques', () => {
      expect(formatPhone('06.12.34.56.78')).toBe('06 12 34 56 78');
    });
  });

  describe('Nationality', () => {
    const nationalities = [
      'Française',
      'Algérienne',
      'Marocaine',
      'Tunisienne',
      'Sénégalaise',
      'Malienne',
      'Autre',
    ];

    it('devrait avoir une liste de nationalités', () => {
      expect(nationalities.length).toBeGreaterThan(0);
    });

    it('devrait inclure Française', () => {
      expect(nationalities).toContain('Française');
    });

    it('devrait inclure Autre', () => {
      expect(nationalities).toContain('Autre');
    });
  });

  describe('Client Search', () => {
    const clients = [
      { id: '1', nom: 'DUPONT', prenom: 'Jean', email: 'jean@example.com' },
      { id: '2', nom: 'MARTIN', prenom: 'Marie', email: 'marie@example.com' },
      { id: '3', nom: 'DURAND', prenom: 'Pierre', email: 'pierre@example.com' },
    ];

    const searchClients = (query: string): typeof clients => {
      const q = query.toLowerCase();
      return clients.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.prenom.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    };

    it('devrait trouver par nom', () => {
      const results = searchClients('DUPONT');
      expect(results).toHaveLength(1);
    });

    it('devrait trouver par prénom', () => {
      const results = searchClients('Marie');
      expect(results).toHaveLength(1);
    });

    it('devrait trouver par email', () => {
      const results = searchClients('pierre@');
      expect(results).toHaveLength(1);
    });

    it('devrait être insensible à la casse', () => {
      const results = searchClients('dupont');
      expect(results).toHaveLength(1);
    });
  });

  describe('Client Sorting', () => {
    const clients = [
      { nom: 'MARTIN', prenom: 'Marie' },
      { nom: 'DUPONT', prenom: 'Jean' },
      { nom: 'DURAND', prenom: 'Pierre' },
    ];

    it('devrait trier par nom', () => {
      const sorted = [...clients].sort((a, b) => a.nom.localeCompare(b.nom));
      expect(sorted[0].nom).toBe('DUPONT');
      expect(sorted[1].nom).toBe('DURAND');
      expect(sorted[2].nom).toBe('MARTIN');
    });
  });

  describe('Age Calculation', () => {
    const calculateAge = (birthDate: Date): number => {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    };

    it('devrait calculer l\'âge correctement', () => {
      const birthDate = new Date('1990-01-15');
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(34);
    });

    it('devrait gérer les bébés', () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);
      expect(calculateAge(recentDate)).toBe(0);
    });
  });

  describe('Numéro étranger', () => {
    const formatNumeroEtranger = (numero: string): string => {
      // Format: XXXX XXX XXX
      const cleaned = numero.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
      }
      return numero;
    };

    it('devrait formater le numéro étranger', () => {
      expect(formatNumeroEtranger('1234567890')).toBe('1234 567 890');
    });
  });
});

describe('Client Documents', () => {
  describe('Document Types', () => {
    const documentTypes = [
      'PASSEPORT',
      'CARTE_IDENTITE',
      'TITRE_SEJOUR',
      'ACTE_NAISSANCE',
      'JUSTIFICATIF_DOMICILE',
      'AVIS_IMPOT',
      'AUTRE',
    ];

    it('devrait avoir 7 types de documents', () => {
      expect(documentTypes).toHaveLength(7);
    });

    it('devrait inclure PASSEPORT', () => {
      expect(documentTypes).toContain('PASSEPORT');
    });

    it('devrait inclure TITRE_SEJOUR', () => {
      expect(documentTypes).toContain('TITRE_SEJOUR');
    });
  });

  describe('Document Checklist', () => {
    const requiredDocs = ['PASSEPORT', 'JUSTIFICATIF_DOMICILE', 'ACTE_NAISSANCE'];
    
    const checkMissing = (providedDocs: string[]): string[] => {
      return requiredDocs.filter(doc => !providedDocs.includes(doc));
    };

    it('devrait identifier les documents manquants', () => {
      const provided = ['PASSEPORT'];
      const missing = checkMissing(provided);
      expect(missing).toContain('JUSTIFICATIF_DOMICILE');
      expect(missing).toContain('ACTE_NAISSANCE');
    });

    it('devrait retourner vide si tout fourni', () => {
      const provided = [...requiredDocs];
      expect(checkMissing(provided)).toHaveLength(0);
    });
  });
});
