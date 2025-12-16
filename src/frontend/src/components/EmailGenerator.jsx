import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import EmailStats from './EmailStats';

export default function EmailGenerator() {
  const [templates, setTemplates] = useState({});
  const [activeEmails, setActiveEmails] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const [customName, setCustomName] = useState('');
  const [duration, setDuration] = useState(24);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadActiveEmails();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await apiService.get('/api/email-generator/templates');
      if (response.success) {
        setTemplates(response.templates);
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    }
  };

  const loadActiveEmails = async () => {
    try {
      const response = await apiService.get('/api/email-generator/list');
      if (response.success) {
        setActiveEmails(response.emails);
      }
    } catch (error) {
      console.error('Erreur chargement emails:', error);
    }
  };

  const createEmail = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await apiService.post('/api/email-generator/create', {
        purpose: selectedTemplate,
        duration_hours: duration,
        custom_name: customName.trim() || null
      });

      if (response.success) {
        alert(`✅ Adresse créée: ${response.email_data.email}`);
        setCustomName('');
        loadActiveEmails();
      } else {
        alert(`❌ Erreur: ${response.error}`);
      }
    } catch (error) {
      console.error('Erreur création email:', error);
      alert('❌ Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const deactivateEmail = async (email) => {
    if (!confirm(`Désactiver ${email} ?`)) return;

    try {
      const response = await apiService.post('/api/email-generator/deactivate', { email });
      if (response.success) {
        alert('✅ Email désactivé');
        loadActiveEmails();
      } else {
        alert(`❌ Erreur: ${response.error}`);
      }
    } catch (error) {
      console.error('Erreur désactivation:', error);
      alert('❌ Erreur lors de la désactivation');
    }
  };

  const extendEmail = async (email, hours = 24) => {
    try {
      const response = await apiService.post('/api/email-generator/extend', {
        email,
        additional_hours: hours
      });
      
      if (response.success) {
        alert(`✅ Email prolongé de ${hours}h`);
        loadActiveEmails();
      } else {
        alert(`❌ Erreur: ${response.error}`);
      }
    } catch (error) {
      console.error('Erreur prolongation:', error);
      alert('❌ Erreur lors de la prolongation');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('📋 Copié dans le presse-papiers');
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('fr-FR');
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expiré';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="email-generator">
      <h2>📧 Générateur d'Adresses Email</h2>
      
      {/* Création d'email */}
      <div className="create-section">
        <h3>Créer une nouvelle adresse</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Type d'adresse :</label>
            <select 
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {Object.entries(templates).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Durée (heures) :</label>
            <input
              type="number"
              min="1"
              max="168"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Nom personnalisé (optionnel) :</label>
          <input
            type="text"
            placeholder="ex: monprojet, support2024..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            pattern="[a-zA-Z0-9_-]+"
            title="Lettres, chiffres, _ et - seulement"
          />
        </div>
        
        <button 
          onClick={createEmail}
          disabled={loading}
          className="create-button"
        >
          {loading ? '⏳ Création...' : '✨ Créer l\'adresse'}
        </button>
      </div>

      {/* Liste des emails actifs */}
      <div className="active-emails">
        <h3>Adresses actives ({activeEmails.length})</h3>
        
        {activeEmails.length === 0 ? (
          <p className="no-emails">Aucune adresse active</p>
        ) : (
          <div className="emails-list">
            {activeEmails.map((emailData) => (
              <div key={emailData.email} className="email-card">
                <div className="email-header">
                  <strong 
                    className="email-address"
                    onClick={() => copyToClipboard(emailData.email)}
                    title="Cliquer pour copier"
                  >
                    📧 {emailData.email}
                  </strong>
                  <span className="email-purpose">{emailData.purpose}</span>
                </div>
                
                <div className="email-info">
                  <div className="info-row">
                    <span>⏰ Expire dans: {getTimeRemaining(emailData.expires_at)}</span>
                    <span>📊 Utilisations: {emailData.usage_count}</span>
                  </div>
                  <div className="info-row">
                    <span>📅 Créé: {formatDate(emailData.created_at)}</span>
                    <span>🔄 Transfert: {emailData.forwarding_enabled ? 'Activé' : 'Désactivé'}</span>
                  </div>
                </div>
                
                <div className="email-actions">
                  <button 
                    onClick={() => copyToClipboard(emailData.email)}
                    className="copy-button"
                    title="Copier l'adresse"
                  >
                    📋
                  </button>
                  
                  <button 
                    onClick={() => extendEmail(emailData.email, 24)}
                    className="extend-button"
                    title="Prolonger de 24h"
                  >
                    ⏰ +24h
                  </button>
                  
                  <button 
                    onClick={() => extendEmail(emailData.email, 72)}
                    className="extend-button"
                    title="Prolonger de 72h"
                  >
                    ⏰ +72h
                  </button>
                  
                  <button 
                    onClick={() => deactivateEmail(emailData.email)}
                    className="deactivate-button"
                    title="Désactiver"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistiques */}
      <EmailStats />

      {/* Informations */}
      <div className="info-section">
        <h3>ℹ️ Informations</h3>
        <ul>
          <li>🌐 Domaine: iaposte.cloud</li>
          <li>📬 Transfert automatique vers votre email principal</li>
          <li>⏰ Durée maximale: 7 jours (168h)</li>
          <li>🔒 Suppression automatique après expiration</li>
          <li>📊 Statistiques d'utilisation disponibles</li>
        </ul>
      </div>

      <style jsx>{`
        .email-generator {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }

        .create-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .form-row {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .form-group {
          flex: 1;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .create-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        }

        .create-button:hover {
          background: #0056b3;
        }

        .create-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .emails-list {
          display: grid;
          gap: 15px;
        }

        .email-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background: white;
        }

        .email-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .email-address {
          cursor: pointer;
          color: #007bff;
          font-family: monospace;
        }

        .email-address:hover {
          text-decoration: underline;
        }

        .email-purpose {
          background: #e9ecef;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          text-transform: uppercase;
        }

        .email-info {
          margin-bottom: 15px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 14px;
          color: #666;
        }

        .email-actions {
          display: flex;
          gap: 8px;
        }

        .email-actions button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .copy-button {
          background: #28a745;
          color: white;
        }

        .extend-button {
          background: #ffc107;
          color: black;
        }

        .deactivate-button {
          background: #dc3545;
          color: white;
        }

        .no-emails {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 40px;
        }

        .info-section {
          background: #e9ecef;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
        }

        .info-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .info-section li {
          margin-bottom: 8px;
        }

        .email-stats {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #dee2e6;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}