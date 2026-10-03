import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * Tests de CabinetSettingsSection (jsdom).
 * On mocke les hooks de données/permission pour piloter les états.
 */

const state = vi.hoisted(() => ({
  canWrite: true,
  data: {
    tenantId: 't1',
    cabinetName: 'Cabinet A',
    cabinetLogo: null,
    cabinetAddress: null,
    cabinetPhone: null,
    cabinetEmail: null,
    defaultLanguage: 'fr',
    defaultTimezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    emailNotifications: true,
    deadlineNotifications: true,
    ocrEnabled: false,
    aiEnabled: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as any,
  isLoading: false,
  isError: false,
  mutateAsync: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    data: state.data,
    isLoading: state.isLoading,
    isError: state.isError,
    error: null,
  }),
  useUpdateSettings: () => ({
    mutateAsync: state.mutateAsync,
    isPending: false,
  }),
  SettingsError: class SettingsError extends Error {
    status: number;
    constructor(m: string, s: number) {
      super(m);
      this.status = s;
    }
  },
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => state.canWrite }),
  RBAC_PERMISSIONS: { SETTINGS_WRITE: 'settings:write', SETTINGS_READ: 'settings:read' },
}));

vi.mock('@/components/ui', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  Alert: ({ title, children }: any) => (
    <div role="alert">
      {title}: {children}
    </div>
  ),
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  useToast: () => ({ addToast: state.addToast }),
}));

import { CabinetSettingsSection } from '@/components/settings/CabinetSettingsSection';

beforeEach(() => {
  state.canWrite = true;
  state.isLoading = false;
  state.isError = false;
  state.mutateAsync = vi.fn().mockResolvedValue({ ...state.data, cabinetName: 'Cabinet B' });
  state.addToast = vi.fn();
});

describe('CabinetSettingsSection', () => {
  it('affiche la config chargée', () => {
    render(<CabinetSettingsSection />);
    expect((screen.getByLabelText('Nom du cabinet') as HTMLInputElement).value).toBe('Cabinet A');
  });

  it('mode lecture seule sans settings:write : champs désactivés + pas de barre', () => {
    state.canWrite = false;
    render(<CabinetSettingsSection />);
    expect(screen.getByLabelText('Nom du cabinet')).toBeDisabled();
    expect(screen.queryByText('Vous avez des modifications non enregistrées.')).toBeNull();
    expect(screen.getByText(/Lecture seule/)).toBeInTheDocument();
  });

  it('affiche la barre "modifications non enregistrées" après édition', () => {
    render(<CabinetSettingsSection />);
    expect(screen.queryByText('Vous avez des modifications non enregistrées.')).toBeNull();
    fireEvent.change(screen.getByLabelText('Nom du cabinet'), { target: { value: 'Cabinet B' } });
    expect(screen.getByText('Vous avez des modifications non enregistrées.')).toBeInTheDocument();
  });

  it('enregistre le diff via la mutation et notifie', async () => {
    render(<CabinetSettingsSection />);
    fireEvent.change(screen.getByLabelText('Nom du cabinet'), { target: { value: 'Cabinet B' } });
    fireEvent.click(screen.getByText('Enregistrer'));

    await waitFor(() => expect(state.mutateAsync).toHaveBeenCalledWith({ cabinetName: 'Cabinet B' }));
    await waitFor(() =>
      expect(state.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' })
      )
    );
  });

  it('annuler réinitialise le formulaire', () => {
    render(<CabinetSettingsSection />);
    fireEvent.change(screen.getByLabelText('Nom du cabinet'), { target: { value: 'Cabinet B' } });
    fireEvent.click(screen.getByText('Annuler'));
    expect((screen.getByLabelText('Nom du cabinet') as HTMLInputElement).value).toBe('Cabinet A');
    expect(screen.queryByText('Vous avez des modifications non enregistrées.')).toBeNull();
  });
});
