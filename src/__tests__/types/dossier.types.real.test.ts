/**
 * Tests pour types/dossier.types.ts - Types et utilitaires dossiers
 * Tests des constantes et fonctions pures
 */

import {
  STATUTS_DOSSIER,
  PRIORITES,
  PHASES_DOSSIER,
  TYPES_DOSSIER_CESEDA,
  JURIDICTIONS,
  TYPES_RECOURS,
  INSTANCES,
  MODES_FACTURATION,
  NIVEAUX_CONFIDENTIALITE,
  CANAUX_CONTACT,
  FREQUENCES_RELANCE,
  TYPES_TACHE,
  STATUTS_TACHE,
  TYPES_EVENEMENT,
  IMPORTANCES_EVENEMENT,
  CATEGORIES_EVENEMENT,
  TYPES_COMMENTAIRE,
  isDossierEnRetard,
  joursAvantEcheance,
  couleurPriorite,
  couleurStatut,
  genererNumeroDossier,
  formatNomClient,
  calculerProgression,
  determinerUrgence,
} from '@/types/dossier.types';

describe('dossier.types - Types et utilitaires dossiers', () => {
  
  // ============================================
  // STATUTS_DOSSIER
  // ============================================
  describe('STATUTS_DOSSIER', () => {
    test('contient nouveau', () => {
      expect(STATUTS_DOSSIER).toContain('nouveau');
    });

    test('contient en_cours', () => {
      expect(STATUTS_DOSSIER).toContain('en_cours');
    });

    test('contient urgent', () => {
      expect(STATUTS_DOSSIER).toContain('urgent');
    });

    test('contient termine', () => {
      expect(STATUTS_DOSSIER).toContain('termine');
    });

    test('contient archive', () => {
      expect(STATUTS_DOSSIER).toContain('archive');
    });

    test('a 7 statuts', () => {
      expect(STATUTS_DOSSIER.length).toBe(7);
    });
  });

  // ============================================
  // PRIORITES
  // ============================================
  describe('PRIORITES', () => {
    test('contient basse', () => {
      expect(PRIORITES).toContain('basse');
    });

    test('contient normale', () => {
      expect(PRIORITES).toContain('normale');
    });

    test('contient haute', () => {
      expect(PRIORITES).toContain('haute');
    });

    test('contient critique', () => {
      expect(PRIORITES).toContain('critique');
    });

    test('a 4 priorités', () => {
      expect(PRIORITES.length).toBe(4);
    });
  });

  // ============================================
  // PHASES_DOSSIER
  // ============================================
  describe('PHASES_DOSSIER', () => {
    test('contient instruction', () => {
      expect(PHASES_DOSSIER).toContain('instruction');
    });

    test('contient recours', () => {
      expect(PHASES_DOSSIER).toContain('recours');
    });

    test('contient audience', () => {
      expect(PHASES_DOSSIER).toContain('audience');
    });

    test('contient decision', () => {
      expect(PHASES_DOSSIER).toContain('decision');
    });

    test('contient execution', () => {
      expect(PHASES_DOSSIER).toContain('execution');
    });

    test('a 5 phases', () => {
      expect(PHASES_DOSSIER.length).toBe(5);
    });
  });

  // ============================================
  // TYPES_DOSSIER_CESEDA
  // ============================================
  describe('TYPES_DOSSIER_CESEDA', () => {
    test('contient OQTF', () => {
      expect(TYPES_DOSSIER_CESEDA).toContain('OQTF');
    });

    test('contient Naturalisation', () => {
      expect(TYPES_DOSSIER_CESEDA).toContain('Naturalisation');
    });

    test('contient Asile', () => {
      expect(TYPES_DOSSIER_CESEDA).toContain('Asile');
    });

    test('contient TitreSejour', () => {
      expect(TYPES_DOSSIER_CESEDA).toContain('TitreSejour');
    });

    test('contient RegroupementFamilial', () => {
      expect(TYPES_DOSSIER_CESEDA).toContain('RegroupementFamilial');
    });

    test('a au moins 8 types', () => {
      expect(TYPES_DOSSIER_CESEDA.length).toBeGreaterThanOrEqual(8);
    });
  });

  // ============================================
  // JURIDICTIONS
  // ============================================
  describe('JURIDICTIONS', () => {
    test('contient Prefecture', () => {
      expect(JURIDICTIONS).toContain('Prefecture');
    });

    test('contient Tribunal administratif', () => {
      expect(JURIDICTIONS).toContain('Tribunal administratif');
    });

    test('contient CNDA', () => {
      expect(JURIDICTIONS).toContain('CNDA');
    });

    test('a au moins 7 juridictions', () => {
      expect(JURIDICTIONS.length).toBeGreaterThanOrEqual(7);
    });
  });

  // ============================================
  // TYPES_RECOURS
  // ============================================
  describe('TYPES_RECOURS', () => {
    test('contient Gracieux', () => {
      expect(TYPES_RECOURS).toContain('Gracieux');
    });

    test('contient Contentieux', () => {
      expect(TYPES_RECOURS).toContain('Contentieux');
    });

    test('contient Refere liberte', () => {
      expect(TYPES_RECOURS).toContain('Refere liberte');
    });

    test('a au moins 5 types', () => {
      expect(TYPES_RECOURS.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ============================================
  // INSTANCES
  // ============================================
  describe('INSTANCES', () => {
    test('contient Premiere instance', () => {
      expect(INSTANCES).toContain('Premiere instance');
    });

    test('contient Appel', () => {
      expect(INSTANCES).toContain('Appel');
    });

    test('contient Cassation', () => {
      expect(INSTANCES).toContain('Cassation');
    });

    test('a 3 instances', () => {
      expect(INSTANCES.length).toBe(3);
    });
  });

  // ============================================
  // MODES_FACTURATION
  // ============================================
  describe('MODES_FACTURATION', () => {
    test('contient forfait', () => {
      expect(MODES_FACTURATION).toContain('forfait');
    });

    test('contient horaire', () => {
      expect(MODES_FACTURATION).toContain('horaire');
    });

    test('contient resultat', () => {
      expect(MODES_FACTURATION).toContain('resultat');
    });

    test('contient mixte', () => {
      expect(MODES_FACTURATION).toContain('mixte');
    });
  });

  // ============================================
  // AUTRES CONSTANTES
  // ============================================
  describe('Autres constantes', () => {
    test('NIVEAUX_CONFIDENTIALITE a 4 niveaux', () => {
      expect(NIVEAUX_CONFIDENTIALITE.length).toBe(4);
      expect(NIVEAUX_CONFIDENTIALITE).toContain('normal');
      expect(NIVEAUX_CONFIDENTIALITE).toContain('confidentiel');
    });

    test('CANAUX_CONTACT contient email et telephone', () => {
      expect(CANAUX_CONTACT).toContain('email');
      expect(CANAUX_CONTACT).toContain('telephone');
    });

    test('FREQUENCES_RELANCE contient hebdomadaire', () => {
      expect(FREQUENCES_RELANCE).toContain('hebdomadaire');
    });

    test('TYPES_TACHE a 4 types', () => {
      expect(TYPES_TACHE.length).toBe(4);
      expect(TYPES_TACHE).toContain('juridique');
    });

    test('STATUTS_TACHE a 5 statuts', () => {
      expect(STATUTS_TACHE.length).toBe(5);
      expect(STATUTS_TACHE).toContain('a_faire');
    });

    test('TYPES_EVENEMENT contient audience', () => {
      expect(TYPES_EVENEMENT).toContain('audience');
    });

    test('IMPORTANCES_EVENEMENT contient critique', () => {
      expect(IMPORTANCES_EVENEMENT).toContain('critique');
    });

    test('CATEGORIES_EVENEMENT contient procedure', () => {
      expect(CATEGORIES_EVENEMENT).toContain('procedure');
    });

    test('TYPES_COMMENTAIRE contient note', () => {
      expect(TYPES_COMMENTAIRE).toContain('note');
    });
  });

  // ============================================
  // isDossierEnRetard
  // ============================================
  describe('isDossierEnRetard', () => {
    test('retourne false si pas de dateEcheance', () => {
      const dossier = { statut: 'en_cours' } as any;
      expect(isDossierEnRetard(dossier)).toBe(false);
    });

    test('retourne true si échéance passée et non terminé', () => {
      const dossier = {
        dateEcheance: new Date('2020-01-01'),
        statut: 'en_cours'
      } as any;
      expect(isDossierEnRetard(dossier)).toBe(true);
    });

    test('retourne false si terminé même si échéance passée', () => {
      const dossier = {
        dateEcheance: new Date('2020-01-01'),
        statut: 'termine'
      } as any;
      expect(isDossierEnRetard(dossier)).toBe(false);
    });

    test('retourne false si archivé même si échéance passée', () => {
      const dossier = {
        dateEcheance: new Date('2020-01-01'),
        statut: 'archive'
      } as any;
      expect(isDossierEnRetard(dossier)).toBe(false);
    });

    test('retourne false si échéance future', () => {
      const dossier = {
        dateEcheance: new Date('2030-01-01'),
        statut: 'en_cours'
      } as any;
      expect(isDossierEnRetard(dossier)).toBe(false);
    });
  });

  // ============================================
  // joursAvantEcheance
  // ============================================
  describe('joursAvantEcheance', () => {
    test('retourne null si pas de dateEcheance', () => {
      const dossier = {} as any;
      expect(joursAvantEcheance(dossier)).toBeNull();
    });

    test('retourne un nombre négatif pour date passée', () => {
      const dossier = {
        dateEcheance: new Date('2020-01-01')
      } as any;
      const jours = joursAvantEcheance(dossier);
      expect(jours).not.toBeNull();
      expect(jours!).toBeLessThan(0);
    });

    test('retourne un nombre positif pour date future', () => {
      const dossier = {
        dateEcheance: new Date('2030-01-01')
      } as any;
      const jours = joursAvantEcheance(dossier);
      expect(jours).not.toBeNull();
      expect(jours!).toBeGreaterThan(0);
    });
  });

  // ============================================
  // couleurPriorite
  // ============================================
  describe('couleurPriorite', () => {
    test('retourne rouge pour critique', () => {
      expect(couleurPriorite('critique')).toBe('#DC2626');
    });

    test('retourne ambre pour haute', () => {
      expect(couleurPriorite('haute')).toBe('#F59E0B');
    });

    test('retourne bleu pour normale', () => {
      expect(couleurPriorite('normale')).toBe('#3B82F6');
    });

    test('retourne vert pour basse', () => {
      expect(couleurPriorite('basse')).toBe('#10B981');
    });

    test('toutes les couleurs sont des hex valides', () => {
      PRIORITES.forEach(priorite => {
        const couleur = couleurPriorite(priorite);
        expect(couleur).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  // ============================================
  // couleurStatut
  // ============================================
  describe('couleurStatut', () => {
    test('retourne une couleur pour nouveau', () => {
      expect(couleurStatut('nouveau')).toBe('#8B5CF6');
    });

    test('retourne rouge pour urgent', () => {
      expect(couleurStatut('urgent')).toBe('#DC2626');
    });

    test('retourne vert pour termine', () => {
      expect(couleurStatut('termine')).toBe('#10B981');
    });

    test('toutes les couleurs sont des hex valides', () => {
      STATUTS_DOSSIER.forEach(statut => {
        const couleur = couleurStatut(statut);
        expect(couleur).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  // ============================================
  // genererNumeroDossier
  // ============================================
  describe('genererNumeroDossier', () => {
    test('génère un numéro avec année courante par défaut', () => {
      const numero = genererNumeroDossier();
      const annee = new Date().getFullYear();
      expect(numero).toContain(`D-${annee}-`);
    });

    test('génère un numéro avec année spécifiée', () => {
      const numero = genererNumeroDossier(2025);
      expect(numero).toContain('D-2025-');
    });

    test('génère un numéro avec séquence spécifiée', () => {
      const numero = genererNumeroDossier(2026, 42);
      expect(numero).toBe('D-2026-0042');
    });

    test('pad la séquence sur 4 chiffres', () => {
      const numero = genererNumeroDossier(2026, 1);
      expect(numero).toBe('D-2026-0001');
    });

    test('gère les grandes séquences', () => {
      const numero = genererNumeroDossier(2026, 9999);
      expect(numero).toBe('D-2026-9999');
    });
  });

  // ============================================
  // formatNomClient
  // ============================================
  describe('formatNomClient', () => {
    test('formate prénom et nom', () => {
      const client = { firstName: 'Jean', lastName: 'Dupont' };
      expect(formatNomClient(client)).toBe('Jean DUPONT');
    });

    test('inclut la civilité si présente', () => {
      const client = { firstName: 'Marie', lastName: 'Martin', civilite: 'Mme' };
      expect(formatNomClient(client)).toBe('Mme Marie MARTIN');
    });

    test('met le nom en majuscules', () => {
      const client = { firstName: 'Pierre', lastName: 'durand' };
      expect(formatNomClient(client)).toContain('DURAND');
    });
  });

  // ============================================
  // calculerProgression
  // ============================================
  describe('calculerProgression', () => {
    test('retourne 0 si aucune tâche', () => {
      const stats = { nombreTaches: 0, tachesTerminees: 0 } as any;
      expect(calculerProgression(stats)).toBe(0);
    });

    test('retourne 100 si toutes les tâches sont terminées', () => {
      const stats = { nombreTaches: 5, tachesTerminees: 5 } as any;
      expect(calculerProgression(stats)).toBe(100);
    });

    test('retourne 50 pour moitié terminée', () => {
      const stats = { nombreTaches: 10, tachesTerminees: 5 } as any;
      expect(calculerProgression(stats)).toBe(50);
    });

    test('arrondit correctement', () => {
      const stats = { nombreTaches: 3, tachesTerminees: 1 } as any;
      expect(calculerProgression(stats)).toBe(33); // 33.33... -> 33
    });
  });

  // ============================================
  // determinerUrgence
  // ============================================
  describe('determinerUrgence', () => {
    test('retourne normale si pas d\'échéance', () => {
      const dossier = {} as any;
      expect(determinerUrgence(dossier)).toBe('normale');
    });

    test('retourne critique si échéance dépassée', () => {
      const dossier = { dateEcheance: new Date('2020-01-01') } as any;
      expect(determinerUrgence(dossier)).toBe('critique');
    });

    test('retourne basse si échéance lointaine', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60); // +60 jours
      const dossier = { dateEcheance: futureDate } as any;
      expect(determinerUrgence(dossier)).toBe('basse');
    });
  });
});
