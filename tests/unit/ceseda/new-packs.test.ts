import { describe, it, expect } from 'vitest';
import { computeDeadlines } from '../../../src/lib/ceseda/engine/deadline-engine';
import { guessProcedure } from '../../../src/lib/ceseda/engine/procedure-matcher';
import { ALL_PACKS } from '../../../src/lib/ceseda/pack-registry';
import { cndaPack } from '../../../src/lib/ceseda/packs/asile/cnda.pack';
import { irtfPack } from '../../../src/lib/ceseda/packs/eloignement/irtf.pack';
import { regroupementFamilialPack } from '../../../src/lib/ceseda/packs/regroupement-familial/ofii.pack';

describe('CESEDA - Nouveaux packs', () => {
  it('a bien 6 packs dans le registry', () => {
    expect(ALL_PACKS.length).toBe(6);
  });

  it('CNDA : recours 21 jours après notification', () => {
    const dates = { dateNotification: new Date('2026-01-01T00:00:00Z') };
    const deadlines = computeDeadlines(cndaPack, dates, new Date('2026-01-01T00:00:00Z'));
    const recours = deadlines.find((d) => d.id === 'recours-cnda');
    expect(recours).toBeDefined();
    expect(recours!.daysRemaining).toBe(21);
    expect(recours!.court).toBe('CNDA');
  });

  it('IRTF : recours 2 mois après notification', () => {
    const dates = { dateNotification: new Date('2026-01-01T00:00:00Z') };
    const deadlines = computeDeadlines(irtfPack, dates, new Date('2026-01-01T00:00:00Z'));
    const recours = deadlines.find((d) => d.id === 'recours-irtf');
    expect(recours).toBeDefined();
    expect(recours!.dueDate.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('Regroupement : instruction 6 mois', () => {
    const dates = { dateDepot: new Date('2026-01-01T00:00:00Z') };
    const deadlines = computeDeadlines(regroupementFamilialPack, dates, new Date('2026-01-01T00:00:00Z'));
    const instruction = deadlines.find((d) => d.id === 'instruction-ofii');
    expect(instruction).toBeDefined();
    expect(instruction!.dueDate.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('matcher détecte CNDA', () => {
    const result = guessProcedure('Recours devant la CNDA suite à un refus OFPRA');
    expect(result?.id).toBe('asile.cnda');
  });

  it('matcher détecte IRTF', () => {
    const result = guessProcedure('Décision IRTF de 3 ans prononcée');
    expect(result?.id).toBe('eloignement.irtf');
  });

  it('matcher détecte regroupement familial', () => {
    const result = guessProcedure('Demande de regroupement familial auprès de l\'OFII');
    expect(result?.id).toBe('regroupement-familial.ofii');
  });
});