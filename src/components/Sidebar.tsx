'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Folder, 
  FileText, 
  Users, 
  Calendar, 
  TrendingUp, 
  FileType, 
  FolderOpen, 
  Workflow, 
  FileDown, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Archive
} from 'lucide-react';
import { useState } from 'react';

interface SubMenuItem {
  name: string;
  href: string;
  icon?: any;
  badge?: number;
  color?: string;
}

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  subItems?: SubMenuItem[];
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dossiers']);

  if (!session || pathname.startsWith('/auth')) {
    return null;
  }

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const menuItems: MenuItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      badge: 5
    },
    { 
      name: 'Dossiers', 
      href: '/dossiers', 
      icon: Folder,
      badge: 42,
      subItems: [
        { name: 'Tous les dossiers', href: '/dossiers', icon: FolderOpen },
        { name: 'Nouveaux dossiers', href: '/dossiers?filter=new', icon: Plus, badge: 8, color: 'green' },
        { name: 'En cours', href: '/dossiers?filter=active', icon: Clock, badge: 23, color: 'blue' },
        { name: 'En attente', href: '/dossiers?filter=pending', icon: AlertCircle, badge: 11, color: 'yellow' },
        { name: 'Termines', href: '/dossiers?filter=completed', icon: CheckCircle2, color: 'green' },
        { name: 'Urgents', href: '/dossiers?filter=urgent', icon: AlertCircle, badge: 6, color: 'red' },
        { name: 'Archives', href: '/dossiers?filter=archived', icon: Archive },
        { name: 'Creer un dossier', href: '/dossiers/new', icon: Plus, color: 'blue' }
      ]
    },
    { 
      name: 'Factures', 
      href: '/factures', 
      icon: FileText,
      badge: 18,
      subItems: [
        { name: 'Toutes les factures', href: '/factures', icon: FileText },
        { name: 'En attente', href: '/factures?status=pending', icon: Clock, badge: 12, color: 'yellow' },
        { name: 'Payees', href: '/factures?status=paid', icon: CheckCircle2, color: 'green' },
        { name: 'En retard', href: '/factures?status=overdue', icon: XCircle, badge: 6, color: 'red' },
        { name: 'Creer une facture', href: '/factures/new', icon: Plus, color: 'blue' }
      ]
    },
    { 
      name: 'Clients', 
      href: '/clients', 
      icon: Users,
      badge: 156,
      subItems: [
        { name: 'Tous les clients', href: '/clients', icon: Users },
        { name: 'Clients actifs', href: '/clients?status=active', icon: CheckCircle2, badge: 142, color: 'green' },
        { name: 'Nouveaux clients', href: '/clients?status=new', icon: Plus, badge: 14, color: 'blue' },
        { name: 'Rechercher un client', href: '/clients?action=search', icon: Search },
        { name: 'Ajouter un client', href: '/clients/new', icon: Plus, color: 'blue' }
      ]
    },
    { 
      name: 'Calendrier', 
      href: '/calendrier', 
      icon: Calendar,
      badge: 8,
      subItems: [
        { name: 'Vue mensuelle', href: '/calendrier?view=month', icon: Calendar },
        { name: 'Vue hebdomadaire', href: '/calendrier?view=week', icon: Calendar },
        { name: 'Vue quotidienne', href: '/calendrier?view=day', icon: Calendar },
        { name: 'Rendez-vous', href: '/calendrier?type=appointments', icon: Clock, badge: 5 },
        { name: 'echeances', href: '/calendrier?type=deadlines', icon: AlertCircle, badge: 3, color: 'red' },
        { name: 'Creer un evenement', href: '/calendrier/new', icon: Plus, color: 'blue' }
      ]
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: TrendingUp,
      subItems: [
        { name: 'Vue d\'ensemble', href: '/analytics', icon: TrendingUp },
        { name: 'Dossiers', href: '/analytics/dossiers', icon: Folder },
        { name: 'Finances', href: '/analytics/finances', icon: FileText },
        { name: 'Performance', href: '/analytics/performance', icon: TrendingUp },
        { name: 'Rapports', href: '/analytics/reports', icon: FileDown }
      ]
    },
    { 
      name: 'Templates', 
      href: '/templates', 
      icon: FileType,
      subItems: [
        { name: 'Tous les templates', href: '/templates', icon: FileType },
        { name: 'Documents juridiques', href: '/templates?category=legal', icon: FileText },
        { name: 'Emails', href: '/templates?category=email', icon: FileText },
        { name: 'Contrats', href: '/templates?category=contracts', icon: FileText },
        { name: 'Creer un template', href: '/templates/new', icon: Plus, color: 'blue' }
      ]
    },
    { 
      name: 'Documents', 
      href: '/documents', 
      icon: FolderOpen,
      badge: 234,
      subItems: [
        { name: 'Tous les documents', href: '/documents', icon: FolderOpen },
        { name: 'Recents', href: '/documents?filter=recent', icon: Clock },
        { name: 'Partages', href: '/documents?filter=shared', icon: Users },
        { name: 'Rechercher', href: '/documents?action=search', icon: Search },
        { name: 'Telecharger', href: '/documents/upload', icon: Plus, color: 'blue' }
      ]
    },
    { 
      name: 'Workflows', 
      href: '/workflows', 
      icon: Workflow,
      badge: 12,
      subItems: [
        { name: 'Tous les workflows', href: '/workflows', icon: Workflow },
        { name: 'Actifs', href: '/workflows?status=active', icon: CheckCircle2, badge: 8, color: 'green' },
        { name: 'En pause', href: '/workflows?status=paused', icon: Clock, badge: 4 },
        { name: 'Creer un workflow', href: '/workflows/new', icon: Plus, color: 'blue' }
      ]
    },
    { 
      name: 'Exports', 
      href: '/exports', 
      icon: FileDown,
      subItems: [
        { name: 'Historique d\'exports', href: '/exports', icon: FileDown },
        { name: 'Exporter des dossiers', href: '/exports?type=dossiers', icon: Folder },
        { name: 'Exporter des factures', href: '/exports?type=factures', icon: FileText },
        { name: 'Rapports personnalises', href: '/exports?type=custom', icon: TrendingUp }
      ]
    },
    { 
      name: 'Assistant IA', 
      href: '/ai-assistant', 
      icon: Sparkles,
      badge: 3
    }
  ];

  const isActive = (item: MenuItem) => {
    if (pathname === item.href) return true;
    if (item.subItems) {
      return item.subItems.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'));
    }
    return false;
  };

  const isSubItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="hidden lg:flex lg:flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto" style={{ width: '280px', height: 'calc(100vh - 4rem)' }}>
      <div className="w-full">
        <nav className="py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item);
            const expanded = expandedItems.includes(item.name);
            const Icon = item.icon;

            return (
              <div key={item.name} className="space-y-1">
                {/* Menu principal */}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={`flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  
                  {/* Bouton d'expansion pour sous-menus */}
                  {item.subItems && item.subItems.length > 0 && (
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label={expanded ? 'Reduire' : 'Developper'}
                    >
                      {expanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* Sous-menus */}
                {item.subItems && expanded && (
                  <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subActive = isSubItemActive(subItem.href);
                      
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                            subActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          {SubIcon && <SubIcon className="w-4 h-4 mr-2" />}
                          <span className="flex-1">{subItem.name}</span>
                          {subItem.badge && subItem.badge > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              subItem.color === 'red'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : subItem.color === 'green'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : subItem.color === 'yellow'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Informations utilisateur en bas */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {session.user?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session.user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session.user?.tenantName}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold shadow-sm">
              Plan {session.user?.tenantPlan}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
