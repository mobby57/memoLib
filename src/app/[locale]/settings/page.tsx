'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Breadcrumb, Alert, Card } from '@/components/ui';
import { Building2, Bell, Shield, User } from 'lucide-react';
import { SettingsLayout, type SettingsSectionDef } from '@/components/settings/SettingsLayout';
import { CabinetSettingsSection } from '@/components/settings/CabinetSettingsSection';
import { usePermissions, RBAC_PERMISSIONS } from '@/hooks/usePermissions';

/**
 * Page Paramètres — refonte Incrément 3.
 *
 * Navigation responsive (SettingsLayout) : sidebar desktop / sélecteur mobile.
 * La section "Cabinet" est branchée sur la vraie config (useSettings) avec
 * dirty-state ("modifications non enregistrées"). Les sections héritées
 * (profil, sécurité) restent accessibles.
 */
export default function SettingsPage() {
  const { locale } = useParams<{ locale: string }>();
  const { can } = usePermissions();
  const [activeId, setActiveId] = useState('cabinet');

  const securitySettingsPath = `/${encodeURIComponent(locale)}/settings/security`;

  const sections: SettingsSectionDef[] = [
    {
      id: 'cabinet',
      label: 'Cabinet',
      icon: <Building2 className="h-4 w-4" />,
      visible: can(RBAC_PERMISSIONS.SETTINGS_READ),
    },
    { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'security', label: 'Sécurité', icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Paramètres' }]} />

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Configurez votre cabinet et vos préférences
        </p>
      </div>

      <SettingsLayout sections={sections} activeId={activeId} onSelect={setActiveId}>
        {activeId === 'cabinet' && <CabinetSettingsSection />}

        {activeId === 'profile' && (
          <Card className="p-6">
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Profil</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              La gestion du profil personnel est disponible dans votre espace compte.
            </p>
          </Card>
        )}

        {activeId === 'notifications' && (
          <Card className="p-6">
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Les préférences de notifications du cabinet se règlent dans la section « Cabinet ».
              Les préférences personnelles arriveront prochainement.
            </p>
          </Card>
        )}

        {activeId === 'security' && (
          <div className="space-y-6">
            <Alert variant="info" title="Sécurité de votre compte">
              Gérez vos passkeys, l’authentification à deux facteurs et vos sessions dans Clerk.
            </Alert>
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                Gestion de la sécurité
              </h3>
              <Link
                href={securitySettingsPath}
                className="inline-flex rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Ouvrir les réglages de sécurité
              </Link>
            </Card>
          </div>
        )}
      </SettingsLayout>
    </div>
  );
}
