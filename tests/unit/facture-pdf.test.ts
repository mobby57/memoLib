import { describe, it, expect } from 'vitest';
import { generateFacturePDF } from '../../src/lib/services/facture-pdf.service';

describe('Facture PDF Generation', () => {
  const sampleData = {
    numero: 'FAC-2026-0001',
    dateEmission: '2026-07-11',
    dateEcheance: '2026-08-11',
    client: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      address: '12 Rue de la Paix, 75001 Paris',
    },
    cabinet: {
      name: 'Cabinet MemoLib',
      address: '45 Avenue des Champs, 75008 Paris',
      siret: '12345678901234',
    },
    lignes: [
      { description: 'Consultation juridique initiale', quantite: 1, prixUnitaire: 200, montantHT: 200 },
      { description: 'Rédaction recours OQTF', quantite: 1, prixUnitaire: 800, montantHT: 800 },
      { description: 'Frais de dossier', quantite: 1, prixUnitaire: 50, montantHT: 50 },
    ],
    montantHT: 1050,
    tauxTVA: 20,
    montantTVA: 210,
    montantTTC: 1260,
    notes: 'Paiement sous 30 jours',
    conditions: 'Tout retard de paiement entrainera des penalites de retard.',
  };

  it('génère un buffer PDF valide', () => {
    const buffer = generateFacturePDF(sampleData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
  });

  it('le PDF commence par le magic byte %PDF', () => {
    const buffer = generateFacturePDF(sampleData);
    const header = buffer.toString('ascii', 0, 5);
    expect(header).toBe('%PDF-');
  });

  it('génère un PDF même avec des données minimales', () => {
    const minimal = {
      numero: 'FAC-001',
      dateEmission: '2026-01-01',
      dateEcheance: '2026-02-01',
      client: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      cabinet: { name: 'Test' },
      lignes: [{ description: 'Service', quantite: 1, prixUnitaire: 100, montantHT: 100 }],
      montantHT: 100,
      tauxTVA: 20,
      montantTVA: 20,
      montantTTC: 120,
    };
    const buffer = generateFacturePDF(minimal);
    expect(buffer.length).toBeGreaterThan(100);
  });

  it('gère beaucoup de lignes sans crash', () => {
    const manyLines = {
      ...sampleData,
      lignes: Array.from({ length: 50 }, (_, i) => ({
        description: `Prestation juridique #${i + 1}`,
        quantite: 1,
        prixUnitaire: 100,
        montantHT: 100,
      })),
      montantHT: 5000,
      montantTVA: 1000,
      montantTTC: 6000,
    };
    const buffer = generateFacturePDF(manyLines);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('gère les caractères spéciaux dans la description', () => {
    const special = {
      ...sampleData,
      lignes: [{ description: 'Consultation — droit des étrangers (CESEDA)', quantite: 1, prixUnitaire: 300, montantHT: 300 }],
    };
    const buffer = generateFacturePDF(special);
    expect(buffer.length).toBeGreaterThan(100);
  });
});
