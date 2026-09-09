import { describe, it, expect } from 'vitest';
import { computeCompleteness } from '@/lib/services/intake.service';
import { getTemplateForIntakeType, INTAKE_TEMPLATES } from '@/lib/intake/templates';

/**
 * Tests de la logique pure d'intake (complétude + templates), sans DB ni
 * chiffrement.
 */

describe('computeCompleteness', () => {
  const fields = [
    { id: 'a', label: 'A', type: 'text', required: true },
    { id: 'b', label: 'B', type: 'text', required: true },
    { id: 'c', label: 'C', type: 'text', required: false },
  ];

  it('100% si aucun champ ni document requis', () => {
    expect(computeCompleteness([], {}, [], [])).toBe(100);
  });

  it('0% quand rien n’est fourni', () => {
    expect(computeCompleteness(fields, {}, ['doc1'], [])).toBe(0);
  });

  it('ignore les champs non requis', () => {
    // 2 champs requis (a,b), 0 doc. Seul a fourni → 50%.
    expect(computeCompleteness(fields, { a: 'x' }, [], [])).toBe(50);
  });

  it('compte champs requis + documents', () => {
    // a,b requis + doc1 requis = 3. a + doc1 fournis = 2/3 ≈ 67%.
    expect(computeCompleteness(fields, { a: 'x' }, ['doc1'], ['doc1'])).toBe(67);
  });

  it('traite les valeurs vides comme manquantes', () => {
    expect(computeCompleteness(fields, { a: '   ', b: 'ok' }, [], [])).toBe(50);
  });

  it('100% quand tout est fourni', () => {
    expect(computeCompleteness(fields, { a: 'x', b: 'y' }, ['doc1'], ['doc1'])).toBe(100);
  });
});

describe('getTemplateForIntakeType', () => {
  it('résout OQTF / Asile / TitreSejour', () => {
    expect(getTemplateForIntakeType('OQTF').type).toBe('OQTF');
    expect(getTemplateForIntakeType('asile').type).toBe('Asile');
    expect(getTemplateForIntakeType('TitreSejour').type).toBe('TitreSejour');
  });

  it('fallback par mot-clé', () => {
    expect(getTemplateForIntakeType('demande oqtf urgente').type).toBe('OQTF');
    expect(getTemplateForIntakeType('titre de séjour').type).toBe('TitreSejour');
  });

  it('fallback OQTF pour type inconnu', () => {
    expect(getTemplateForIntakeType('inconnu').type).toBe('OQTF');
  });

  it('chaque template a des champs et documents', () => {
    for (const t of Object.values(INTAKE_TEMPLATES)) {
      expect(t.fields.length).toBeGreaterThan(0);
      expect(t.documents.length).toBeGreaterThan(0);
    }
  });
});
