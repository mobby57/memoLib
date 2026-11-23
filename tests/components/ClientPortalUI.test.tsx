import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientPortalUI from '@/app/[locale]/espace-client/[dossierId]/ClientPortalUI';

vi.mock('lucide-react', async importOriginal => importOriginal());

describe('formulaire du portail client', () => {
  beforeEach(() => vi.clearAllMocks());

  it('enregistre les réponses pour vérification sans appeler l’ancien endpoint', async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);
    render(<ClientPortalUI dossier={{ id: 'dossier-id', typeDossier: 'Test', objet: null }} documents={[]} />);
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Client' } });
    fireEvent.change(screen.getByLabelText('Adresse complète'), { target: { value: 'Adresse fictive' } });
    fireEvent.change(screen.getByLabelText('Récit de votre situation'), { target: { value: 'Récit fictif' } });
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre à mon avocat' }));
    await waitFor(() => expect(screen.getByText(/en attente de vérification/i)).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith('/api/client/intake', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        dossierId: 'dossier-id',
        originalLang: 'fr',
        answers: { nom: 'Test', prenom: 'Client', adresse: 'Adresse fictive', recit: 'Récit fictif' },
      }),
    }));
  });
});
