'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Users, DollarSign, Calendar, Settings, Zap } from 'lucide-react';

interface Command {
  id: string;
  label?: string;
  title?: string;
  description?: string;
  icon: React.ComponentType<any>;
  action?: () => void;
  url?: string;
  href?: string;
  category?: string;
}

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  items?: Command[];
}

export function useCommandPalette() {
  return { open: () => {} };
}

export function CommandPalette({ isOpen: externalIsOpen, onClose, items }: CommandPaletteProps = {}) {
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  const commands: Command[] = items || [
    {
      id: 'new-dossier',
      label: 'Nouveau Dossier',
      description: 'Creer un nouveau dossier client',
      icon: FileText,
      action: () => router.push('/dossiers/nouveau'),
      category: 'Actions'
    },
    {
      id: 'new-client',
      label: 'Nouveau Client',
      description: 'Ajouter un nouveau client',
      icon: Users,
      action: () => router.push('/clients'),
      category: 'Actions'
    },
    {
      id: 'new-facture',
      label: 'Nouvelle Facture',
      description: 'Creer une nouvelle facture',
      icon: DollarSign,
      action: () => router.push('/factures'),
      category: 'Actions'
    },
    {
      id: 'calendar',
      label: 'Calendrier',
      description: 'Voir le calendrier des echeances',
      icon: Calendar,
      action: () => router.push('/calendrier'),
      category: 'Navigation'
    },
    {
      id: 'advanced',
      label: 'IA Avancee',
      description: 'Fonctionnalites IA avancees',
      icon: Zap,
      action: () => router.push('/advanced'),
      category: 'IA'
    },
    {
      id: 'settings',
      label: 'Parametres',
      description: 'Configuration du cabinet',
      icon: Settings,
      action: () => router.push('/settings'),
      category: 'Navigation'
    }
  ];

  const filteredCommands = commands.filter(cmd =>
    (cmd.label || cmd.title || '').toLowerCase().includes(query.toLowerCase()) ||
    (cmd.description || '').toLowerCase().includes(query.toLowerCase())
  );

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!externalIsOpen) {
          setIsOpen(true);
        }
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [externalIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une action..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
              echap
            </kbd>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Aucune action trouvee
            </div>
          ) : (
            filteredCommands.map((command) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.id}
                  onClick={() => {
                    if (command.action) {
                      command.action();
                    } else if (command.url || command.href) {
                      router.push(command.url || command.href || '/');
                    }
                    handleClose();
                    setQuery('');
                  }}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {command.label || command.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {command.description}
                      </div>
                    </div>
                    <div className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {command.category}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
          Utilisez K (Ctrl+K) pour ouvrir rapidement
        </div>
      </div>
    </div>
  );
}
