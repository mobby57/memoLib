import { StrictMode, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: mocks.auth,
  SignInButton: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ token: 'invitation-token' }),
  useRouter: () => ({ push: mocks.push }),
}));

import InvitationPage from '@/app/[locale]/invitation/[token]/page';

describe('page d’invitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propose la connexion si le client est déconnecté', () => {
    mocks.auth.mockReturnValue({ isLoaded: true, userId: null });
    render(<InvitationPage />);
    expect(screen.getByRole('button', { name: /se connecter ou créer un compte/i })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('ne soumet l’invitation qu’une fois en mode strict', async () => {
    mocks.auth.mockReturnValue({ isLoaded: true, userId: 'client-id' });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invitation invalide' }),
    } as Response);
    render(<StrictMode><InvitationPage /></StrictMode>);
    await waitFor(() => expect(screen.getByText('Invitation invalide')).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
