import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  InboxIcon,
  PencilIcon, 
  SparklesIcon, 
  MicrophoneIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  CogIcon,
  EyeIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Boîte de réception', href: '/inbox', icon: InboxIcon },
  { name: 'Composer', href: '/compose', icon: PencilIcon },
  { name: 'Générateur IA', href: '/email-generator', icon: SparklesIcon },
  { name: 'Assistant vocal', href: '/voice', icon: MicrophoneIcon },
  { name: 'Modèles', href: '/templates', icon: DocumentTextIcon },
  { name: 'Historique', href: '/history', icon: ClockIcon },
  { name: 'Contacts', href: '/contacts', icon: UserGroupIcon },
  { name: 'Paramètres', href: '/settings', icon: CogIcon },
  { name: 'Accessibilité', href: '/accessibility', icon: EyeIcon },
];

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-48'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IA</span>
              </div>
            </div>
            {isOpen && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">IAPosteManager</h1>
                <p className="text-xs text-gray-500">v2.2 Production</p>
              </div>
            )}
          </div>
          
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {isOpen && item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Status indicator */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="ml-2 text-xs text-gray-500">API connectée</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}