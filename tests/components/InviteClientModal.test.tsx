import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InviteClientModal } from '@/components/dossiers/InviteClientModal';

vi.mock('lucide-react', async importOriginal => importOriginal());

describe('invitation client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signale explicitement que l’email n’a pas été envoyé si le transport est absent', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ inviteLink: 'http://localhost:3010/invitation/test', emailStatus: 'not_sent' }),
    } as Response);
    render(<InviteClientModal dossierId="dossier-id" onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('client@email.com'), {
      target: { value: 'client@example.invalid' },
    });
    fireEvent.click(screen.getByRole('button', { name: /créer l’invitation et tenter l’envoi/i }));
    expect(await screen.findByText('Email non envoyé')).toBeInTheDocument();
    expect(screen.queryByText(/email accepté par le service/i)).not.toBeInTheDocument();
  });
});
