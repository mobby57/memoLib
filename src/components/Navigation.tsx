'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import NavigationSearchButton from '@/components/NavigationSearchButton';
import { 
  Building, 
  Users, 
  FileText, 
  DollarSign, 
  Settings, 
  Home,
  Shield,
  Database,
  Activity,
  Calendar,
  MessageSquare,
  Euro,
  User,
  Menu,
  X
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
  badge?: string;
}

const navigationItems: NavItem[] = [
  // Super Admin
  {
    label: 'Dashboard Global',
    href: '/super-admin',
    icon: Shield,
    roles: ['SUPER_ADMIN']
  },
  {
    label: 'Gestion Cabinets',
    href: '/super-admin/tenants',
    icon: Building,
    roles: ['SUPER_ADMIN']
  },
  {
    label: 'Analytics Plateforme',
    href: '/super-admin/analytics',
    icon: Activity,
    roles: ['SUPER_ADMIN']
  },
  {
    label: 'Systeme',
    href: '/super-admin/system',
    icon: Database,
    roles: ['SUPER_ADMIN']
  },

  // Admin (Avocat)
  {
    label: 'Dashboard Cabinet',
    href: '/dashboard',
    icon: Home,
    roles: ['ADMIN']
  },
  {
    label: 'Dossiers',
    href: '/dossiers',
    icon: FileText,
    roles: ['ADMIN']
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: Users,
    roles: ['ADMIN']
  },
  {
    label: 'Factures',
    href: '/factures',
    icon: DollarSign,
    roles: ['ADMIN']
  },
  {
    label: 'Rendez-vous',
    href: '/rendez-vous',
    icon: Calendar,
    roles: ['ADMIN']
  },
  {
    label: 'Administration',
    href: '/admin',
    icon: Settings,
    roles: ['ADMIN']
  },

  // Client
  {
    label: 'Mon Espace',
    href: '/client-dashboard',
    icon: User,
    roles: ['CLIENT']
  },
  {
    label: 'Mon Dossier',
    href: '/mon-dossier',
    icon: FileText,
    roles: ['CLIENT']
  },
  {
    label: 'Mes Factures',
    href: '/mes-factures',
    icon: Euro,
    roles: ['CLIENT']
  },
  {
    label: 'Contact',
    href: '/contact',
    icon: MessageSquare,
    roles: ['CLIENT']
  }
];

export function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  // Filtrer les elements de navigation selon le role
  const allowedItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/client-dashboard' || href === '/super-admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
        w-64 flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              memoLib
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.role === 'SUPER_ADMIN' && 'Super Admin'}
              {user.role === 'ADMIN' && user.tenantName}
              {user.role === 'CLIENT' && 'Espace Client'}
            </p>
          </div>
        </div>
        {/* Recherche globale */}
        <NavigationSearchButton />
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
        
        {/* Role BonClick={() => setMobileMenuOpen(false)}
                  adge */}
        <div className="mt-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            user.role === 'SUPER_ADMIN' 
              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : user.role === 'ADMIN'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }`}>
            {user.role === 'SUPER_ADMIN' && 'Super Administrateur'}
            {user.role === 'ADMIN' && 'Administrateur Cabinet'}
            {user.role === 'CLIENT' && 'Client'}
          </span>
        </div>
      </div>

      {/* Navigation Items - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-900">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          Se deconnecter
        </Link>
      </div>
      </nav>
    </>
  );
}
