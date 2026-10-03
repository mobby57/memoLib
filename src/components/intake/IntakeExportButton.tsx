'use client';

import { useState } from 'react';
import { Button, useToast } from '@/components/ui';
import { usePermissions, RBAC_PERMISSIONS } from '@/hooks/usePermissions';
import { Download } from 'lucide-react';

/**
 * IntakeExportButton — déclenche l'export "coffre-fort" chiffré des demandes
 * d'intake (GET /api/intake/export) et télécharge le fichier .xlsx.enc.
 *
 * Le fichier téléchargé est CHIFFRÉ (AES-256-GCM). Il faut la clé maître pour
 * le rouvrir (voir scripts/decrypt-intake-vault.mjs).
 *
 * Affiché uniquement pour les profils gérant les dossiers (dossiers:manage) —
 * la vraie autorisation reste côté API.
 */
export function IntakeExportButton() {
  const { addToast } = useToast();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(false);

  if (!can(RBAC_PERMISSIONS.DOSSIERS_MANAGE)) return null;

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intake/export', { headers: { Accept: 'application/octet-stream' } });
      if (!res.ok) {
        throw new Error(res.status === 403 ? 'Accès refusé' : `Échec de l’export (${res.status})`);
      }

      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || 'intake-vault.xlsx.enc';
      const count = res.headers.get('X-Intake-Count') || '?';

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        variant: 'success',
        title: 'Export chiffré généré',
        message: `${count} demande(s) exportée(s). Fichier chiffré téléchargé.`,
      });
    } catch (e) {
      addToast({
        variant: 'error',
        title: 'Erreur',
        message: e instanceof Error ? e.message : 'Impossible d’exporter.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? 'Export…' : 'Exporter (coffre-fort chiffré)'}
    </Button>
  );
}
