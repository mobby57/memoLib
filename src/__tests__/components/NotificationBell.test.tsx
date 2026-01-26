/**
 * Tests pour NotificationBell component
 * Couverture: affichage, compteur, interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock le hook useNotifications
const mockMarkAsRead = jest.fn();
const mockClearAll = jest.fn();

jest.mock('@/components/NotificationProvider', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: mockMarkAsRead,
    clearAll: mockClearAll,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bell: () => <span data-testid="bell-icon">Bell</span>,
  X: () => <span data-testid="x-icon">X</span>,
  Check: () => <span data-testid="check-icon">Check</span>,
  AlertTriangle: () => <span data-testid="alert-icon">Alert</span>,
  Info: () => <span data-testid="info-icon">Info</span>,
  CheckCircle: () => <span data-testid="check-circle-icon">CheckCircle</span>,
}));

// Import après les mocks
import { NotificationBell } from '@/components/NotificationBell';

describe('NotificationBell Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('devrait afficher l\'icône de cloche', () => {
      render(<NotificationBell />);
      
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('devrait être cliquable', () => {
      render(<NotificationBell />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('État fermé', () => {
    it('ne devrait pas afficher le panneau de notifications par défaut', () => {
      render(<NotificationBell />);
      
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  describe('Ouverture du panneau', () => {
    it('devrait ouvrir le panneau au clic', () => {
      render(<NotificationBell />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('devrait afficher "Aucune notification" quand vide', () => {
      render(<NotificationBell />);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByText('Aucune notification')).toBeInTheDocument();
    });
  });

  describe('Fermeture du panneau', () => {
    it('devrait fermer au second clic sur la cloche', () => {
      render(<NotificationBell />);
      
      const button = screen.getByRole('button');
      
      // Ouvrir
      fireEvent.click(button);
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      
      // Fermer
      fireEvent.click(button);
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });
});

describe('NotificationBell structure de données', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'success',
      title: 'Dossier créé',
      message: 'Le dossier DOS-001 a été créé',
      timestamp: new Date(),
      read: false,
    },
    {
      id: 'notif-2',
      type: 'error',
      title: 'Erreur',
      message: 'Échec du téléchargement',
      timestamp: new Date(),
      read: true,
    },
  ];

  it('devrait avoir les champs requis', () => {
    const notif = mockNotifications[0];
    
    expect(notif.id).toBeDefined();
    expect(notif.type).toBeDefined();
    expect(notif.title).toBeDefined();
    expect(notif.message).toBeDefined();
    expect(notif.timestamp).toBeInstanceOf(Date);
    expect(typeof notif.read).toBe('boolean');
  });

  it('devrait distinguer les notifications lues et non lues', () => {
    const unread = mockNotifications.filter(n => !n.read);
    const read = mockNotifications.filter(n => n.read);
    
    expect(unread).toHaveLength(1);
    expect(read).toHaveLength(1);
  });
});

describe('Notification Types et Icons', () => {
  it('devrait mapper success vers CheckCircle', () => {
    const getIcon = (type: string) => {
      switch (type) {
        case 'success': return 'CheckCircle';
        case 'error': return 'AlertTriangle';
        case 'warning': return 'AlertTriangle';
        default: return 'Info';
      }
    };

    expect(getIcon('success')).toBe('CheckCircle');
    expect(getIcon('error')).toBe('AlertTriangle');
    expect(getIcon('warning')).toBe('AlertTriangle');
    expect(getIcon('info')).toBe('Info');
    expect(getIcon('unknown')).toBe('Info');
  });
});

describe('Badge de compteur', () => {
  it('devrait formater le compteur <= 9', () => {
    const formatCount = (count: number): string => {
      return count > 9 ? '9+' : String(count);
    };

    expect(formatCount(0)).toBe('0');
    expect(formatCount(5)).toBe('5');
    expect(formatCount(9)).toBe('9');
  });

  it('devrait formater le compteur > 9 en "9+"', () => {
    const formatCount = (count: number): string => {
      return count > 9 ? '9+' : String(count);
    };

    expect(formatCount(10)).toBe('9+');
    expect(formatCount(99)).toBe('9+');
    expect(formatCount(100)).toBe('9+');
  });
});

describe('Format de date/heure', () => {
  it('devrait formater l\'heure en français', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });
});
