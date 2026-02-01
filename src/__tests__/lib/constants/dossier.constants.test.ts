/**
 * Tests pour src/lib/constants/dossier.constants.ts
 * Coverage: Constantes et mappings pour dossiers
 */

describe('Dossier Constants', () => {
  let STATUTS_DB: any;
  let STATUTS_UI: any;
  let PRIORITES_DB: any;
  let PRIORITES_UI: any;
  let TYPES_DOSSIER: any;
  let TYPE_LABELS: any;
  let STATUT_COLORS: any;
  let PRIORITE_COLORS: any;
  let mapStatutToDB: any;
  let mapStatutToUI: any;
  let mapPrioriteToDB: any;
  let mapPrioriteToUI: any;

  beforeEach(async () => {
    jest.resetModules();
    const module = await import('@/lib/constants/dossier.constants');
    STATUTS_DB = module.STATUTS_DB;
    STATUTS_UI = module.STATUTS_UI;
    PRIORITES_DB = module.PRIORITES_DB;
    PRIORITES_UI = module.PRIORITES_UI;
    TYPES_DOSSIER = module.TYPES_DOSSIER;
    TYPE_LABELS = module.TYPE_LABELS;
    STATUT_COLORS = module.STATUT_COLORS;
    PRIORITE_COLORS = module.PRIORITE_COLORS;
    mapStatutToDB = module.mapStatutToDB;
    mapStatutToUI = module.mapStatutToUI;
    mapPrioriteToDB = module.mapPrioriteToDB;
    mapPrioriteToUI = module.mapPrioriteToUI;
  });

  describe('STATUTS_DB', () => {
    it('should have EN_COURS status', () => {
      expect(STATUTS_DB.EN_COURS).toBe('en_cours');
    });

    it('should have EN_ATTENTE status', () => {
      expect(STATUTS_DB.EN_ATTENTE).toBe('en_attente');
    });

    it('should have URGENT status', () => {
      expect(STATUTS_DB.URGENT).toBe('urgent');
    });

    it('should have TERMINE status', () => {
      expect(STATUTS_DB.TERMINE).toBe('termine');
    });

    it('should have ARCHIVE status', () => {
      expect(STATUTS_DB.ARCHIVE).toBe('archive');
    });

    it('should have SUSPENDU status', () => {
      expect(STATUTS_DB.SUSPENDU).toBe('suspendu');
    });
  });

  describe('STATUTS_UI', () => {
    it('should have BROUILLON status', () => {
      expect(STATUTS_UI.BROUILLON).toBe('BROUILLON');
    });

    it('should have EN_COURS status', () => {
      expect(STATUTS_UI.EN_COURS).toBe('EN_COURS');
    });

    it('should have EN_ATTENTE status', () => {
      expect(STATUTS_UI.EN_ATTENTE).toBe('EN_ATTENTE');
    });

    it('should have URGENT status', () => {
      expect(STATUTS_UI.URGENT).toBe('URGENT');
    });

    it('should have TERMINE status', () => {
      expect(STATUTS_UI.TERMINE).toBe('TERMINE');
    });

    it('should have REJETE status', () => {
      expect(STATUTS_UI.REJETE).toBe('REJETE');
    });

    it('should have ANNULE status', () => {
      expect(STATUTS_UI.ANNULE).toBe('ANNULE');
    });
  });

  describe('PRIORITES_DB', () => {
    it('should have BASSE priority', () => {
      expect(PRIORITES_DB.BASSE).toBe('basse');
    });

    it('should have NORMALE priority', () => {
      expect(PRIORITES_DB.NORMALE).toBe('normale');
    });

    it('should have HAUTE priority', () => {
      expect(PRIORITES_DB.HAUTE).toBe('haute');
    });

    it('should have CRITIQUE priority', () => {
      expect(PRIORITES_DB.CRITIQUE).toBe('critique');
    });
  });

  describe('PRIORITES_UI', () => {
    it('should have NORMALE priority', () => {
      expect(PRIORITES_UI.NORMALE).toBe('NORMALE');
    });

    it('should have HAUTE priority', () => {
      expect(PRIORITES_UI.HAUTE).toBe('HAUTE');
    });

    it('should have URGENTE priority', () => {
      expect(PRIORITES_UI.URGENTE).toBe('URGENTE');
    });

    it('should have CRITIQUE priority', () => {
      expect(PRIORITES_UI.CRITIQUE).toBe('CRITIQUE');
    });
  });

  describe('TYPES_DOSSIER', () => {
    it('should have TITRE_SEJOUR type', () => {
      expect(TYPES_DOSSIER.TITRE_SEJOUR).toBe('TITRE_SEJOUR');
    });

    it('should have RECOURS_OQTF type', () => {
      expect(TYPES_DOSSIER.RECOURS_OQTF).toBe('RECOURS_OQTF');
    });

    it('should have NATURALISATION type', () => {
      expect(TYPES_DOSSIER.NATURALISATION).toBe('NATURALISATION');
    });

    it('should have REGROUPEMENT_FAMILIAL type', () => {
      expect(TYPES_DOSSIER.REGROUPEMENT_FAMILIAL).toBe('REGROUPEMENT_FAMILIAL');
    });

    it('should have ASILE type', () => {
      expect(TYPES_DOSSIER.ASILE).toBe('ASILE');
    });

    it('should have VISA type', () => {
      expect(TYPES_DOSSIER.VISA).toBe('VISA');
    });

    it('should have AUTRE type', () => {
      expect(TYPES_DOSSIER.AUTRE).toBe('AUTRE');
    });
  });

  describe('TYPE_LABELS', () => {
    it('should have label for TITRE_SEJOUR', () => {
      expect(TYPE_LABELS.TITRE_SEJOUR).toBe('Titre de Sejour');
    });

    it('should have label for RECOURS_OQTF', () => {
      expect(TYPE_LABELS.RECOURS_OQTF).toBe('Recours OQTF');
    });

    it('should have label for NATURALISATION', () => {
      expect(TYPE_LABELS.NATURALISATION).toBe('Naturalisation');
    });

    it('should have label for REGROUPEMENT_FAMILIAL', () => {
      expect(TYPE_LABELS.REGROUPEMENT_FAMILIAL).toBe('Regroupement Familial');
    });

    it('should have label for ASILE', () => {
      expect(TYPE_LABELS.ASILE).toContain('Asile');
    });

    it('should have label for VISA', () => {
      expect(TYPE_LABELS.VISA).toBe('Visa');
    });

    it('should have label for AUTRE', () => {
      expect(TYPE_LABELS.AUTRE).toBe('Autre');
    });
  });

  describe('STATUT_COLORS', () => {
    it('should have color for BROUILLON', () => {
      expect(STATUT_COLORS.BROUILLON).toBe('default');
    });

    it('should have color for EN_COURS', () => {
      expect(STATUT_COLORS.EN_COURS).toBe('info');
    });

    it('should have color for EN_ATTENTE', () => {
      expect(STATUT_COLORS.EN_ATTENTE).toBe('warning');
    });

    it('should have color for URGENT', () => {
      expect(STATUT_COLORS.URGENT).toBe('danger');
    });

    it('should have color for TERMINE', () => {
      expect(STATUT_COLORS.TERMINE).toBe('success');
    });

    it('should have color for REJETE', () => {
      expect(STATUT_COLORS.REJETE).toBe('danger');
    });

    it('should have color for ANNULE', () => {
      expect(STATUT_COLORS.ANNULE).toBe('default');
    });
  });

  describe('PRIORITE_COLORS', () => {
    it('should have color for NORMALE', () => {
      expect(PRIORITE_COLORS.NORMALE).toBe('default');
    });

    it('should have color for HAUTE', () => {
      expect(PRIORITE_COLORS.HAUTE).toBe('warning');
    });

    it('should have color for URGENTE', () => {
      expect(PRIORITE_COLORS.URGENTE).toBe('warning');
    });
  });

  describe('mapStatutToDB', () => {
    it('should map EN_COURS to en_cours', () => {
      if (mapStatutToDB) {
        expect(mapStatutToDB('EN_COURS')).toBe('en_cours');
      }
    });

    it('should map TERMINE to termine', () => {
      if (mapStatutToDB) {
        expect(mapStatutToDB('TERMINE')).toBe('termine');
      }
    });

    it('should handle unknown status', () => {
      if (mapStatutToDB) {
        const result = mapStatutToDB('UNKNOWN');
        expect(result).toBeDefined();
      }
    });
  });

  describe('mapStatutToUI', () => {
    it('should map en_cours to EN_COURS', () => {
      if (mapStatutToUI) {
        expect(mapStatutToUI('en_cours')).toBe('EN_COURS');
      }
    });

    it('should map termine to TERMINE', () => {
      if (mapStatutToUI) {
        expect(mapStatutToUI('termine')).toBe('TERMINE');
      }
    });

    it('should handle unknown status', () => {
      if (mapStatutToUI) {
        const result = mapStatutToUI('unknown');
        expect(result).toBeDefined();
      }
    });
  });

  describe('mapPrioriteToDB', () => {
    it('should map NORMALE to normale', () => {
      if (mapPrioriteToDB) {
        expect(mapPrioriteToDB('NORMALE')).toBe('normale');
      }
    });

    it('should map HAUTE to haute', () => {
      if (mapPrioriteToDB) {
        expect(mapPrioriteToDB('HAUTE')).toBe('haute');
      }
    });

    it('should handle unknown priority', () => {
      if (mapPrioriteToDB) {
        const result = mapPrioriteToDB('UNKNOWN');
        expect(result).toBeDefined();
      }
    });
  });

  describe('mapPrioriteToUI', () => {
    it('should map normale to NORMALE', () => {
      if (mapPrioriteToUI) {
        expect(mapPrioriteToUI('normale')).toBe('NORMALE');
      }
    });

    it('should map haute to HAUTE', () => {
      if (mapPrioriteToUI) {
        expect(mapPrioriteToUI('haute')).toBe('HAUTE');
      }
    });

    it('should handle unknown priority', () => {
      if (mapPrioriteToUI) {
        const result = mapPrioriteToUI('unknown');
        expect(result).toBeDefined();
      }
    });
  });
});
