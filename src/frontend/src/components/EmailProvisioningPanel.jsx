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
  const [copyMessage, setCopyMessage] = useState('');

  // Charger mes comptes email au chargement
  useEffect(() => {
    loadMyAccounts();
  }, []);

  const loadMyAccounts = async () => {
    try {
      const response = await axios.get('/api/email/my-accounts');
      setMyAccounts(response.data.accounts || []);
    } catch (err) {
      console.error('Erreur chargement comptes:', err);
      setMyAccounts([]);
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

    setError('');
    
    try {
      const response = await axios.post('/api/email/check-availability', {
        username: username.toLowerCase()
      });

      setAvailability(response.data.available);
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Erreur vérification:', err);
      setError('Erreur lors de la vérification de disponibilité');
      setAvailability(null);
    }
  };

  const handleCreateEmail = async (e) => {
    e.preventDefault();
    
    if (!username || !availability) {
      setError('Veuillez saisir un nom d\'utilisateur valide et disponible');
      return;
    }
    
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
        setSuggestions([]);
        loadMyAccounts();
        
        // Afficher les credentials pendant 30 secondes puis masquer
        setTimeout(() => {
          setCreatedAccount(null);
        }, 30000);
      } else {
        setError(response.data.error || 'Erreur lors de la création');
      }
    } catch (err) {
      console.error('Erreur création email:', err);
      const errorMsg = err.response?.data?.error || 'Erreur lors de la création de l\'adresse email';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopyMessage('Copié dans le presse-papiers!');
      setTimeout(() => setCopyMessage(''), 2000);
    }).catch(() => {
      setCopyMessage('Erreur de copie');
      setTimeout(() => setCopyMessage(''), 2000);
    });
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
        
        .copy-message {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          z-index: 1000;
          animation: fadeInOut 2s ease-in-out;
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-20px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        
        /* Accessibility styles */
        .form-control:focus {
          outline: 3px solid #667eea;
          outline-offset: 2px;
        }
        
        .suggestion-chip:focus {
          outline: 3px solid #667eea;
          outline-offset: 2px;
        }
        
        .btn-create:focus {
          outline: 3px solid #ffffff;
          outline-offset: 2px;
        }
        
        .credential-value:focus {
          outline: 3px solid #667eea;
          outline-offset: 2px;
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>

      {copyMessage && (
        <div className="copy-message" role="status" aria-live="polite">{copyMessage}</div>
      )}

      <div className="panel-header">
        <h2 id="email-creation-title">📧 Créer une adresse email</h2>
        <p>Créez des adresses email professionnelles pour votre organisation</p>
      </div>

      <div className="info-box" role="region" aria-labelledby="examples-title">
        <p id="examples-title"><strong>💡 Exemples d'adresses:</strong></p>
        <p>• contact@iapostemanager.com • support@iapostemanager.com • info@iapostemanager.com</p>
      </div>

      {error && (
        <div className="error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {createdAccount && (
        <div className="success-message" role="region" aria-labelledby="success-title">
          <h3 id="success-title">✅ Adresse email créée avec succès!</h3>
          <div className="credentials" role="group" aria-labelledby="credentials-title">
            <div className="sr-only" id="credentials-title">Informations de connexion</div>
            <div className="credential-row">
              <span className="credential-label">Email:</span>
              <button 
                type="button"
                className="credential-value" 
                onClick={() => copyToClipboard(createdAccount.email)}
                aria-label={`Copier l'email ${createdAccount.email}`}
                title="Cliquer pour copier"
              >
                {createdAccount.email}
              </button>
            </div>
            <div className="credential-row">
              <span className="credential-label">Mot de passe:</span>
              <button 
                type="button"
                className="credential-value" 
                onClick={() => copyToClipboard(createdAccount.password)}
                aria-label="Copier le mot de passe"
                title="Cliquer pour copier"
              >
                {createdAccount.password}
              </button>
            </div>
            <div className="credential-row">
              <span className="credential-label">Serveur SMTP:</span>
              <button 
                type="button"
                className="credential-value" 
                onClick={() => copyToClipboard(createdAccount.smtp_server)}
                aria-label={`Copier le serveur SMTP ${createdAccount.smtp_server}`}
                title="Cliquer pour copier"
              >
                {createdAccount.smtp_server}
              </button>
            </div>
            <div className="credential-row">
              <span className="credential-label">Port:</span>
              <button 
                type="button"
                className="credential-value" 
                onClick={() => copyToClipboard(createdAccount.smtp_port)}
                aria-label={`Copier le port ${createdAccount.smtp_port}`}
                title="Cliquer pour copier"
              >
                {createdAccount.smtp_port}
              </button>
            </div>
          </div>
          <p style={{marginTop: '15px', fontSize: '14px', color: '#856404'}}>
            ⚠️ Sauvegardez ces informations maintenant. Elles ne seront plus affichées.
          </p>
        </div>
      )}

      <form onSubmit={handleCreateEmail} className="create-form" aria-labelledby="email-creation-title">
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur</label>
          <div className="input-wrapper">
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="contact, support, info..."
              required
              minLength={3}
              aria-describedby="username-help email-preview"
              aria-invalid={availability === false}
            />
            <div className="sr-only" id="username-help">
              Saisissez au moins 3 caractères pour vérifier la disponibilité
            </div>
            {username && (
              <div className="email-preview" id="email-preview" aria-live="polite">
                {username}@iapostemanager.com
                {availability !== null && (
                  <span className={`availability-badge ${availability ? 'available' : 'unavailable'}`}>
                    {availability ? '✅ Disponible' : '❌ Non disponible'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="suggestions" role="region" aria-labelledby="suggestions-title">
            <p id="suggestions-title">Suggestions alternatives:</p>
            <div className="suggestion-chips" role="group" aria-labelledby="suggestions-title">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => setUsername(suggestion)}
                  aria-label={`Utiliser la suggestion ${suggestion}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="displayName">Nom d'affichage (optionnel)</label>
          <input
            type="text"
            id="displayName"
            className="form-control"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Support Client, Contact, Information..."
            aria-describedby="display-name-help"
          />
          <div className="sr-only" id="display-name-help">
            Nom qui apparaîtra comme expéditeur des emails
          </div>
        </div>

        <button
          type="submit"
          className="btn-create"
          disabled={loading || !availability}
          aria-describedby="create-button-help"
        >
          {loading ? '⏳ Création en cours...' : '🚀 Créer l\'adresse email'}
        </button>
        <div className="sr-only" id="create-button-help">
          {!availability && username ? 'Veuillez choisir un nom d\'utilisateur disponible' : 
           loading ? 'Création de l\'adresse email en cours' : 
           'Créer une nouvelle adresse email avec les informations saisies'}
        </div>
      </form>

      {myAccounts.length > 0 && (
        <div className="my-accounts" role="region" aria-labelledby="accounts-title">
          <h3 id="accounts-title">📬 Mes adresses email ({myAccounts.length})</h3>
          {myAccounts.map((account, index) => (
            <div key={index} className="account-card" role="article" aria-labelledby={`account-${index}-email`}>
              <div className="account-email" id={`account-${index}-email`}>{account.email}</div>
              <div className="account-info">
                Créé le {new Date(account.created_at).toLocaleDateString('fr-FR')} • 
                Status: {account.status} • 
                Emails envoyés: {account.emails_sent_today || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
          color: #0c5460;
        }
        
        .copy-message {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          z-index: 1000;
          animation: fadeInOut 2s ease-in-out;
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-20px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>

      {copyMessage && (
        <div className="copy-message">{copyMessage}</div>
      )}

      <div className="panel-header">
        <h2>📧 Créer une adresse email</h2>
        <p>Créez des adresses email professionnelles pour votre organisation</p>
      </div>

      <div className="info-box">
        <p><strong>💡 Exemples d'adresses:</strong></p>
        <p>• contact@iapostemanager.com • support@iapostemanager.com • info@iapostemanager.com</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {createdAccount && (
        <div className="success-message">
          <h3>✅ Adresse email créée avec succès!</h3>
          <div className="credentials">
            <div className="credential-row">
              <span className="credential-label">Email:</span>
              <span className="credential-value" onClick={() => copyToClipboard(createdAccount.email)}>
                {createdAccount.email}
              </span>
            </div>
            <div className="credential-row">
              <span className="credential-label">Mot de passe:</span>
              <span className="credential-value" onClick={() => copyToClipboard(createdAccount.password)}>
                {createdAccount.password}
              </span>
            </div>
            <div className="credential-row">
              <span className="credential-label">Serveur SMTP:</span>
              <span className="credential-value" onClick={() => copyToClipboard(createdAccount.smtp_server)}>
                {createdAccount.smtp_server}
              </span>
            </div>
            <div className="credential-row">
              <span className="credential-label">Port:</span>
              <span className="credential-value" onClick={() => copyToClipboard(createdAccount.smtp_port)}>
                {createdAccount.smtp_port}
              </span>
            </div>
          </div>
          <p style={{marginTop: '15px', fontSize: '14px', color: '#856404'}}>
            ⚠️ Sauvegardez ces informations maintenant. Elles ne seront plus affichées.
          </p>
        </div>
      )}

      <form onSubmit={handleCreateEmail} className="create-form">
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur</label>
          <div className="input-wrapper">
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="contact, support, info..."
              required
              minLength={3}
            />
            {username && (
              <div className="email-preview">
                {username}@iapostemanager.com
                {availability !== null && (
                  <span className={`availability-badge ${availability ? 'available' : 'unavailable'}`}>
                    {availability ? '✅ Disponible' : '❌ Non disponible'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="suggestions">
            <p>Suggestions alternatives:</p>
            <div className="suggestion-chips">
              {suggestions.map((suggestion, index) => (
                <span
                  key={index}
                  className="suggestion-chip"
                  onClick={() => setUsername(suggestion)}
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="displayName">Nom d'affichage (optionnel)</label>
          <input
            type="text"
            id="displayName"
            className="form-control"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Support Client, Contact, Information..."
          />
        </div>

        <button
          type="submit"
          className="btn-create"
          disabled={loading || !availability}
        >
          {loading ? '⏳ Création en cours...' : '🚀 Créer l\'adresse email'}
        </button>
      </form>

      {myAccounts.length > 0 && (
        <div className="my-accounts">
          <h3>📬 Mes adresses email ({myAccounts.length})</h3>
          {myAccounts.map((account, index) => (
            <div key={index} className="account-card">
              <div className="account-email">{account.email}</div>
              <div className="account-info">
                Créé le {new Date(account.created_at).toLocaleDateString('fr-FR')} • 
                Status: {account.status} • 
                Emails envoyés: {account.emails_sent_today || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
          color: #0c5460;
        }
        
        .copy-message {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          z-index: 1000;
          animation: fadeInOut 2s ease-in-out;
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-20px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>

      {copyMessage && (
        <div className="copy-message">
          ✓ {copyMessage}
        </div>
      )}

      <div className="panel-header">
        <h2>📧 Créer une Adresse Email Professionnelle</h2>
        <p>Créez instantanément des adresses @iapostemanager.com (contact@, support@, etc.)</p>
      </div>

      <div className="info-box">
        <p><strong>💡 Exemples d'adresses IAPosteManager :</strong></p>
        <p>• contact@iapostemanager.com → Email principal de contact</p>
        <p>• support@iapostemanager.com → Service client</p>
        <p>• info@iapostemanager.com → Informations générales</p>
        <p>• noreply@iapostemanager.com → Emails automatiques</p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {createdAccount && (
        <div className="success-message">
          <h3>✅ Adresse Email Créée avec Succès!</h3>
          <p style={{fontSize: '16px', marginBottom: '15px'}}>
            <strong>Email créé:</strong> <span style={{color: '#667eea'}}>{createdAccount.email}</span>
          </p>
          
          <div className="credentials">
            <p style={{marginBottom: '15px'}}><strong>🔐 Configuration SMTP (à sauvegarder maintenant):</strong></p>
            
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
          
          <p style={{marginTop: '15px', fontSize: '13px', color: '#856404', background: '#fff3cd', padding: '10px', borderRadius: '4px', border: '1px solid #ffc107'}}>
            ⚠️ <strong>IMPORTANT:</strong> Sauvegardez ces informations maintenant. Elles ne seront plus affichées après 30 secondes.
          </p>
          
          {createdAccount.webmail && (
            <p style={{marginTop: '15px', padding: '10px', background: '#e7f3ff', borderRadius: '4px'}}>
              <strong>🌐 Accès webmail:</strong>{' '}
              <a 
                href={createdAccount.webmail} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{color: '#667eea', textDecoration: 'underline'}}
              >
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
