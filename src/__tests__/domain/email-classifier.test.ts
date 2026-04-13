import { classifyEmail } from '@/lib/classifiers/email-classifier';
import { extractDraft } from '@/lib/adapters/email.adapter';

describe('Email Classifier', () => {
  describe('Classification par type de dossier', () => {
    it('devrait détecter un OQTF', () => {
      const result = classifyEmail(
        'OQTF reçue ce matin',
        'Mon client a reçu une obligation de quitter le territoire'
      );
      expect(result.caseType).toBe('OQTF');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('devrait détecter une demande d\'asile', () => {
      const result = classifyEmail(
        'Demande asile - nouveau client',
        'Personne réfugiée convoquée à l\'OFPRA pour entretien'
      );
      expect(result.caseType).toBe('Asile');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('devrait détecter un titre de séjour', () => {
      const result = classifyEmail(
        'Renouvellement titre de séjour',
        'Demande de renouvellement de carte de séjour à la préfecture'
      );
      expect(result.caseType).toBe('TitreSejour');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('devrait détecter une naturalisation', () => {
      const result = classifyEmail(
        'Dossier naturalisation',
        'Demande d\'acquisition de la nationalité française par décret'
      );
      expect(result.caseType).toBe('Naturalisation');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('devrait détecter un regroupement familial', () => {
      const result = classifyEmail(
        'Regroupement familial',
        'Demande de réunification avec conjoint via OFII'
      );
      expect(result.caseType).toBe('RegroupementFamilial');
    });

    it('devrait détecter un refoulement', () => {
      const result = classifyEmail(
        'Non-admission frontière',
        'Client maintenu en zone d\'attente suite à refoulement'
      );
      expect(result.caseType).toBe('Refoulement');
    });

    it('devrait détecter une assignation à résidence', () => {
      const result = classifyEmail(
        'Assignation à résidence',
        'Obligation de pointage au commissariat'
      );
      expect(result.caseType).toBe('AssignationResidence');
    });
  });

  describe('Détection d\'urgence', () => {
    it('devrait détecter un email urgent', () => {
      const result = classifyEmail('URGENT - OQTF 48h', 'Expulsion imminente');
      expect(result.urgency).toBe(true);
      expect(result.priority).toBe('critique');
    });

    it('devrait détecter un référé liberté comme urgent', () => {
      const result = classifyEmail(
        'Référé liberté à déposer',
        'Rétention administrative, il faut agir immédiat'
      );
      expect(result.urgency).toBe(true);
    });

    it('devrait marquer non-urgent un email classique', () => {
      const result = classifyEmail(
        'Renouvellement titre de séjour',
        'Bonjour, je souhaite renouveler mon titre'
      );
      expect(result.urgency).toBe(false);
    });
  });

  describe('Score de confiance', () => {
    it('devrait avoir une haute confiance avec plusieurs mots-clés', () => {
      const result = classifyEmail(
        'OQTF sans délai',
        'Obligation de quitter le territoire, éloignement, rétention, expulsion'
      );
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.needsHumanReview).toBe(false);
    });

    it('devrait avoir une basse confiance avec peu de mots-clés', () => {
      const result = classifyEmail('Question', 'J\'ai entendu parler d\'asile');
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.needsHumanReview).toBe(true);
    });

    it('devrait retourner confiance 0 si aucun match', () => {
      const result = classifyEmail('Bonjour', 'Comment allez-vous ?');
      expect(result.confidence).toBe(0);
      expect(result.caseType).toBeUndefined();
      expect(result.needsHumanReview).toBe(true);
    });
  });

  describe('Boost keywords', () => {
    it('devrait augmenter la confiance avec des boost keywords', () => {
      const base = classifyEmail('OQTF', 'obligation de quitter');
      const boosted = classifyEmail('OQTF 48h', 'obligation de quitter, rétention, sans délai');
      expect(boosted.confidence).toBeGreaterThan(base.confidence);
    });
  });

  describe('Normalisation des accents', () => {
    it('devrait matcher avec ou sans accents', () => {
      const r1 = classifyEmail('refugie', 'demande asile');
      const r2 = classifyEmail('réfugié', 'demande asile');
      expect(r1.caseType).toBe(r2.caseType);
    });
  });
});

describe('Email Adapter + Classifier intégration', () => {
  it('devrait enrichir le draft avec la classification', () => {
    const draft = extractDraft({
      from: 'client@example.com',
      subject: 'URGENT - OQTF reçue',
      body: 'J\'ai reçu une obligation de quitter le territoire. Mon tel: 0612345678',
    });

    expect(draft.clientEmail).toBe('client@example.com');
    expect(draft.clientPhone).toBe('0612345678');
    expect(draft.caseType).toBe('OQTF');
    expect(draft.classification.urgency).toBe(true);
    expect(draft.classification.priority).toBe('critique');
    expect(draft.confidence.caseType).toBeGreaterThan(0);
  });

  it('devrait marquer needsHumanReview si email vague', () => {
    const draft = extractDraft({
      from: 'inconnu@mail.com',
      subject: 'Question',
      body: 'Bonjour, j\'ai besoin d\'aide',
    });

    expect(draft.caseType).toBeUndefined();
    expect(draft.classification.needsHumanReview).toBe(true);
  });
});
