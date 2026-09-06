/**
 * Statuts de dossier — mappers DB <-> UI (P2, remplace le test FALSE).
 *
 * Le test FALSE définissait une matrice de transitions EN MAJUSCULES à
 * l'intérieur du test, alors que la base stocke les statuts en snake_case
 * (ex: 'en_cours'). Il validait un modèle inexistant.
 *
 * Ce test importe le code de production réel (src/lib/constants/dossier.constants.ts)
 * et vérifie que les mappers bidirectionnels sont cohérents avec les valeurs DB
 * réellement écrites (create-dossier écrit statut:'en_cours').
 */
import { describe, expect, it } from 'vitest';
import {
  STATUTS_DB,
  STATUTS_UI,
  mapStatutToDB,
  mapStatutToUI,
} from '@/lib/constants/dossier.constants';

describe('[P2] Statuts dossier — mappers DB <-> UI (code de prod)', () => {
  it('les valeurs DB sont en snake_case (comme écrit par la route create-dossier)', () => {
    expect(STATUTS_DB.EN_COURS).toBe('en_cours');
    expect(STATUTS_DB.EN_ATTENTE).toBe('en_attente');
    expect(STATUTS_DB.TERMINE).toBe('termine');
    expect(STATUTS_DB.ARCHIVE).toBe('archive');
  });

  it('mapStatutToUI convertit une valeur DB réelle vers l’UI', () => {
    expect(mapStatutToUI('en_cours')).toBe(STATUTS_UI.EN_COURS);
    expect(mapStatutToUI('en_attente')).toBe(STATUTS_UI.EN_ATTENTE);
    expect(mapStatutToUI('termine')).toBe(STATUTS_UI.TERMINE);
  });

  it('mapStatutToDB convertit une valeur UI vers une valeur DB valide', () => {
    const dbValues = new Set(Object.values(STATUTS_DB));
    for (const uiValue of Object.values(STATUTS_UI)) {
      expect(dbValues.has(mapStatutToDB(uiValue) as never)).toBe(true);
    }
  });

  it('round-trip DB -> UI -> DB reste dans le domaine DB valide', () => {
    const dbValues = new Set(Object.values(STATUTS_DB));
    for (const dbValue of Object.values(STATUTS_DB)) {
      const roundTrip = mapStatutToDB(mapStatutToUI(dbValue));
      expect(dbValues.has(roundTrip as never)).toBe(true);
    }
  });

  it('un statut inconnu retombe sur en_cours (valeur DB par défaut, jamais une valeur invalide)', () => {
    expect(mapStatutToDB('N_IMPORTE_QUOI')).toBe('en_cours');
    expect(mapStatutToUI('n_importe_quoi')).toBe(STATUTS_UI.EN_COURS);
  });
});
