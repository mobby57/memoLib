import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Composant pour créer des adresses email génériques
 * Permet aux utilisateurs de créer contact@domaine.com, support@domaine.com, etc.
 */
export default function EmailProvisioningPanel() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [availability, setAvailability] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myAccounts, setMyAccounts] = useState([]);
  const [createdAccount, setCreatedAccount] = useState(null);
  const [error, setError] = useState('');

  // Charger mes comptes email au chargement
  useEffect(() => {
    loadMyAccounts();
  }, []);

  const loadMyAccounts = async () => {
    try {
      const response = await axios.get('/api/email/my-accounts');
      setMyAccounts(response.data.accounts);
    } catch (err) {
      console.error('Erreur chargement comptes:', err);
    }
  };

  // Vérifier disponibilité en temps réel
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        checkAvailability();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const checkAvailability = async () => {
    if (!username) return;

    try {
      const response = await axios.post('/api/email/check-availability', {
        username: username.toLowerCase()
      });

      setAvailability(response.data.available);
      setSuggestions(response.data.suggestions || []);
      setError('');
    } catch (err) {
      setError('Erreur lors de la vérification');
    }
  };

  const handleCreateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/email/create', {
        username: username.toLowerCase(),
        display_name: displayName || username
      });

      if (response.data.success) {
        setCreatedAccount(response.data);
        setUsername('');
        setDisplayName('');
        setAvailability(null);
        loadMyAccounts();
        
        // Afficher les credentials pendant 30 secondes puis masquer
        setTimeout(() => {
          setCreatedAccount(null);
        }, 30000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copié dans le presse-papiers!');
  };

  return (
    <div className="email-provisioning-panel">
      <style>{`
        .email-provisioning-panel {
          max-width: 800px;
          margin: 40px auto;
          padding: 30px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .panel-header {
          margin-bottom: 30px;
        }
        
        .panel-header h2 {
          color: #667eea;
          margin-bottom: 10px;
        }
        
        .panel-header p {
          color: #666;
        }
        
        .create-form {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .form-control {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        
        .form-control:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .email-preview {
          margin-top: 8px;
          font-size: 14px;
          color: #667eea;
          font-weight: 500;
        }
        
        .availability-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 10px;
        }
        
        .available {
          background: #d4edda;
          color: #155724;
        }
        
        .unavailable {
          background: #f8d7da;
          color: #721c24;
        }
        
        .suggestions {
          margin-top: 15px;
        }
        
        .suggestions p {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        
        .suggestion-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .suggestion-chip {
          padding: 8px 15px;
          background: white;
          border: 2px solid #667eea;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }
        
        .suggestion-chip:hover {
          background: #667eea;
          color: white;
        }
        
        .btn-create {
          width: 100%;
          padding: 15px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .btn-create:hover:not(:disabled) {
          background: #5568d3;
        }
        
        .btn-create:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .success-message {
          background: #d4edda;
          border: 2px solid #28a745;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .success-message h3 {
          color: #155724;
          margin-bottom: 15px;
        }
        
        .credentials {
          background: white;
          padding: 15px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }
        
        .credential-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
        
        .credential-label {
          font-weight: 600;
          color: #333;
        }
        
        .credential-value {
          color: #667eea;
          cursor: pointer;
        }
        
        .credential-value:hover {
          text-decoration: underline;
        }
        
        .my-accounts {
          margin-top: 40px;
        }
        
        .my-accounts h3 {
          color: #333;
          margin-bottom: 20px;
        }
        
        .account-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 15px;
          border-left: 4px solid #667eea;
        }
        
        .account-email {
          font-size: 18px;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 8px;
        }
        
        .account-info {
          font-size: 14px;
          color: #666;
        }
        
        .error-message {
          background: #f8d7da;
          border: 2px solid #dc3545;
          color: #721c24;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .info-box {
          background: #d1ecf1;
          border-left: 4px solid #17a2b8;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .info-box p {
          margin: 5px 0;
          color: #0c5460;
        }
      `}</style>

      <div className="panel-header">
        <h2>📧 Créer une Adresse Email Générique</h2>
        <p>Créez instantanément des adresses professionnelles (contact@, support@, etc.)</p>
      </div>

      <div className="info-box">
        <p><strong>💡 Exemples d'utilisation :</strong></p>
        <p>• contact@ → Email principal de contact</p>
        <p>• support@ → Service client</p>
        <p>• info@ → Informations générales</p>
        <p>• noreply@ → Emails automatiques</p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {createdAccount && (
        <div className="success-message">
          <h3>✅ Adresse Email Créée avec Succès!</h3>
          <p><strong>Email:</strong> {createdAccount.email}</p>
          
          <div className="credentials">
            <p><strong>Configuration SMTP (à sauvegarder):</strong></p>
            
            <div className="credential-row">
              <span className="credential-label">Serveur SMTP:</span>
              <span 
                className="credential-value"
                onClick={() => copyToClipboard(createdAccount.credentials.smtp_server)}
              >
                {createdAccount.credentials.smtp_server} 📋
              </span>
            </div>
            
            <div className="credential-row">
              <span className="credential-label">Port:</span>
              <span 
                className="credential-value"
                onClick={() => copyToClipboard(createdAccount.credentials.smtp_port.toString())}
              >
                {createdAccount.credentials.smtp_port} 📋
              </span>
            </div>
            
            <div className="credential-row">
              <span className="credential-label">Username:</span>
              <span 
                className="credential-value"
                onClick={() => copyToClipboard(createdAccount.credentials.smtp_username)}
              >
                {createdAccount.credentials.smtp_username} 📋
              </span>
            </div>
            
            <div className="credential-row">
              <span className="credential-label">Password:</span>
              <span 
                className="credential-value"
                onClick={() => copyToClipboard(createdAccount.credentials.smtp_password)}
              >
                ••••••••••••••••  📋 (cliquer pour copier)
              </span>
            </div>
          </div>
          
          <p style={{marginTop: '15px', fontSize: '14px', color: '#856404'}}>
            ⚠️ Sauvegardez ces informations maintenant. Elles ne seront plus affichées.
          </p>
          
          {createdAccount.webmail && (
            <p style={{marginTop: '10px'}}>
              <strong>Accès webmail:</strong>{' '}
              <a href={createdAccount.webmail} target="_blank" rel="noopener noreferrer">
                {createdAccount.webmail}
              </a>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleCreateEmail} className="create-form">
        <div className="form-group">
          <label htmlFor="username">
            Nom d'utilisateur *
            {availability !== null && (
              <span className={`availability-badge ${availability ? 'available' : 'unavailable'}`}>
                {availability ? '✓ Disponible' : '✗ Indisponible'}
              </span>
            )}
          </label>
          <div className="input-wrapper">
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
              placeholder="contact, support, info..."
              required
              minLength={3}
              maxLength={20}
            />
          </div>
          {username && (
            <div className="email-preview">
              📧 {username}@iapostemanager.com
            </div>
          )}
          
          {!availability && suggestions.length > 0 && (
            <div className="suggestions">
              <p>💡 Suggestions disponibles :</p>
              <div className="suggestion-chips">
                {suggestions.map((suggestion) => (
                  <span
                    key={suggestion}
                    className="suggestion-chip"
                    onClick={() => setUsername(suggestion)}
                  >
                    {suggestion}@iapostemanager.com
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="displayName">Nom d'affichage</label>
          <input
            type="text"
            id="displayName"
            className="form-control"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Support Client, Contact Général..."
          />
        </div>

        <button
          type="submit"
          className="btn-create"
          disabled={loading || !availability || !username}
        >
          {loading ? '⏳ Création en cours...' : '✉️ Créer l\'adresse email'}
        </button>
      </form>

      {myAccounts.length > 0 && (
        <div className="my-accounts">
          <h3>📬 Mes Adresses Email ({myAccounts.length})</h3>
          {myAccounts.map((account) => (
            <div key={account.email} className="account-card">
              <div className="account-email">{account.email}</div>
              <div className="account-info">
                {account.display_name} • Créé le {new Date(account.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
