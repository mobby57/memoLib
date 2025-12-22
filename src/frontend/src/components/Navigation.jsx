import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from './Icons';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'chart', label: 'Tableau de bord' },
    { path: '/inbox', icon: 'inbox', label: 'Boîte de réception' },
    { path: '/compose', icon: 'edit', label: 'Composer' },
    { path: '/email-generator', icon: 'bot', label: 'Générateur IA' },
    { path: '/voice', icon: 'mic', label: 'Assistant vocal' },
    { path: '/templates', icon: 'file', label: 'Modèles' },
    { path: '/history', icon: 'clock', label: 'Historique' },
    { path: '/contacts', icon: 'users', label: 'Contacts' },
    { path: '/settings', icon: 'settings', label: 'Paramètres' },
    { path: '/accessibility', icon: 'accessibility', label: 'Accessibilité' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h2><Icon name="mail" size={24} /> IAPosteManager</h2>
      </div>
      
      <ul className="nav-menu">
        {navItems.map(item => (
          <li key={item.path}>
            <Link 
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="nav-icon"><Icon name={item.icon} size={20} /></span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-footer">
        <button className="logout-btn">
          <Icon name="external" size={16} /> Déconnexion
        </button>
      </div>
    </nav>
  );
}