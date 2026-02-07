'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CommandPalette } from '@/components/CommandPalette';
import { logger } from '@/lib/logger';
import { 
  Search, 
  FileText, 
  Users, 
  Folder, 
  Plus, 
  Settings,
  LayoutDashboard,
  FileType
} from 'lucide-react';

interface SearchableItem {
  id: string;
  title: string;
  description?: string;
  type?: string;
  category?: string;
  url?: string;
  href?: string;
  icon?: React.ComponentType;
  keywords?: string[];
  action?: () => void;
}

/**
 * Provider global pour la Command Palette
 * Integre la recherche globale dans toute l'application
 */
export function GlobalCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const [searchItems, setSearchItems] = useState<SearchableItem[]>([]);

  // Charger les items disponibles
  useEffect(() => {
    const loadSearchItems = async () => {
      try {
        // Charger dossiers
        const dossiersRes = await fetch('/api/tenant/dossiers');
        const dossiers = dossiersRes.ok ? await dossiersRes.json() : [];

        // Charger clients
        const clientsRes = await fetch('/api/tenant/clients');
        const clients = clientsRes.ok ? await clientsRes.json() : [];

        // Charger factures
        const facturesRes = await fetch('/api/tenant/factures');
        const factures = facturesRes.ok ? await facturesRes.json() : [];

        const items: SearchableItem[] = [
          // Actions rapides
          {
            id: 'action-new-dossier',
            type: 'action',
            title: 'Creer un nouveau dossier',
            icon: Plus,
            href: '/dossiers?action=create'
          },
          {
            id: 'action-new-client',
            type: 'action',
            title: 'Ajouter un client',
            icon: Plus,
            href: '/clients?action=create'
          },
          {
            id: 'action-new-facture',
            type: 'action',
            title: 'Creer une facture',
            icon: Plus,
            href: '/factures?action=create'
          },
          
          // Navigation
          {
            id: 'nav-dashboard',
            type: 'action',
            title: 'Aller au Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard'
          },
          {
            id: 'nav-templates',
            type: 'action',
            title: 'Gerer les templates',
            icon: FileType,
            href: '/templates'
          },
          {
            id: 'nav-settings',
            type: 'action',
            title: 'Parametres',
            icon: Settings,
            href: '/settings'
          },

          // Dossiers
          ...dossiers.map((dossier: any) => ({
            id: `dossier-${dossier.id}`,
            type: 'dossier' as const,
            title: dossier.titre,
            subtitle: dossier.reference,
            metadata: `${dossier.client?.nom || ''} ${dossier.type} ${dossier.statut}`,
            icon: Folder,
            href: `/dossiers/${dossier.id}`
          })),

          // Clients
          ...clients.map((client: any) => ({
            id: `client-${client.id}`,
            type: 'client' as const,
            title: client.nom,
            subtitle: client.email,
            metadata: `${client.type} ${client.statut}`,
            icon: Users,
            href: `/clients/${client.id}`
          })),

          // Factures
          ...factures.map((facture: any) => ({
            id: `facture-${facture.id}`,
            type: 'facture' as const,
            title: `Facture ${facture.numero}`,
            subtitle: `${facture.montant}� - ${facture.statut}`,
            metadata: `${facture.client?.nom || ''} ${facture.statut}`,
            icon: FileText,
            href: `/factures/${facture.id}`
          })),
        ];

        setSearchItems(items);
      } catch (error) {
        logger.error('Erreur chargement items recherche', { error });
        
        // Items par defaut en cas d'erreur
        setSearchItems([
          {
            id: 'nav-dashboard',
            type: 'action',
            title: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard'
          },
          {
            id: 'nav-dossiers',
            type: 'action',
            title: 'Dossiers',
            icon: Folder,
            href: '/dossiers'
          },
          {
            id: 'nav-clients',
            type: 'action',
            title: 'Clients',
            icon: Users,
            href: '/clients'
          },
          {
            id: 'nav-factures',
            type: 'action',
            title: 'Factures',
            icon: FileText,
            href: '/factures'
          },
          {
            id: 'nav-templates',
            type: 'action',
            title: 'Templates',
            icon: FileType,
            href: '/templates'
          },
        ]);
      }
    };

    if (isOpen && session) {
      loadSearchItems();
    }
  }, [isOpen, session]);

  return (
    <CommandPalette
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      items={searchItems as any}
    />
  );
}

/**
 * Indicateur de raccourci clavier Ctrl+K
 * a afficher dans la barre de navigation
 */
export function SearchShortcut() {
  const open = () => {}; // Placeholder

  return (
    <button
      onClick={open}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="hidden md:inline">Rechercher</span>
      <kbd className="hidden sm:inline-flex px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
        Ctrl+K
      </kbd>
    </button>
  );
}
