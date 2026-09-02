import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'fr' }),
}));

import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

const incompleteSteps = {
  accountCreated: true,
  firstClient: false,
  firstEmail: false,
  firstDossier: false,
};

describe('OnboardingFlow', () => {
  it('oriente vers les écrans structurés sans demander de données libres', () => {
    render(
      <OnboardingFlow
        steps={incompleteSteps}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        userName="Camille"
      />
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(
      screen.getByRole('link', { name: /ouvrir créer une fiche client structurée/i })
    ).toHaveAttribute('href', '/fr/clients');
    expect(
      screen.getByRole('link', { name: /ouvrir traiter un email dans la boîte de réception/i })
    ).toHaveAttribute('href', '/fr/emails');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('présente un statut final prudent après les étapes', () => {
    render(
      <OnboardingFlow
        steps={{ accountCreated: true, firstClient: true, firstEmail: true, firstDossier: true }}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Parcours initial terminé' })).toBeInTheDocument();
    expect(screen.getByText(/vérifiez les informations et les échéances/i)).toBeInTheDocument();
  });
});
