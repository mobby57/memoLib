import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Modal } from '@/components/forms/Modal';

describe('Modal accessibility', () => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Créer un dossier',
  };

  it('announces a labelled modal dialog and places focus on its close control', () => {
    render(<Modal {...props}>Contenu</Modal>);

    const dialog = screen.getByRole('dialog', { name: /créer un dossier/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();
  });

  it('keeps keyboard focus within the modal', () => {
    render(
      <Modal {...props}>
        <input aria-label="Nom du dossier" />
        <button type="button">Confirmer</button>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    const confirmButton = screen.getByRole('button', { name: /confirmer/i });

    confirmButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(confirmButton).toHaveFocus();
  });
});
