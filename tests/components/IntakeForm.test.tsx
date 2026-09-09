import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * Tests de IntakeForm (jsdom) : rendu dynamique des champs, toggle document,
 * dirty-bar, sauvegarde et "besoin d'aide".
 */

const state = vi.hoisted(() => ({
  intake: {
    id: 'i1',
    tenantId: 't1',
    clientId: null,
    type: 'OQTF',
    status: 'IN_PROGRESS',
    origin: 'googlesheet',
    sourceRef: 'row-1',
    clientEmail: 'c@ex.fr',
    data: { nom: 'Dupont' },
    requiredFields: [
      { id: 'nom', label: 'Nom', type: 'text', required: true },
      { id: 'dateNaissance', label: 'Date de naissance', type: 'date', required: true },
    ],
    requiredDocuments: ['Passeport', 'Justificatif de domicile'],
    providedDocuments: ['Passeport'],
    completeness: 40,
    createdAt: 'x',
    updatedAt: 'y',
  } as any,
  isLoading: false,
  isError: false,
  mutateAsync: vi.fn(),
  isPending: false,
  addToast: vi.fn(),
}));

vi.mock('@/hooks/useIntakeRequest', () => ({
  useIntakeRequest: () => ({ data: state.intake, isLoading: state.isLoading, isError: state.isError }),
  useUpdateIntakeRequest: () => ({ mutateAsync: state.mutateAsync, isPending: state.isPending }),
  useUploadIntakeDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIntakeUploadedFiles: () => ({ data: { files: [], count: 0 } }),
  useDeleteIntakeDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  intakeFileDownloadUrl: (id: string, fileId: string) => `/api/intake/${id}/documents/${fileId}`,
}));

vi.mock('@/components/ui', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  Alert: ({ title, children }: any) => <div role="alert">{title}: {children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  useToast: () => ({ addToast: state.addToast }),
}));

import { IntakeForm } from '@/components/intake/IntakeForm';

beforeEach(() => {
  vi.clearAllMocks();
  state.isLoading = false;
  state.isError = false;
  state.mutateAsync = vi.fn().mockResolvedValue({ ...state.intake, completeness: 60 });
});

describe('IntakeForm', () => {
  it('rend les champs dynamiques avec valeurs pré-remplies', () => {
    render(<IntakeForm id="i1" />);
    expect((screen.getByLabelText(/Nom/) as HTMLInputElement).value).toBe('Dupont');
    expect(screen.getByText('Passeport')).toBeInTheDocument();
  });

  it('affiche la barre dirty après modification d’un champ', () => {
    render(<IntakeForm id="i1" />);
    expect(screen.queryByText('Vous avez des modifications non enregistrées.')).toBeNull();
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Martin' } });
    expect(screen.getByText('Vous avez des modifications non enregistrées.')).toBeInTheDocument();
  });

  it('affiche l’état des documents (fourni / manquant) et un déclencheur d’upload', () => {
    render(<IntakeForm id="i1" />);
    // Passeport est déjà fourni, Justificatif est manquant.
    expect(screen.getByText('✓ fourni')).toBeInTheDocument();
    expect(screen.getByText('manquant')).toBeInTheDocument();
    expect(screen.getAllByText(/Déposer un fichier|Remplacer/).length).toBeGreaterThan(0);
  });

  it('enregistre les réponses', async () => {
    render(<IntakeForm id="i1" />);
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Martin' } });
    fireEvent.click(screen.getByText('Enregistrer'));
    await waitFor(() =>
      expect(state.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ nom: 'Martin' }), needsHelp: false })
      )
    );
  });

  it('signale "besoin d’aide"', async () => {
    render(<IntakeForm id="i1" />);
    fireEvent.click(screen.getByText('Signaler « besoin d’aide »'));
    await waitFor(() =>
      expect(state.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ needsHelp: true }))
    );
  });

  it('affiche une erreur si introuvable', () => {
    state.isError = true;
    state.intake = null;
    render(<IntakeForm id="i1" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
