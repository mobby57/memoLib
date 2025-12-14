import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/compose', icon: '✍️', label: 'Composer' },
    { path: '/voice', icon: '🎤', label: 'Vocal' },
    { path: '/accessibility', icon: '♿', label: 'Accessible' },
    { path: '/settings', icon: '⚙️', label: 'Paramètres' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h2>📧 IAPosteManager</h2>
      </div>
      
      <ul className="nav-menu">
        {navItems.map(item => (
          <li key={item.path}>
            <Link 
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-footer">
        <button className="logout-btn">
          🚪 Déconnexion
        </button>
      </div>
    </nav>
  );
}