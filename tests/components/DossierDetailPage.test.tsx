import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react', async importOriginal => importOriginal());
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'dossier-id' }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/components/dossiers/InviteClientModal', () => ({
  InviteClientModal: ({ dossierId }: { dossierId: string }) => <p>Invitation pour {dossierId}</p>,
}));

import DossierDetailPage from '@/app/[locale]/dossiers/[id]/page';

describe('fiche avocat', () => {
  it('affiche les documents transmis et ouvre l’invitation du dossier', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ dossier: {
        id: 'dossier-id', typeDossier: 'Test', objet: null, statut: 'en_cours',
        numero: 'TEST-1', createdAt: '2026-01-01', clientNom: null, clientPrenom: null, recitClient: null,
        documents: [{ id: 'doc-id', originalName: 'Formulaire.json', category: 'client-intake', antivirusStatus: 'PENDING' }],
      } }),
    } as Response);
    render(<DossierDetailPage />);
    expect(await screen.findByRole('link', { name: 'Formulaire.json' })).toHaveAttribute('href', '/api/documents/download/doc-id');
    expect(screen.getByText(/informations client à vérifier/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Inviter le client' }));
    expect(screen.getByText('Invitation pour dossier-id')).toBeInTheDocument();
  });
});
