import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Mail, 
  History, 
  Mic, 
  Settings, 
  LogOut,
  FileText,
  BarChart3
} from 'lucide-react';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Tableau de bord' },
    { path: '/email-composer', icon: Mail, label: 'Composer' },
    { path: '/history', icon: History, label: 'Historique' },
    { path: '/voice', icon: Mic, label: 'Voix' },
    { path: '/document-analysis', icon: FileText, label: 'Documents' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <BarChart3 size={28} />
          <span className="navbar-title">IAPosteManager</span>
        </div>

        <div className="navbar-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar-item ${isActive(item.path)}`}
              title={item.label}
            >
              <item.icon size={20} />
              <span className="navbar-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-user">
          {user && (
            <>
              <div className="user-info">
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.name || 'Utilisateur'}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
              <button 
                onClick={onLogout} 
                className="logout-btn"
                title="Déconnexion"
              >
                <LogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
