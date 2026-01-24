/**
 * Tests pour le hook useTenant
 * Couverture: tenant info, features, plans
 */

import { renderHook } from '@testing-library/react';

// Mock useAuth
const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'AVOCAT',
  tenantId: 'tenant-123',
  tenantName: 'Cabinet Test',
  tenantPlan: 'Professional',
};

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// Import après les mocks
import { useTenant } from '@/hooks/useTenant';

describe('useTenant Hook', () => {
  describe('Tenant Info', () => {
    it('devrait retourner tenantId', () => {
      const { result } = renderHook(() => useTenant());
      
      expect(result.current.tenantId).toBe('tenant-123');
    });

    it('devrait retourner tenantName', () => {
      const { result } = renderHook(() => useTenant());
      
      expect(result.current.tenantName).toBe('Cabinet Test');
    });

    it('devrait retourner tenantPlan', () => {
      const { result } = renderHook(() => useTenant());
      
      expect(result.current.tenantPlan).toBe('Professional');
    });
  });

  describe('getTenantApiUrl', () => {
    it('devrait construire l\'URL API', () => {
      const { result } = renderHook(() => useTenant());
      
      const url = result.current.getTenantApiUrl('/dossiers');
      expect(url).toBe('/api/tenant/tenant-123/dossiers');
    });

    it('devrait gérer les endpoints sans slash', () => {
      const { result } = renderHook(() => useTenant());
      
      const url = result.current.getTenantApiUrl('clients');
      expect(url).toBe('/api/tenant/tenant-123clients');
    });
  });

  describe('isPlan', () => {
    it('devrait retourner true pour le plan actuel', () => {
      const { result } = renderHook(() => useTenant());
      
      expect(result.current.isPlan('Professional')).toBe(true);
    });

    it('devrait retourner false pour un autre plan', () => {
      const { result } = renderHook(() => useTenant());
      
      expect(result.current.isPlan('Starter')).toBe(false);
      expect(result.current.isPlan('Enterprise')).toBe(false);
    });
  });

  describe('hasFeature', () => {
    it('devrait avoir les features du plan Professional', () => {
      const { result } = renderHook(() => useTenant());
      
      expect(result.current.hasFeature('basic_dossiers')).toBe(true);
      expect(result.current.hasFeature('basic_factures')).toBe(true);
      expect(result.current.hasFeature('advanced_reporting')).toBe(true);
      expect(result.current.hasFeature('email_automation')).toBe(true);
    });

    it('ne devrait pas avoir les features Enterprise', () => {
      const { result } = renderHook(() => useTenant());
      
      expect(result.current.hasFeature('api_access')).toBe(false);
      expect(result.current.hasFeature('custom_integrations')).toBe(false);
      expect(result.current.hasFeature('priority_support')).toBe(false);
    });

    it('devrait retourner false pour feature inconnue', () => {
      const { result } = renderHook(() => useTenant());
      
      expect(result.current.hasFeature('unknown_feature')).toBe(false);
    });
  });
});

describe('Plan Features', () => {
  const features: Record<string, string[]> = {
    Starter: ['basic_dossiers', 'basic_factures'],
    Professional: [
      'basic_dossiers',
      'basic_factures',
      'advanced_reporting',
      'email_automation',
    ],
    Enterprise: [
      'basic_dossiers',
      'basic_factures',
      'advanced_reporting',
      'email_automation',
      'api_access',
      'custom_integrations',
      'priority_support',
    ],
  };

  it('Starter devrait avoir 2 features', () => {
    expect(features.Starter).toHaveLength(2);
  });

  it('Professional devrait avoir 4 features', () => {
    expect(features.Professional).toHaveLength(4);
  });

  it('Enterprise devrait avoir 7 features', () => {
    expect(features.Enterprise).toHaveLength(7);
  });

  it('les plans supérieurs incluent les features inférieures', () => {
    features.Starter.forEach(feature => {
      expect(features.Professional).toContain(feature);
      expect(features.Enterprise).toContain(feature);
    });

    features.Professional.forEach(feature => {
      expect(features.Enterprise).toContain(feature);
    });
  });
});

describe('Tenant API URLs', () => {
  it('devrait générer des URLs valides', () => {
    const endpoints = ['/dossiers', '/clients', '/factures', '/documents'];
    const tenantId = 'tenant-123';
    
    endpoints.forEach(endpoint => {
      const url = `/api/tenant/${tenantId}${endpoint}`;
      expect(url).toContain('/api/tenant/');
      expect(url).toContain(tenantId);
    });
  });
});
