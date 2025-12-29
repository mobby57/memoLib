import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import logger from '../utils/logger';

export default function AccessibilityPanel() {
  const [userStats, setUserStats] = useState({});
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    loadUserStats();
    applyAccessibilitySettings();
  }, []);

  const loadUserStats = async () => {
    try {
      // TODO: Implémenter endpoint API pour stats accessibilité
      // const stats = await apiService.request('/api/accessibility/stats');
      // setUserStats(stats);
      setUserStats({}); // Temporaire
    } catch (error) {
      logger.error('Erreur stats accessibilité', error, { action: 'loadUserStats' });
    }
  };

  const applyAccessibilitySettings = () => {
    document.body.className = `font-${fontSize} ${highContrast ? 'high-contrast' : ''}`;
  };

  useEffect(() => {
    applyAccessibilitySettings();
  }, [fontSize, highContrast]);

  const speakText = async (text) => {
    try {
      // Utiliser synthèse vocale navigateur
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
      
      // TODO: Utiliser API TTS quand disponible
      // await apiService.request('/api/voice/speak', {
      //   method: 'POST',
      //   body: JSON.stringify({ text })
      // });
    } catch (error) {
      logger.error('Erreur synthèse vocale', error, { action: 'speakText' });
    }
  };

  const startVoiceMessage = async () => {
    setIsListening(true);
    await speakText('Parlez maintenant');
    
    // Simulation reconnaissance vocale
    setTimeout(() => {
      setMessage('Message dicté par reconnaissance vocale');
      setIsListening(false);
      speakText('Message enregistré');
    }, 3000);
  };

  const createAccessibleMessage = async () => {
    if (!message) {
      await speakText('Veuillez créer un message d\'abord');
      return;
    }

    try {
      const result = await accessibilityService.createMessage({
        content: message,
        mode: 'accessible'
      });

      if (result.success) {
        await speakText('Message créé avec succès');
      }
    } catch (error) {
      await speakText('Erreur lors de la création');
    }
  };

  const readPageContent = () => {
    const content = `
      Interface d'accessibilité. 
      Vous avez envoyé ${userStats.emails_sent || 0} emails.
      Taux de réussite : ${userStats.success_rate || '100%'}.
      Utilisez les boutons pour créer des messages accessibles.
    `;
    speakText(content);
  };

  return (
    <div className="accessibility-panel">
      <h1>♿ Interface Accessible</h1>

      {/* Statistiques */}
      <div className="stats-accessible">
        <div className="stat-item">
          <span>📧 Emails envoyés :</span>
          <strong>{userStats.emails_sent || 0}</strong>
        </div>
        <div className="stat-item">
          <span>✅ Taux de réussite :</span>
          <strong>{userStats.success_rate || '100%'}</strong>
        </div>
      </div>

      {/* Contrôles d'accessibilité */}
      <div className="accessibility-controls">
        <h3>🔧 Paramètres d'accessibilité</h3>
        
        <div className="control-group">
          <label>Taille de police :</label>
          <select 
            value={fontSize} 
            onChange={(e) => setFontSize(e.target.value)}
          >
            <option value="small">Petite</option>
            <option value="normal">Normale</option>
            <option value="large">Grande</option>
            <option value="extra-large">Très grande</option>
          </select>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
            />
            Mode haut contraste
          </label>
        </div>
      </div>

      {/* Interface vocale simplifiée */}
      <div className="voice-section">
        <h3>🎤 Création vocale</h3>
        
        <div className="big-buttons">
          <button 
            className="big-button voice-button"
            onClick={startVoiceMessage}
            disabled={isListening}
          >
            {isListening ? '🔴 Écoute...' : '🎤 Parler'}
          </button>

          <button 
            className="big-button read-button"
            onClick={readPageContent}
          >
            🔊 Lire la page
          </button>
        </div>

        {message && (
          <div className="message-preview">
            <h4>📝 Votre message :</h4>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <button onClick={() => speakText(message)}>
              🔊 Écouter
            </button>
          </div>
        )}
      </div>

      {/* Actions principales */}
      <div className="main-actions">
        <button 
          className="big-button create-button"
          onClick={createAccessibleMessage}
        >
          ✍️ Créer Message
        </button>

        <button 
          className="big-button help-button"
          onClick={() => speakText('Interface accessible. Utilisez les boutons pour créer des messages. Parlez pour dicter votre contenu.')}
        >
          ❓ Aide vocale
        </button>
      </div>

      {/* Raccourcis clavier */}
      <div className="keyboard-shortcuts">
        <h4>⌨️ Raccourcis clavier :</h4>
        <ul>
          <li><kbd>Espace</kbd> - Parler</li>
          <li><kbd>Enter</kbd> - Créer message</li>
          <li><kbd>H</kbd> - Aide</li>
          <li><kbd>R</kbd> - Lire la page</li>
        </ul>
      </div>
    </div>
  );
}