import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import useAppStore from '../store/useAppStore';

vi.mock('../store/useAppStore');

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    useAppStore.mockReturnValue({
      stats: { emailsSent: 42, aiGenerated: 15, templates: 5, contacts: 10 },
      loading: false,
      loadDashboard: vi.fn(),
      getRecentEmails: () => []
    });
  });

  it('should display stats correctly', () => {
    renderDashboard();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should show dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
  });
});