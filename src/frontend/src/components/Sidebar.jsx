import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  Send, 
  Settings, 
  Clock, 
  FileText, 
  Sparkles,
  Mail,
  Users,
  Inbox,
  Wand2,
  Mic,
  Accessibility as AccessibilityIcon,
  Globe,
  Building2
} from 'lucide-react';

const navigation = [
  { name: 'nav.dashboard', href: '/', icon: Home },
  { name: 'nav.send', href: '/send', icon: Send },
  { name: 'nav.inbox', href: '/inbox', icon: Inbox },
  { name: 'nav.multimodal', href: '/ai-multimodal', icon: Wand2 },
  { name: 'nav.contacts', href: '/contacts', icon: Users },
  { name: 'nav.history', href: '/history', icon: Clock },
  { name: 'nav.templates', href: '/templates', icon: FileText },
  { name: 'nav.voice', href: '/voice-transcription', icon: Mic },
  { name: 'nav.accessibility', href: '/accessibility', icon: AccessibilityIcon },
  { name: 'admin.title', href: '/french-admin', icon: Building2 },
  { name: 'nav.config', href: '/config', icon: Settings },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Mail className="w-8 h-8 text-primary-600" />
        <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          IAPosteManager
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : ''}`} />
                {t(item.name)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Language Selector */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="bm">🇲🇱 Bambara</option>
          </select>
        </div>
      </div>

      {/* Version */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Version 3.3.0
        </div>
      </div>
    </div>
  );
}
