'use client';

import { useSession } from 'next-auth/react';
import { Bell, User, Search } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher dossier, client..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6 ml-6">
        {/* Notifications */}
        <button className="relative text-slate-600 hover:text-slate-900 transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right text-sm">
            <p className="font-medium text-slate-900">{session?.user?.name || 'User'}</p>
            <p className="text-slate-500">{session?.user?.email}</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold hover:bg-blue-200 transition-colors">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
