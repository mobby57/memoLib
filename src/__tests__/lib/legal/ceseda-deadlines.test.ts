/**
 * Moteur CESEDA unifié — jours ouvrés / jours fériés (P1).
 *
 * Importe le code de production réel (src/lib/legal/ceseda-deadlines.ts), qui est
 * désormais la source unique câblée à la chaîne Email -> Dossier.
 *
 * Couvre le GAP CESEDA-JOURS-FERIES : aucun délai ne doit tomber un week-end ni
 * un jour férié français.
 */
import { describe, expect, it } from 'vitest';
import { getCesedaDeadlines } from '@/lib/legal/ceseda-deadlines';
import { isWorkingDay, isFrenchHoliday } from '@/lib/legal/workingDays';

describe('[P1] getCesedaDeadlines — report jours ouvrés / fériés', () => {
  it('ne renvoie rien pour un type inconnu', () => {
    expect(getCesedaDeadlines('INCONNU', new Date('2026-01-05'))).toEqual([]);
  });

  it('génère les délais OQTF attendus', () => {
    const deadlines = getCesedaDeadlines('OQTF', new Date('2026-01-05')); // lundi
    expect(deadlines).toHaveLength(2);
    expect(deadlines.every((d) => typeof d.dueDate.getTime() === 'number')).toBe(true);
  });

  it('AUCUN délai ne tombe un week-end ou un jour férié, tous types confondus', () => {
    const types = [
      'OQTF',
      'OQTF_SANS_DELAI',
      'IRTF',
      'Asile',
      'Asile_accelere',
      'TitreSejour',
      'Naturalisation',
      'AppelDecision',
      'RegroupementFamilial',
      'Refere_suspension',
      'Refere_liberte',
      'Retention',
    ];
    // Balaye 60 dates de départ consécutives pour couvrir tous les jours de semaine
    // et des chevauchements de jours fériés.
    for (let offset = 0; offset < 60; offset++) {
      const from = new Date('2026-01-01T09:00:00Z');
      from.setDate(from.getDate() + offset);
      for (const type of types) {
        for (const dl of getCesedaDeadlines(type, from)) {
          expect(isWorkingDay(dl.dueDate), `${type} @${from.toISOString()} -> ${dl.dueDate.toISOString()}`).toBe(true);
          expect(isFrenchHoliday(dl.dueDate)).toBe(false);
        }
      }
    }
  });

  it('reporte un délai calendaire tombant un samedi au jour ouvré suivant', () => {
    // 2026-01-01 (jeudi, mais férié Nouvel An) — on part d'un vendredi ouvré.
    // vendredi 2026-01-02 + 1 jour calendaire = samedi 2026-01-03 -> doit être reporté.
    const from = new Date('2026-01-02T09:00:00Z'); // vendredi
    // Retention -> "Appel ordonnance JLD (24h)" = +1 jour calendaire
    const retention = getCesedaDeadlines('Retention', from);
    const appel = retention.find((d) => d.label.includes('Appel ordonnance JLD'));
    expect(appel).toBeDefined();
    // +1 jour = samedi 03/01 -> reporté au lundi 05/01 (jour ouvré)
    expect(isWorkingDay(appel!.dueDate)).toBe(true);
    expect(appel!.dueDate.getDay()).not.toBe(6); // pas samedi
    expect(appel!.dueDate.getDay()).not.toBe(0); // pas dimanche
  });

  it('émet uniquement des types valides de l’enum DeadlineType', () => {
    const VALID = new Set([
      'RECOURS_GRACIEUX',
      'RECOURS_HIERARCHIQUE',
      'RECOURS_CONTENTIEUX',
      'APPEL',
      'CASSATION',
      'REPONSE_PREFECTURE',
      'CONVOCATION_AUDIENCE',
      'PRODUCTION_PIECES',
      'EXECUTION_DECISION',
      'OQTF',
      'RETENTION',
      'CUSTOM',
    ]);
    const all = ['OQTF', 'OQTF_SANS_DELAI', 'Asile', 'TitreSejour', 'Retention'].flatMap(
      (t) => getCesedaDeadlines(t, new Date('2026-03-02'))
    );
    for (const dl of all) {
      expect(VALID.has(dl.type)).toBe(true);
    }
  });
});
