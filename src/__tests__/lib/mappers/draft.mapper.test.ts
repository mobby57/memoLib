import { describe, expect, it } from 'vitest';
import { mapValidatedDraftToDossier } from '@/lib/mappers/draft.mapper';

describe('mapValidatedDraftToDossier', () => {
  it('ne transforme pas une date de notification ou une date extraite en échéance', () => {
    const dossier = mapValidatedDraftToDossier(
      {
        rawContent: '',
        confidence: {},
        deadline: '2026-12-01',
      },
      {
        clientName: 'Client Exemple',
        clientEmail: 'client@example.invalid',
        caseType: 'OQTF',
        notificationDate: '2026-11-01',
      },
      'client-id',
    );

    expect(dossier).not.toHaveProperty('dateEcheance');
    expect(dossier).toMatchObject({
      clientId: 'client-id',
      typeDossier: 'OQTF',
    });
  });
});
