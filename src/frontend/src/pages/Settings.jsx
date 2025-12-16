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
          
          <div className="email-generator-section" style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f0f8ff',
            borderRadius: '8px',
            borderLeft: '4px solid #007bff'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>🌐 Générateur d'Adresses Email</h4>
            <p style={{ margin: '10px 0', color: '#666' }}>Créez des adresses email temporaires directement depuis le cloud :</p>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li style={{ margin: '5px 0', color: '#555' }}>✨ Génération instantanée</li>
              <li style={{ margin: '5px 0', color: '#555' }}>⏰ Durée personnalisable (1h à 7 jours)</li>
              <li style={{ margin: '5px 0', color: '#555' }}>📬 Transfert automatique vers votre email principal</li>
              <li style={{ margin: '5px 0', color: '#555' }}>🗑️ Suppression automatique après expiration</li>
            </ul>
            <button 
              onClick={() => window.location.href = '/email-generator'}
              style={{
                background: 'linear-gradient(45deg, #007bff, #0056b3)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginTop: '10px'
              }}
            >
              🚀 Accéder au Générateur
            </button>
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
          <li>Backend : Flask</li>
          <li>Frontend : React</li>
          <li>Base de données : SQLite</li>
          <li>Générateur Email : Actif</li>
        </ul>
      </div>
    </div>
  );
}