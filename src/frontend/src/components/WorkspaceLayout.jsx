import React from 'react';
import { 
  HomeIcon, 
  EnvelopeIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CogIcon,
  UserIcon,
  BellIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import '../styles/workspace-concept.css';

const WorkspaceLayout = ({ children, currentPage = 'dashboard' }) => {
  const navigationItems = [
    {
      section: 'Principal',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: HomeIcon, href: '/' },
        { id: 'email-generator', label: 'Générateur IA', icon: SparklesIcon, href: '/generate' },
        { id: 'templates', label: 'Templates', icon: DocumentTextIcon, href: '/templates' },
        { id: 'history', label: 'Historique', icon: EnvelopeIcon, href: '/history' }
      ]
    },
    {
      section: 'Analytics',
      items: [
        { id: 'analytics', label: 'Statistiques', icon: ChartBarIcon, href: '/analytics' },
        { id: 'performance', label: 'Performance', icon: ChartBarIcon, href: '/performance' }
      ]
    },
    {
      section: 'Configuration',
      items: [
        { id: 'settings', label: 'Paramètres', icon: CogIcon, href: '/settings' },
        { id: 'profile', label: 'Profil', icon: UserIcon, href: '/profile' }
      ]
    }
  ];

  return (
    <div className="workspace-container">
      <div className="workspace-grid">
        
        {/* Header */}
        <header className="workspace-header">
          <div className="header-brand">
            <div className="logo">IA</div>
            <span>Poste Manager</span>
            <span className="badge badge-info">v4.0</span>
          </div>

          <div className="header-search">
            <MagnifyingGlassIcon className="search-icon" width={16} height={16} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="search-input"
            />
          </div>

          <div className="header-actions">
            <button className="btn btn-secondary">
              <BellIcon width={16} height={16} />
              Notifications
            </button>
            <button className="btn btn-primary">
              <SparklesIcon width={16} height={16} />
              Nouveau
            </button>
          </div>
        </header>

        {/* Sidebar */}
        <aside className="workspace-sidebar">
          <nav className="sidebar-nav">
            {navigationItems.map((section) => (
              <div key={section.section} className="nav-section">
                <h3 className="nav-section-title">{section.section}</h3>
                {section.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                  >
                    <item.icon className="nav-icon" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="workspace-main">
          <div className="main-content animate-slide-up">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default WorkspaceLayout;