import { describe, it, expect } from 'vitest';
import { generateContextualChecklist, computeProgress } from '@/lib/dossier/contextual-checklist';

describe('Checklist contextuelle', () => {
  it('génère une base commune pour tout dossier', () => {
    const items = generateContextualChecklist({ typeDossier: 'GENERAL' });
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.find(i => i.label.includes('Passeport'))).toBeDefined();
    expect(items.find(i => i.label.includes('domicile'))).toBeDefined();
  });

  it('OQTF: inclut la décision et preuve notification', () => {
    const items = generateContextualChecklist({ typeDossier: 'OQTF' });
    expect(items.find(i => i.label.includes('décision OQTF'))).toBeDefined();
    expect(items.find(i => i.label.includes('notification'))).toBeDefined();
  });

  it('OQTF en rétention: ajoute PV de placement', () => {
    const items = generateContextualChecklist({ typeDossier: 'OQTF', isInRetention: true });
    expect(items.find(i => i.label.includes('placement en rétention'))).toBeDefined();
  });

  it('ASILE: inclut récit de vie et formulaire OFPRA', () => {
    const items = generateContextualChecklist({ typeDossier: 'ASILE' });
    expect(items.find(i => i.label.includes('Récit de vie'))).toBeDefined();
    expect(items.find(i => i.label.includes('OFPRA'))).toBeDefined();
  });

  it('étranger malade: inclut rapport OFII', () => {
    const items = generateContextualChecklist({ typeDossier: 'TITRE_SEJOUR', hasMedicalIssue: true, specificNeeds: ['etranger_malade'] });
    expect(items.find(i => i.label.includes('OFII'))).toBeDefined();
  });

  it('avec enfants: ajoute certificats scolarité', () => {
    const items = generateContextualChecklist({ typeDossier: 'OQTF', hasChildren: true, childrenCount: 3 });
    expect(items.find(i => i.label.includes('scolarité'))).toBeDefined();
    expect(items.find(i => i.label.includes('x3'))).toBeDefined();
  });

  it('avec conjoint: ajoute acte de mariage', () => {
    const items = generateContextualChecklist({ typeDossier: 'OQTF', hasSpouse: true });
    expect(items.find(i => i.label.includes('mariage'))).toBeDefined();
  });

  it('10+ ans: ajoute preuves résidence pour admission exceptionnelle', () => {
    const items = generateContextualChecklist({ typeDossier: 'TITRE_SEJOUR', yearsInFrance: 11 });
    expect(items.find(i => i.label.includes('10 ans'))).toBeDefined();
  });

  it('naturalisation: inclut CERFA, B1, casier', () => {
    const items = generateContextualChecklist({ typeDossier: 'NATURALISATION' });
    expect(items.find(i => i.label.includes('CERFA'))).toBeDefined();
    expect(items.find(i => i.label.includes('B1'))).toBeDefined();
    expect(items.find(i => i.label.includes('Casier'))).toBeDefined();
  });

  it('ne duplique pas les items', () => {
    const items = generateContextualChecklist({ typeDossier: 'OQTF', hasChildren: true, hasSpouse: true, hasMedicalIssue: true, isEmployed: true, yearsInFrance: 10 });
    const labels = items.map(i => i.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('computeProgress calcule correctement', () => {
    const items = [
      { label: 'A', status: 'received', required: true },
      { label: 'B', status: 'validated', required: true },
      { label: 'C', status: 'missing', required: true },
      { label: 'D', status: 'missing', required: false },
    ];
    const p = computeProgress(items);
    expect(p.total).toBe(4);
    expect(p.received).toBe(2);
    expect(p.validated).toBe(1);
    expect(p.percentage).toBe(50);
    expect(p.isComplete).toBe(false);
    expect(p.missingRequired).toEqual(['C']);
  });

  it('computeProgress: complet si toutes les pièces required sont reçues', () => {
    const items = [
      { label: 'A', status: 'received', required: true },
      { label: 'B', status: 'validated', required: true },
      { label: 'C', status: 'missing', required: false },
    ];
    const p = computeProgress(items);
    expect(p.isComplete).toBe(true);
    expect(p.nextAction).toContain('complet');
  });
});
