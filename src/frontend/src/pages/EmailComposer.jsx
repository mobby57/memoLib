import React, { useState } from 'react';
import { emailService, aiService } from '../services/api';
import VoiceToTextEditor from '../components/VoiceToTextEditor';

export default function EmailComposer() {
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVoiceEditor, setShowVoiceEditor] = useState(false);

  const generateWithAI = async () => {
    if (!aiPrompt) return;
    
    setLoading(true);
    try {
      const result = await aiService.generate(aiPrompt, 'professional');
      setEmail(prev => ({ ...prev, body: result.content }));
    } catch (error) {
      console.error('Erreur génération IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!email.to || !email.subject || !email.body) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const result = await emailService.send(email);
      if (result.success) {
        alert('Email envoyé avec succès !');
        setEmail({ to: '', subject: '', body: '' });
      } else {
        alert('Erreur envoi email');
      }
    } catch (error) {
      console.error('Erreur envoi:', error);
      alert('Erreur technique');
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la dictée vocale
  const handleVoiceValidate = (text) => {
    setEmail(prev => ({ ...prev, body: text }));
    setShowVoiceEditor(false);
  };

  const handleVoiceCancel = () => {
    setShowVoiceEditor(false);
  };

  return (
    <div className="email-composer">
      <h1>✍️ Composer un Email</h1>

      {/* Génération IA */}
      <div className="ai-section">
        <h3>🤖 Génération IA</h3>
        <div className="ai-input">
          <input
            type="text"
            placeholder="Décrivez votre email..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <button onClick={generateWithAI} disabled={loading}>
            {loading ? '⏳' : '✨'} Générer
          </button>
        </div>
      </div>

      {/* Formulaire Email */}
      <div className="email-form">
        <div className="form-group">
          <label>À :</label>
          <input
            type="email"
            value={email.to}
            onChange={(e) => setEmail(prev => ({ ...prev, to: e.target.value }))}
            placeholder="destinataire@email.com"
          />
        </div>

        <div className="form-group">
          <label>Sujet :</label>
          <input
            type="text"
            value={email.subject}
            onChange={(e) => setEmail(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Sujet de l'email"
          />
        </div>

        <div className="form-group">
          <label>Message :</label>
          
          {showVoiceEditor ? (
            <VoiceToTextEditor
              onValidate={handleVoiceValidate}
              onCancel={handleVoiceCancel}
              initialText={email.body}
              placeholder="Cliquez sur le micro et commencez à parler..."
            />
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowVoiceEditor(true)}
                  className="voice-button"
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🎤</span>
                  Dicter avec validation
                </button>
              </div>
              <textarea
                value={email.body}
                onChange={(e) => setEmail(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Contenu de l'email..."
                rows={10}
              />
            </>
          )}
        </div>

        <button 
          className="send-button" 
          onClick={sendEmail} 
          disabled={loading}
        >
          {loading ? '⏳ Envoi...' : '📤 Envoyer'}
        </button>
      </div>
    </div>
  );
}