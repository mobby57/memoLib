'use client';

import { useAuth } from '@/hooks/useAuth';
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
import { canAccessPage } from '@/lib/page-access';

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
  const { data: session, user } = useAuth();
  const pathname = usePathname();
  const currentPath = pathname ?? '';
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dossiers']);

  // Extraire la locale du pathname (e.g. /fr/dashboard → fr)
  const locale = currentPath.split('/')[1] || 'fr';
  const lhref = (path: string) => `/${locale}${path.startsWith('/') ? path : '/' + path}`;

  if (!session || currentPath.startsWith('/auth') || currentPath.includes('/auth/')) {
    return null;
  }

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const role = user?.role || 'AVOCAT';

  // Items principaux visibles pour tous les rôles juridiques
  const primaryItems: MenuItem[] = [
    { name: 'Dashboard', href: lhref('/dashboard'), icon: LayoutDashboard },
    { name: 'Dossiers', href: lhref('/dossiers'), icon: Folder, badge: 18 },
    { name: 'Emails', href: lhref('/emails'), icon: FileText, badge: 5 },
    { name: 'Clients', href: lhref('/clients'), icon: Users },
    { name: 'Calendrier', href: lhref('/calendrier'), icon: Calendar, badge: 3 },
  ];

  // Items secondaires selon le rôle
  const secondaryItems: MenuItem[] = [
    ...(['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR'].includes(role)
      ? [{ name: 'Documents', href: lhref('/documents'), icon: FolderOpen }] : []),
    ...(['ADMIN', 'ASSOCIE', 'COMPTABLE'].includes(role)
      ? [{ name: 'Factures', href: lhref('/factures'), icon: FileText }] : []),
    ...(['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR'].includes(role)
      ? [{ name: 'Assistant IA', href: lhref('/ai-assistant'), icon: Sparkles }] : []),
    ...(['ADMIN', 'ASSOCIE'].includes(role)
      ? [{ name: 'Analytics', href: lhref('/analytics'), icon: TrendingUp }] : []),
  ];

  const menuItems: MenuItem[] = [...primaryItems, ...secondaryItems].filter(
    item => canAccessPage(role, item.href)
  );

  const isActive = (item: MenuItem) => {
    if (currentPath === item.href) return true;
    if (item.subItems) {
      return item.subItems.some(sub => currentPath === sub.href || currentPath.startsWith(sub.href + '/'));
    }
    return false;
  };

  const isSubItemActive = (href: string) => {
    return currentPath === href || currentPath.startsWith(href + '/');
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
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.tenantName}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold shadow-sm">
              Plan {user?.tenantPlan}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}




