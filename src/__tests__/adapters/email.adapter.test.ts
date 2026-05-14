import { describe, it, expect } from '@jest/globals';
import { extractDraft } from '../../lib/adapters/email.adapter';

describe('EmailAdapter.extractDraft', () => {
  it('détecte un email OQTF sans délai avec haute confiance', () => {
    const draft = extractDraft({
      from: 'Fatima Benali <fatima.benali@gmail.com>',
      subject: 'URGENT - OQTF sans délai reçue',
      body: 'Bonjour, j\'ai reçu une OQTF sans délai 48h. Notifiée le 10/07/2026. Merci de m\'aider.',
    });

    expect(draft.caseType).toBe('OQTF');
    expect(draft.caseSubType).toBe('sans_delai');
    expect(draft.urgency).toBe('critical');
    expect(draft.clientName).toBe('Fatima Benali');
    expect(draft.clientEmail).toBe('fatima.benali@gmail.com');
    expect(draft.confidence.caseType).toBeGreaterThanOrEqual(0.7);
    expect(draft.confidence.clientEmail).toBeGreaterThanOrEqual(0.8);
    expect(draft.notificationDate).toBe('2026-07-10');
    expect(draft.rawContent).toContain('OQTF sans délai');
  });

  it('détecte un email OQTF avec délai (30 jours)', () => {
    const draft = extractDraft({
      from: 'ahmed.k@outlook.com',
      subject: 'Obligation de quitter le territoire',
      body: 'J\'ai reçu une obligation de quitter le territoire français avec un délai de 30 jours.',
    });

    expect(draft.caseType).toBe('OQTF');
    expect(draft.urgency).toBe('high');
    expect(draft.clientEmail).toBe('ahmed.k@outlook.com');
  });

  it('détecte une demande de naturalisation', () => {
    const draft = extractDraft({
      from: 'Marie Dupont <marie.dupont@free.fr>',
      subject: 'Demande de naturalisation française',
      body: 'Je souhaite entamer une procédure de naturalisation. Je réside en France depuis 6 ans.',
    });

    expect(draft.caseType).toBe('NATURALISATION');
    expect(draft.urgency).toBe('low');
    expect(draft.clientName).toBe('Marie Dupont');
    expect(draft.confidence.caseType).toBeGreaterThan(0);
  });

  it('détecte une demande d\'asile CNDA', () => {
    const draft = extractDraft({
      from: 'avocat@cabinet.fr',
      subject: 'Recours CNDA - Client M. Diallo',
      body: 'Suite au rejet OFPRA, nous devons saisir la CNDA dans les 30 jours. Notification reçue le 05/07/2026.',
    });

    expect(draft.caseType).toBe('ASILE');
    expect(draft.caseSubType).toBe('CNDA');
    expect(draft.urgency).toBe('high');
    expect(draft.notificationDate).toBe('2026-07-05');
  });

  it('gère un email sans type détectable', () => {
    const draft = extractDraft({
      from: 'inconnu@test.com',
      subject: 'Question générale',
      body: 'Bonjour, j\'ai une question sur mes droits.',
    });

    expect(draft.caseType).toBeUndefined();
    expect(draft.urgency).toBe('medium');
    expect(draft.confidence.caseType).toBe(0);
    expect(draft.clientEmail).toBe('inconnu@test.com');
    expect(draft.rawContent).toBeTruthy();
  });

  it('gère un email avec corps vide', () => {
    const draft = extractDraft({
      from: 'test@test.com',
      subject: 'OQTF',
      body: '',
    });

    expect(draft.caseType).toBe('OQTF');
    expect(draft.rawContent).toContain('OQTF');
    expect(draft.summary).toBeTruthy();
  });

  it('extrait un numéro de téléphone français', () => {
    const draft = extractDraft({
      from: 'client@mail.com',
      subject: 'Titre de séjour',
      body: 'Vous pouvez me joindre au 06 12 34 56 78. Merci.',
    });

    expect(draft.clientPhone).toBe('0612345678');
    expect(draft.confidence.clientPhone).toBeGreaterThan(0);
  });

  it('extrait le nom depuis le header From', () => {
    const draft = extractDraft({
      from: 'Jean-Pierre Martin <jp.martin@gmail.com>',
      subject: 'Demande',
      body: 'Test',
    });

    expect(draft.clientName).toBe('Jean-Pierre Martin');
    expect(draft.confidence.clientName).toBeGreaterThanOrEqual(0.7);
  });

  it('devine le nom depuis l\'email quand pas de display name', () => {
    const draft = extractDraft({
      from: 'sophie.lambert@yahoo.fr',
      subject: 'Aide',
      body: 'Test',
    });

    expect(draft.clientName).toBe('Sophie Lambert');
    expect(draft.confidence.clientName).toBeLessThan(0.7);
  });

  it('détecte un recours au tribunal administratif', () => {
    const draft = extractDraft({
      from: 'client@mail.com',
      subject: 'Recours contentieux tribunal administratif',
      body: 'Je souhaite déposer un recours devant le tribunal administratif.',
    });

    expect(draft.caseType).toBe('RECOURS');
    expect(draft.urgency).toBe('high');
  });
});
