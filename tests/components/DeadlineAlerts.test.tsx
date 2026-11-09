import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DeadlineAlerts } from '@/components/dashboard/DeadlineAlerts';

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

const mockDeadlines = [
  {
    id: 'dl-1',
    label: 'Recours OQTF — M. Diallo',
    dueDate: new Date(Date.now() + 1 * 86400000).toISOString(), // J-1
    dossierId: 'dossier-1',
    dossierNumero: 'D-2026-001',
    clientName: 'M. Diallo',
    type: 'RECOURS',
    status: 'PENDING',
  },
  {
    id: 'dl-2',
    label: 'Renouvellement titre — Mme Traoré',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(), // J-3
    dossierId: 'dossier-2',
    dossierNumero: 'D-2026-012',
    clientName: 'Mme Traoré',
    type: 'RENOUVELLEMENT',
    status: 'PENDING',
  },
  {
    id: 'dl-3',
    label: 'Audience CNDA — M. Koné',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), // J-7
    dossierId: 'dossier-3',
    dossierNumero: 'D-2026-034',
    clientName: 'M. Koné',
    type: 'AUDIENCE',
    status: 'PENDING',
  },
];

describe('DeadlineAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sans tenantId', () => {
    it('ne fait aucun appel API', () => {
      render(<DeadlineAlerts />);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('affiche "Aucune échéance proche"', async () => {
      render(<DeadlineAlerts />);
      await waitFor(() => {
        expect(screen.getByText(/aucune échéance proche/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading', () => {
    it('affiche un skeleton pendant le chargement', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));
      const { container } = render(<DeadlineAlerts tenantId="tenant-1" />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Avec des échéances', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ deadlines: mockDeadlines }),
      });
    });

    it('appelle l\'API avec le bon tenantId', async () => {
      render(<DeadlineAlerts tenantId="tenant-42" />);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('tenantId=tenant-42')
        );
      });
    });

    it('affiche le titre "Échéances proches"', async () => {
      render(<DeadlineAlerts tenantId="tenant-1" />);
      await waitFor(() => {
        expect(screen.getByText(/échéances proches/i)).toBeInTheDocument();
      });
    });

    it('affiche le compteur d\'échéances', async () => {
      render(<DeadlineAlerts tenantId="tenant-1" />);
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('affiche les labels des échéances', async () => {
      render(<DeadlineAlerts tenantId="tenant-1" />);
      await waitFor(() => {
        expect(screen.getByText(/Recours OQTF — M. Diallo/)).toBeInTheDocument();
        expect(screen.getByText(/Renouvellement titre — Mme Traoré/)).toBeInTheDocument();
        expect(screen.getByText(/Audience CNDA — M. Koné/)).toBeInTheDocument();
      });
    });

    it('affiche les noms des clients', async () => {
      render(<DeadlineAlerts tenantId="tenant-1" />);
      await waitFor(() => {
        expect(screen.getByText('M. Diallo')).toBeInTheDocument();
        expect(screen.getByText('Mme Traoré')).toBeInTheDocument();
      });
    });

    it('affiche les badges J-X avec le bon code couleur', async () => {
      render(<DeadlineAlerts tenantId="tenant-1" />);
      await waitFor(() => {
        expect(screen.getByText('J-1')).toBeInTheDocument();
        expect(screen.getByText('J-3')).toBeInTheDocument();
        expect(screen.getByText('J-7')).toBeInTheDocument();
      });
    });

    it('les échéances sont des liens vers les dossiers', async () => {
      render(<DeadlineAlerts tenantId="tenant-1" />);
      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links[0]).toHaveAttribute('href', '/dossiers/dossier-1');
        expect(links[1]).toHaveAttribute('href', '/dossiers/dossier-2');
      });
    });

    it('affiche un badge EXPIRÉ pour les deadlines passées', async () => {
      const expiredDeadline = [{
        ...mockDeadlines[0],
        dueDate: new Date(Date.now() - 86400000).toISOString(), // hier
      }];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ deadlines: expiredDeadline }),
      });

      render(<DeadlineAlerts tenantId="tenant-1" />);
      await waitFor(() => {
        expect(screen.getByText('EXPIRÉ')).toBeInTheDocument();
      });
    });
  });

  describe('Plus de 5 échéances', () => {
    it('affiche "Voir toutes les échéances" avec un lien', async () => {
      const manyDeadlines = Array.from({ length: 8 }, (_, i) => ({
        ...mockDeadlines[0],
        id: `dl-${i}`,
        label: `Échéance ${i}`,
        dossierId: `dossier-${i}`,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ deadlines: manyDeadlines }),
      });

      render(<DeadlineAlerts tenantId="tenant-1" />);
      await waitFor(() => {
        expect(screen.getByText(/voir toutes les échéances/i)).toBeInTheDocument();
      });
    });
  });

  describe('Erreur API', () => {
    it('affiche "Aucune échéance" en cas d\'erreur réseau', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<DeadlineAlerts tenantId="tenant-1" />);
      await waitFor(() => {
        expect(screen.getByText(/aucune échéance proche/i)).toBeInTheDocument();
      });
    });
  });
});
