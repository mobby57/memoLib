import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailToDossierButton } from '@/components/emails/EmailToDossierButton';

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

const defaultProps = {
  emailId: 'email-456',
  summary: {
    client: 'M. Dupont',
    objet: 'Renouvellement titre de séjour',
    urgence: 'haute' as const,
    actionRequise: 'Préparer le dossier de renouvellement',
    deadlineDetectee: '20/09/2026',
    typeDossier: 'TITRE_SEJOUR',
    resumeCourt: 'Demande de renouvellement de titre de séjour.',
  },
};

describe('EmailToDossierButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('État initial', () => {
    it('affiche le bouton "Créer dossier"', () => {
      render(<EmailToDossierButton {...defaultProps} />);
      expect(screen.getByText(/créer dossier/i)).toBeInTheDocument();
    });

    it('le bouton est activé', () => {
      render(<EmailToDossierButton {...defaultProps} />);
      expect(screen.getByText(/créer dossier/i).closest('button')).not.toBeDisabled();
    });
  });

  describe('Création réussie', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          dossierId: 'dossier-789',
          numero: 'D-2026-042',
          clientName: 'M. Dupont',
        }),
      });
    });

    it('appelle POST /api/emails/create-dossier avec les bonnes données', async () => {
      render(<EmailToDossierButton {...defaultProps} />);
      fireEvent.click(screen.getByText(/créer dossier/i));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/emails/create-dossier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailId: 'email-456',
            summary: defaultProps.summary,
          }),
        });
      });
    });

    it('affiche "Dossier D-2026-042 créé" après succès', async () => {
      render(<EmailToDossierButton {...defaultProps} />);
      fireEvent.click(screen.getByText(/créer dossier/i));

      await waitFor(() => {
        expect(screen.getByText(/dossier d-2026-042 créé/i)).toBeInTheDocument();
      });
    });

    it('affiche un lien vers le dossier créé', async () => {
      render(<EmailToDossierButton {...defaultProps} />);
      fireEvent.click(screen.getByText(/créer dossier/i));

      await waitFor(() => {
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/dossiers/dossier-789');
      });
    });

    it('le bouton n\'est plus cliquable après succès', async () => {
      render(<EmailToDossierButton {...defaultProps} />);
      fireEvent.click(screen.getByText(/créer dossier/i));

      await waitFor(() => {
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
      });
    });
  });

  describe('État loading', () => {
    it('le bouton est désactivé pendant la création', async () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
      render(<EmailToDossierButton {...defaultProps} />);
      fireEvent.click(screen.getByText(/créer dossier/i));

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Erreur de création', () => {
    it('revient à l\'état initial si l\'API retourne success=false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: 'Duplicate' }),
      });

      render(<EmailToDossierButton {...defaultProps} />);
      fireEvent.click(screen.getByText(/créer dossier/i));

      await waitFor(() => {
        expect(screen.getByText(/créer dossier/i)).toBeInTheDocument();
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });

    it('revient à l\'état initial si le fetch échoue', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<EmailToDossierButton {...defaultProps} />);
      fireEvent.click(screen.getByText(/créer dossier/i));

      await waitFor(() => {
        expect(screen.getByText(/créer dossier/i)).toBeInTheDocument();
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });
  });
});
