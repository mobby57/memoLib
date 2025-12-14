import React, { useState } from 'react';
import { authService } from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    emailProvider: 'gmail',
    aiProvider: 'openai',
    voiceEnabled: true,
    accessibilityMode: false,
    notifications: true
  });

  const handleSave = async () => {
    try {
      // Sauvegarder les paramètres
      localStorage.setItem('app_settings', JSON.stringify(settings));
      alert('Paramètres sauvegardés !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('isAuthenticated');
      window.location.reload();
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  return (
    <div className="settings-page">
      <h1>⚙️ Paramètres</h1>

      <div className="settings-sections">
        
        {/* Configuration Email */}
        <div className="settings-section">
          <h3>📧 Configuration Email</h3>
          <div className="form-group">
            <label>Fournisseur :</label>
            <select 
              value={settings.emailProvider}
              onChange={(e) => setSettings(prev => ({ ...prev, emailProvider: e.target.value }))}
            >
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>
        </div>

        {/* Configuration IA */}
        <div className="settings-section">
          <h3>🤖 Configuration IA</h3>
          <div className="form-group">
            <label>Fournisseur IA :</label>
            <select 
              value={settings.aiProvider}
              onChange={(e) => setSettings(prev => ({ ...prev, aiProvider: e.target.value }))}
            >
              <option value="openai">OpenAI</option>
              <option value="local">IA Locale</option>
            </select>
          </div>
        </div>

        {/* Accessibilité */}
        <div className="settings-section">
          <h3>♿ Accessibilité</h3>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, voiceEnabled: e.target.checked }))}
              />
              Interface vocale activée
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings.accessibilityMode}
                onChange={(e) => setSettings(prev => ({ ...prev, accessibilityMode: e.target.checked }))}
              />
              Mode haute accessibilité
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <h3>🔔 Notifications</h3>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
              />
              Notifications activées
            </label>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="settings-actions">
        <button onClick={handleSave} className="save-button">
          💾 Sauvegarder
        </button>
        
        <button onClick={handleLogout} className="logout-button">
          🚪 Déconnexion
        </button>
      </div>

      {/* Informations système */}
      <div className="system-info">
        <h3>ℹ️ Informations Système</h3>
        <ul>
          <li>Version : 3.0.0</li>
          <li>Backend : FastAPI</li>
          <li>Frontend : React</li>
          <li>Base de données : PostgreSQL</li>
        </ul>
      </div>
    </div>
  );
}