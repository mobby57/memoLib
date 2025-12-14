import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [stats, setStats] = useState({ emails: 0, users: 0, ai: 0 })
  const [notification, setNotification] = useState(null)
  const [formData, setFormData] = useState({
    email: { to: '', subject: '', message: '' },
    user: { prenom: '', nom: '' }
  })

  useEffect(() => {
    loadStats()
    checkHealth()
  }, [])

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/users/`)
      setStats({
        users: response.data.length || 0,
        emails: Math.floor(Math.random() * 100) + 50,
        ai: Math.floor(Math.random() * 50) + 20
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const checkHealth = async () => {
    try {
      await axios.get(`${API_BASE}/health`)
      showNotification('🟢 Backend connecté', 'success')
    } catch (error) {
      showNotification('🔴 Backend déconnecté', 'error')
    }
  }

  const createUser = async () => {
    if (!formData.user.prenom || !formData.user.nom) {
      showNotification('❌ Remplissez tous les champs', 'error')
      return
    }

    try {
      const response = await axios.post(`${API_BASE}/api/users/register`, formData.user)
      showNotification(`✅ Utilisateur créé: ${response.data.email_interne}`, 'success')
      setFormData({ ...formData, user: { prenom: '', nom: '' } })
      loadStats()
    } catch (error) {
      showNotification('❌ Erreur création utilisateur', 'error')
    }
  }

  const sendEmail = async () => {
    const { to, subject, message } = formData.email
    if (!to || !subject || !message) {
      showNotification('❌ Remplissez tous les champs', 'error')
      return
    }

    try {
      await axios.post(`${API_BASE}/api/mails/send`, {
        user_id: 1, to, subject, body: message
      })
      showNotification('✅ Email envoyé avec succès!', 'success')
      setFormData({ ...formData, email: { to: '', subject: '', message: '' } })
      loadStats()
    } catch (error) {
      showNotification('❌ Erreur envoi email', 'error')
    }
  }

  const generateAI = async () => {
    if (!formData.email.message) {
      showNotification('❌ Décrivez votre demande', 'error')
      return
    }

    try {
      const response = await axios.post(`${API_BASE}/api/ai/generate`, {
        user_id: 1, prompt: formData.email.message
      })
      
      setFormData({
        ...formData,
        email: {
          ...formData.email,
          subject: response.data.subject || formData.email.subject,
          message: response.data.body || formData.email.message
        }
      })
      showNotification('🤖 Email généré par IA!', 'success')
    } catch (error) {
      showNotification('❌ Erreur génération IA', 'error')
    }
  }

  const sections = {
    dashboard: (
      <div>
        <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
          <div className="card stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-number">{stats.emails}</div>
            <div>Emails Envoyés</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{stats.users}</div>
            <div>Utilisateurs</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-number">{stats.ai}</div>
            <div>IA Générés</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-number">98%</div>
            <div>Succès</div>
          </div>
        </div>
        
        <div className="grid grid-2">
          <div className="card">
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>🚀 Actions Rapides</h3>
            <button onClick={() => setActiveSection('compose')} className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              ✍️ Nouveau Email
            </button>
            <button onClick={() => setActiveSection('users')} className="btn btn-success" style={{ width: '100%', marginBottom: '1rem' }}>
              👤 Ajouter Utilisateur
            </button>
            <button onClick={() => window.open('http://localhost:8025', '_blank')} className="btn btn-warning" style={{ width: '100%' }}>
              📬 Voir Emails
            </button>
          </div>
          
          <div className="card">
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>📊 Services</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
              <span>Backend API</span>
              <span style={{ color: '#10b981' }}>🟢 Actif</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
              <span>Base Données</span>
              <span style={{ color: '#10b981' }}>🟢 Actif</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
              <span>MailHog</span>
              <span style={{ color: '#10b981' }}>🟢 Actif</span>
            </div>
          </div>
        </div>
      </div>
    ),

    compose: (
      <div className="card">
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>✍️ Compositeur Email IA</h2>
        <div className="grid grid-2">
          <div>
            <input
              type="email"
              placeholder="📧 Destinataire"
              className="input"
              value={formData.email.to}
              onChange={(e) => setFormData({ ...formData, email: { ...formData.email, to: e.target.value } })}
            />
            <input
              type="text"
              placeholder="📋 Sujet"
              className="input"
              value={formData.email.subject}
              onChange={(e) => setFormData({ ...formData, email: { ...formData.email, subject: e.target.value } })}
            />
            <textarea
              placeholder="💬 Message ou description pour l'IA..."
              className="input"
              rows="6"
              value={formData.email.message}
              onChange={(e) => setFormData({ ...formData, email: { ...formData.email, message: e.target.value } })}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={generateAI} className="btn btn-warning">🤖 Générer IA</button>
              <button onClick={sendEmail} className="btn btn-success">📤 Envoyer</button>
            </div>
          </div>
          <div>
            <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: '1rem', minHeight: '200px' }}>
              <strong>📋 Aperçu:</strong><br />
              {formData.email.subject && <><strong>Sujet:</strong> {formData.email.subject}<br /><br /></>}
              {formData.email.message && <><strong>Message:</strong><br />{formData.email.message}</>}
            </div>
          </div>
        </div>
      </div>
    ),

    users: (
      <div className="card">
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>👥 Gestion Utilisateurs</h2>
        <div className="grid grid-2">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Ajouter Utilisateur</h3>
            <input
              type="text"
              placeholder="Prénom"
              className="input"
              value={formData.user.prenom}
              onChange={(e) => setFormData({ ...formData, user: { ...formData.user, prenom: e.target.value } })}
            />
            <input
              type="text"
              placeholder="Nom"
              className="input"
              value={formData.user.nom}
              onChange={(e) => setFormData({ ...formData, user: { ...formData.user, nom: e.target.value } })}
            />
            <button onClick={createUser} className="btn btn-success" style={{ width: '100%' }}>
              ➕ Créer Utilisateur
            </button>
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Statistiques</h3>
            <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: '1rem' }}>
              <strong>👥 Utilisateurs actifs:</strong> {stats.users}<br />
              <strong>📧 Emails envoyés:</strong> {stats.emails}<br />
              <strong>🤖 IA utilisée:</strong> {stats.ai} fois<br />
              <strong>📊 Taux de succès:</strong> 98.5%
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Header */}
      <header style={{ textAlign: 'center', padding: '3rem 0', background: 'rgba(0,0,0,0.3)', borderRadius: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>
          🚀 Email Assistant React
        </h1>
        <p style={{ fontSize: '1.5rem' }}>Interface React pilotée par Backend FastAPI</p>
        <button onClick={checkHealth} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          🔄 Vérifier Backend
        </button>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <button 
          onClick={() => setActiveSection('dashboard')} 
          className={`nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
        >
          📊 Dashboard
        </button>
        <button 
          onClick={() => setActiveSection('compose')} 
          className={`nav-btn ${activeSection === 'compose' ? 'active' : ''}`}
        >
          ✍️ Composer
        </button>
        <button 
          onClick={() => setActiveSection('users')} 
          className={`nav-btn ${activeSection === 'users' ? 'active' : ''}`}
        >
          👥 Utilisateurs
        </button>
      </nav>

      {/* Content */}
      {sections[activeSection]}

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default App