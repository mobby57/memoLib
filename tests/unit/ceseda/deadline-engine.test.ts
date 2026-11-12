import { describe, it, expect } from 'vitest';
import { computeDeadlines, getUrgentDeadlines, applyDuration } from '../../../src/lib/ceseda/engine/deadline-engine';
import { matchProcedures, guessProcedure } from '../../../src/lib/ceseda/engine/procedure-matcher';
import { oqtf48hPack } from '../../../src/lib/ceseda/packs/eloignement/oqtf-48h.pack';
import { vpfPack } from '../../../src/lib/ceseda/packs/titres-sejour/vpf.pack';

describe('CESEDA - applyDuration', () => {
  it('ajoute 48h à une date', () => {
    const base = new Date('2026-01-01T00:00:00Z');
    const result = applyDuration(base, { days: 2 });
    expect(result.toISOString()).toBe('2026-01-03T00:00:00.000Z');
  });

  it('soustrait 2 mois', () => {
    const base = new Date('2026-03-01T00:00:00Z');
    const result = applyDuration(base, { months: -2 });
    expect(result.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('CESEDA - computeDeadlines OQTF', () => {
  it('calcule les 3 échéances OQTF', () => {
    const dates = {
      dateNotification: new Date('2026-01-01T00:00:00Z'),
      dateAudience: new Date('2026-01-03T00:00:00Z'),
    };
    const deadlines = computeDeadlines(oqtf48hPack, dates, new Date('2026-01-01T00:00:00Z'));

    expect(deadlines.length).toBe(3);
    const recours = deadlines.find((d) => d.id === 'recours-ta');
    expect(recours).toBeDefined();
    expect(recours!.dueDate.toISOString()).toBe('2026-01-03T00:00:00.000Z');
    expect(recours!.criticality).toBe('critical');
  });

  it('détecte les échéances urgentes', () => {
    const dates = { dateNotification: new Date('2026-01-01T00:00:00Z') };
    const deadlines = computeDeadlines(oqtf48hPack, dates, new Date('2026-01-02T00:00:00Z'));
    const urgent = getUrgentDeadlines(deadlines);
    expect(urgent.length).toBeGreaterThan(0);
  });
});

describe('CESEDA - computeDeadlines VPF', () => {
  it('calcule instruction + renouvellement', () => {
    const dates = {
      dateDepot: new Date('2026-01-01T00:00:00Z'),
      dateExpiration: new Date('2027-01-01T00:00:00Z'),
    };
    const deadlines = computeDeadlines(vpfPack, dates, new Date('2026-01-01T00:00:00Z'));
    expect(deadlines.length).toBeGreaterThanOrEqual(2);
    const renouv = deadlines.find((d) => d.id === 'renouvellement');
    expect(renouv).toBeDefined();
  });
});

describe('CESEDA - procedure matcher', () => {
  it('détecte une OQTF', () => {
    const result = guessProcedure('Vous avez reçu une OQTF avec un délai de 48h');
    expect(result?.id).toBe('eloignement.oqtf-48h');
  });

  it('détecte un titre salarié', () => {
    const result = guessProcedure('Demande de titre de séjour salarié avec contrat CDI');
    expect(result?.id).toBe('titres-sejour.salarie');
  });

  it('détecte un VPF', () => {
    const result = guessProcedure('Demande de vie privée et familiale, conjoint de Français');
    expect(result?.id).toBe('titres-sejour.vpf');
  });

  it('retourne null si rien', () => {
    const result = guessProcedure('Bonjour, comment allez-vous ?');
    expect(result).toBeNull();
  });
});