'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  FileText,
  DollarSign,
  MessageSquare,
  CheckCircle,
  Calendar,
  LogOut,
  Settings
} from 'lucide-react';

const sidebarItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dossiers', label: 'Dossiers', icon: FolderOpen },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/factures', label: 'Factures', icon: DollarSign },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/tasks', label: 'Tâches', icon: CheckCircle },
  { href: '/calendar', label: 'Agenda', icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">MemoLib</h1>
        <p className="text-sm text-slate-400">Legal Practice Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 p-3 space-y-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Settings size={20} />
          <span>Paramètres</span>
        </Link>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          onClick={() => {
            // TODO: Implement logout
            console.log('Logout clicked');
          }}
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
