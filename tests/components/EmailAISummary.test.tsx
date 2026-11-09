import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailAISummary } from '@/components/emails/EmailAISummary';

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

const defaultProps = {
  emailId: 'email-123',
  subject: 'Notification OQTF urgente',
  body: 'Mon client a reçu une OQTF. Le délai de recours est de 48h.',
  from: 'avocat@cabinet.fr',
  onCreateDossier: vi.fn(),
};

const mockSummary = {
  client: 'M. Diallo',
  objet: 'OQTF notifiée, recours urgent',
  urgence: 'critique' as const,
  actionRequise: 'Déposer recours sous 48h',
  deadlineDetectee: '15/08/2026',
  typeDossier: 'OQTF',
  resumeCourt: 'Client notifié OQTF. Recours obligatoire sous 48h.',
  _fallback: false,
};

describe('EmailAISummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('État initial', () => {
    it('affiche le bouton "Analyser avec l\'IA"', () => {
      render(<EmailAISummary {...defaultProps} />);
      expect(screen.getByText(/analyser avec l.ia/i)).toBeInTheDocument();
    });

    it('ne montre PAS le résumé avant analyse', () => {
      render(<EmailAISummary {...defaultProps} />);
      expect(screen.queryByText(/CRITIQUE/)).not.toBeInTheDocument();
    });
  });

  describe('État loading', () => {
    it('affiche "Analyse en cours..." pendant le fetch', async () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
      render(<EmailAISummary {...defaultProps} />);

      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      expect(screen.getByText(/analyse en cours/i)).toBeInTheDocument();
    });
  });

  describe('Résultat IA', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSummary,
      });
    });

    it('affiche le badge d\'urgence après analyse', async () => {
      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        expect(screen.getByText('CRITIQUE')).toBeInTheDocument();
      });
    });

    it('affiche le type de dossier', async () => {
      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        expect(screen.getByText('OQTF')).toBeInTheDocument();
      });
    });

    it('affiche le client détecté', async () => {
      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        expect(screen.getByText('M. Diallo')).toBeInTheDocument();
      });
    });

    it('affiche la deadline détectée', async () => {
      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        expect(screen.getByText('15/08/2026')).toBeInTheDocument();
      });
    });

    it('affiche le bouton "Créer dossier"', async () => {
      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        expect(screen.getByText(/créer dossier/i)).toBeInTheDocument();
      });
    });

    it('appelle onCreateDossier avec le summary quand on clique sur "Créer dossier"', async () => {
      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        expect(screen.getByText(/créer dossier/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/créer dossier/i));
      expect(defaultProps.onCreateDossier).toHaveBeenCalledWith(mockSummary);
    });

    it('affiche le résumé détaillé en mode expanded', async () => {
      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        expect(screen.getByText(mockSummary.resumeCourt)).toBeInTheDocument();
      });
    });
  });

  describe('Fallback (IA indisponible)', () => {
    it('affiche un indicateur de fallback si _fallback=true', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockSummary, _fallback: true }),
      });

      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        expect(screen.getByText(/analyse par règles/i)).toBeInTheDocument();
      });
    });
  });

  describe('Erreur réseau', () => {
    it('affiche "Erreur — Réessayer" quand le fetch échoue', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        // Le composant rend "Erreur — Réessayer" avec em dash
        expect(screen.getByText((_content, element) => {
          return element?.textContent?.includes('essayer') ?? false;
        })).toBeInTheDocument();
      });
    });

    it('permet de relancer l\'analyse après une erreur', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      render(<EmailAISummary {...defaultProps} />);
      fireEvent.click(screen.getByText(/analyser avec l.ia/i));

      await waitFor(() => {
        expect(screen.getByText((_content, element) => {
          return element?.textContent?.includes('essayer') ?? false;
        })).toBeInTheDocument();
      });

      // Cliquer sur le bouton d'erreur (c'est un <button> qui contient le texte)
      const retryBtn = screen.getByText((_content, element) => {
        return element?.tagName === 'BUTTON' && (element?.textContent?.includes('essayer') ?? false);
      });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('CRITIQUE')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibilité', () => {
    it('le bouton d\'analyse est accessible au clavier', () => {
      render(<EmailAISummary {...defaultProps} />);
      const button = screen.getByText(/analyser avec l.ia/i);
      expect(button.tagName).toBe('BUTTON');
    });
  });
});
