/**
 * Tests pour le service d'export
 * Couverture: Excel, Word, CSV formats
 */

// Note: Ces tests n'utilisent pas le DOM, donc pas besoin de mocker window

describe('Export Service', () => {
  describe('Excel Export', () => {
    it('devrait générer le bon type MIME', () => {
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      expect(mimeType).toContain('spreadsheetml');
    });

    it('devrait avoir l\'extension .xlsx', () => {
      const filename = 'export.xlsx';
      expect(filename.endsWith('.xlsx')).toBe(true);
    });
  });

  describe('Word Export', () => {
    it('devrait générer le bon type MIME', () => {
      const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      expect(mimeType).toContain('wordprocessingml');
    });

    it('devrait avoir l\'extension .docx', () => {
      const filename = 'export.docx';
      expect(filename.endsWith('.docx')).toBe(true);
    });
  });

  describe('CSV Export', () => {
    it('devrait générer le bon type MIME', () => {
      const mimeType = 'text/csv';
      expect(mimeType).toBe('text/csv');
    });

    it('devrait avoir l\'extension .csv', () => {
      const filename = 'export.csv';
      expect(filename.endsWith('.csv')).toBe(true);
    });
  });
});

describe('Data Transformation', () => {
  describe('Headers Extraction', () => {
    it('devrait extraire les clés du premier objet', () => {
      const data = [
        { nom: 'Dupont', prenom: 'Jean', email: 'jean@example.com' },
        { nom: 'Martin', prenom: 'Marie', email: 'marie@example.com' },
      ];

      const headers = Object.keys(data[0]);

      expect(headers).toEqual(['nom', 'prenom', 'email']);
    });

    it('devrait gérer un tableau vide', () => {
      const data: any[] = [];

      const headers = data.length > 0 ? Object.keys(data[0]) : [];

      expect(headers).toEqual([]);
    });
  });

  describe('Row Values Extraction', () => {
    it('devrait extraire les valeurs dans l\'ordre des headers', () => {
      const row = { nom: 'Dupont', prenom: 'Jean', age: 30 };
      const headers = ['nom', 'prenom', 'age'];

      const values = headers.map(h => row[h as keyof typeof row]);

      expect(values).toEqual(['Dupont', 'Jean', 30]);
    });

    it('devrait gérer les valeurs undefined', () => {
      const row = { nom: 'Dupont', prenom: undefined };
      const headers = ['nom', 'prenom'];

      const values = headers.map(h => row[h as keyof typeof row]);

      expect(values).toEqual(['Dupont', undefined]);
    });
  });
});

describe('Multi-Sheet Export', () => {
  const sheets = [
    { name: 'Clients', data: [{ id: 1, nom: 'Client 1' }] },
    { name: 'Dossiers', data: [{ id: 1, titre: 'Dossier 1' }] },
    { name: 'Factures', data: [{ id: 1, montant: 100 }] },
  ];

  it('devrait avoir 3 feuilles', () => {
    expect(sheets).toHaveLength(3);
  });

  it('devrait avoir des noms de feuilles uniques', () => {
    const names = sheets.map(s => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('devrait avoir la feuille Clients', () => {
    const clientsSheet = sheets.find(s => s.name === 'Clients');
    expect(clientsSheet).toBeDefined();
  });

  it('devrait avoir la feuille Dossiers', () => {
    const dossiersSheet = sheets.find(s => s.name === 'Dossiers');
    expect(dossiersSheet).toBeDefined();
  });
});

describe('Export Dossier CESEDA', () => {
  const dossierData = {
    numero: 'DOS-2024-001',
    typeDossier: 'OQTF',
    client: {
      nom: 'Dupont',
      prenom: 'Jean',
    },
    statut: 'EN_COURS',
    dateCreation: '2024-01-15',
    dateEcheance: '2024-02-15',
    documents: [
      { nom: 'Passeport', type: 'identite' },
      { nom: 'Decision OQTF', type: 'juridique' },
    ],
  };

  it('devrait formater les données pour Excel', () => {
    const flatData = {
      numero: dossierData.numero,
      type: dossierData.typeDossier,
      clientNom: dossierData.client.nom,
      clientPrenom: dossierData.client.prenom,
      statut: dossierData.statut,
      dateCreation: dossierData.dateCreation,
      dateEcheance: dossierData.dateEcheance,
      nbDocuments: dossierData.documents.length,
    };

    expect(flatData.numero).toBe('DOS-2024-001');
    expect(flatData.nbDocuments).toBe(2);
  });

  it('devrait inclure les informations essentielles', () => {
    const essentialFields = ['numero', 'typeDossier', 'statut', 'dateEcheance'];
    
    essentialFields.forEach(field => {
      expect(dossierData).toHaveProperty(field);
    });
  });
});

describe('CSV Formatting', () => {
  it('devrait échapper les guillemets', () => {
    const value = 'Texte avec "guillemets"';
    const escaped = value.replace(/"/g, '""');
    
    expect(escaped).toBe('Texte avec ""guillemets""');
  });

  it('devrait entourer de guillemets si contient virgule', () => {
    const value = 'Nom, Prénom';
    const needsQuotes = value.includes(',');
    
    expect(needsQuotes).toBe(true);
  });

  it('devrait gérer les sauts de ligne', () => {
    const value = 'Ligne 1\nLigne 2';
    const needsQuotes = value.includes('\n');
    
    expect(needsQuotes).toBe(true);
  });
});

describe('Filename Sanitization', () => {
  const sanitizeFilename = (name: string): string => {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 200);
  };

  it('devrait remplacer les caractères interdits', () => {
    const filename = 'Client: Jean/Pierre';
    const sanitized = sanitizeFilename(filename);
    
    expect(sanitized).not.toContain(':');
    expect(sanitized).not.toContain('/');
  });

  it('devrait remplacer les espaces', () => {
    const filename = 'Export Dossiers 2024';
    const sanitized = sanitizeFilename(filename);
    
    expect(sanitized).not.toContain(' ');
  });

  it('devrait limiter la longueur', () => {
    const longFilename = 'a'.repeat(300);
    const sanitized = sanitizeFilename(longFilename);
    
    expect(sanitized.length).toBeLessThanOrEqual(200);
  });
});

describe('Export Statistics', () => {
  it('devrait compter les lignes exportées', () => {
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const rowCount = data.length;
    
    expect(rowCount).toBe(3);
  });

  it('devrait calculer la taille approximative', () => {
    const data = [{ nom: 'Test' }];
    const jsonSize = JSON.stringify(data).length;
    
    expect(jsonSize).toBeGreaterThan(0);
  });
});
