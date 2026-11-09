import { describe, it, expect } from 'vitest';
import { analyzeDossier, type DossierInput } from '../../src/lib/ai/copilot/copilot-ceseda';

const baseDossier: DossierInput = {
  id: 'test-1',
  typeDossier: 'OQTF',
  description: 'Client Mohammed Benali, OQTF reçue le 01/06/2026, présent en France depuis 8 ans, 2 enfants scolarisés, employé en CDI.',
  notes: 'Conjoint française, paie ses impôts depuis 5 ans.',
  statut: 'en_cours',
  dateCreation: '2026-06-01T00:00:00Z',
  client: { firstName: 'Mohammed', lastName: 'Benali', email: 'benali@test.com' },
  checklistItems: [
    { label: 'Copie OQTF', status: 'received', required: true },
    { label: 'Passeport', status: 'missing', required: true },
    { label: 'Justificatif domicile', status: 'received', required: true },
    { label: 'Certificats scolarité', status: 'received', required: true },
    { label: 'Avis imposition', status: 'missing', required: true },
    { label: 'Contrat travail', status: 'received', required: false },
  ],
  legalDeadlines: [
    { label: 'Recours TA', dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), status: 'PENDING' },
  ],
  emails: [
    { subject: 'OQTF urgente', body: 'J\'ai reçu une OQTF, j\'ai 2 enfants scolarisés et je suis en CDI depuis 3 ans.', from: 'benali@test.com', receivedDate: '2026-06-01T10:00:00Z' },
  ],
  documents: [{ name: 'OQTF.pdf', type: 'juridique' }],
};

describe('Copilote CESEDA', () => {
  it('produit une analyse complète', () => {
    const result = analyzeDossier(baseDossier);
    expect(result.dossierId).toBe('test-1');
    expect(result.disclaimer).toContain('Validation humaine');
    expect(result.summary).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.weaknesses).toBeDefined();
    expect(result.completeness).toBeDefined();
    expect(result.cesedaAnalysis).toBeDefined();
    expect(result.deadlines).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('détecte les forces du dossier OQTF', () => {
    const result = analyzeDossier(baseDossier);
    const labels = result.strengths.map(s => s.label);
    expect(labels.some(l => l.includes('Enfants'))).toBe(true);
    expect(labels.some(l => l.includes('professionnelle'))).toBe(true);
  });

  it('détecte les faiblesses (pièces manquantes)', () => {
    const result = analyzeDossier(baseDossier);
    expect(result.weaknesses.some(w => w.label.includes('manquante'))).toBe(true);
  });

  it('calcule la complétude', () => {
    const result = analyzeDossier(baseDossier);
    expect(result.completeness.score).toBe(67); // 4/6
    expect(result.completeness.missing).toContain('Passeport');
    expect(result.completeness.missing).toContain('Avis imposition');
  });

  it('identifie les articles CESEDA pour OQTF', () => {
    const result = analyzeDossier(baseDossier);
    expect(result.cesedaAnalysis.procedure).toBe('OQTF');
    expect(result.cesedaAnalysis.articles.length).toBeGreaterThan(0);
    expect(result.cesedaAnalysis.articles.some(a => a.reference.includes('L611'))).toBe(true);
  });

  it('identifie les voies de recours', () => {
    const result = analyzeDossier(baseDossier);
    expect(result.cesedaAnalysis.recours.length).toBeGreaterThan(0);
    expect(result.cesedaAnalysis.recours.some(r => r.type.includes('contentieux'))).toBe(true);
  });

  it('détecte les deadlines critiques', () => {
    const result = analyzeDossier(baseDossier);
    expect(result.deadlines.length).toBeGreaterThan(0);
    expect(result.deadlines[0].riskLevel).toBe('élevé'); // 5 jours
  });

  it('génère des actions recommandées', () => {
    const result = analyzeDossier(baseDossier);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions[0].type).toBe('urgent'); // deadline < 7j
  });

  it('détecte les blocages', () => {
    const result = analyzeDossier(baseDossier);
    expect(result.blockages.some(b => b.cause.includes('manquant'))).toBe(true);
  });

  it('résumé contient les éléments de situation', () => {
    const result = analyzeDossier(baseDossier);
    expect(result.summary.situation).toContain('OQTF détectée');
    expect(result.summary.situation.some(s => s.includes('Enfant'))).toBe(true);
    expect(['élevé', 'critique']).toContain(result.summary.riskLevel); // deadline < 7j
  });

  it('gère un dossier vide gracieusement', () => {
    const empty: DossierInput = {
      id: 'empty',
      typeDossier: 'GENERAL',
      statut: 'nouveau',
      dateCreation: new Date().toISOString(),
      client: {},
      checklistItems: [],
      legalDeadlines: [],
      emails: [],
      documents: [],
    };
    const result = analyzeDossier(empty);
    expect(result.confidence).toBeLessThan(0.7);
    expect(result.completeness.score).toBe(0); // 0 items = 0/1 = 0%
  });

  it('dossier asile détecte les bons articles', () => {
    const asile: DossierInput = { ...baseDossier, id: 'asile-1', typeDossier: 'ASILE', description: 'Demande d\'asile Afghanistan' };
    const result = analyzeDossier(asile);
    expect(result.cesedaAnalysis.procedure).toBe('ASILE');
    expect(result.cesedaAnalysis.articles.some(a => a.reference.includes('L511') || a.reference.includes('L512'))).toBe(true);
  });
});
