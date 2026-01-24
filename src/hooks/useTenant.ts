import { useAuth } from './useAuth';

export function useTenant() {
  const { user } = useAuth();

  const tenantId = user?.tenantId;
  const tenantName = user?.tenantName;
  const tenantPlan = user?.tenantPlan;

  const getTenantApiUrl = (endpoint: string) => {
    if (!tenantId) return null;
    return `/api/tenant/${tenantId}${endpoint}`;
  };

  const isPlan = (plan: string) => {
    return tenantPlan === plan;
  };

  const hasFeature = (feature: string) => {
    // Logique de gestion des fonctionnalites par plan
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

    return features[tenantPlan || 'Starter']?.includes(feature) || false;
  };

  return {
    tenantId,
    tenantName,
    tenantPlan,
    getTenantApiUrl,
    isPlan,
    hasFeature,
  };
}
