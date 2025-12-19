import React, { useState, useEffect, useCallback } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { aiAPI } from '../services/api';
import './VoiceToTextEditor.css';

/**
 * Composant de dictée vocale avec prévisualisation et amélioration IA
 * Permet de parler, voir la transcription, éditer et améliorer avant validation
 */
export default function VoiceToTextEditor({ 
  onValidate, 
  onCancel, 
  initialText = '',
  placeholder = 'Cliquez sur le micro et parlez...',
  language = 'fr-FR' 
}) {
  const [editableText, setEditableText] = useState(initialText);
  const [isImproving, setIsImproving] = useState(false);
  const [improvedText, setImprovedText] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [notification, setNotification] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    fullTranscript
  } = useVoiceInput({
    language,
    continuous: true,
    interimResults: true
  });

  // Synchroniser le texte éditable avec la transcription
  useEffect(() => {
    if (transcript) {
      setEditableText(transcript);
    }
  }, [transcript]);

  // Démarrer/arrêter l'écoute
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Améliorer le texte avec l'IA
  const improveText = async () => {
    if (!editableText.trim()) {
      setNotification('Aucun texte à améliorer');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    setIsImproving(true);
    setShowComparison(false);

    try {
      const response = await aiAPI.generate(
        `Améliore ce texte en le rendant plus clair, professionnel et fluide, sans changer le sens:\n\n"${editableText}"`,
        'professional'
      );

      setImprovedText(response.content || response.text || '');
      setShowComparison(true);
    } catch (err) {
      console.error('Error improving text:', err);
      setNotification('Erreur lors de l\'amélioration du texte');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setIsImproving(false);
    }
  };

  // Accepter le texte amélioré
  const acceptImprovement = () => {
    setEditableText(improvedText);
    setShowComparison(false);
    setImprovedText('');
  };

  // Refuser le texte amélioré
  const rejectImprovement = () => {
    setShowComparison(false);
    setImprovedText('');
  };

  // Valider et envoyer le texte
  const handleValidate = () => {
    if (!editableText.trim()) {
      setNotification('Le texte est vide');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    
    stopListening();
    onValidate(editableText);
  };

  // Annuler et réinitialiser
  const handleCancel = () => {
    stopListening();
    resetTranscript();
    setEditableText('');
    setImprovedText('');
    setShowComparison(false);
    if (onCancel) onCancel();
  };

  // Effacer tout
  const handleClear = () => {
    setShowConfirm(true);
  };

  const confirmClear = () => {
    resetTranscript();
    setEditableText('');
    setImprovedText('');
    setShowComparison(false);
    setShowConfirm(false);
  };

  const cancelClear = () => {
    setShowConfirm(false);
  };

  if (!isSupported) {
    return (
      <div className="voice-editor-error">
        <div className="error-icon">🚫</div>
        <h3>Reconnaissance vocale non supportée</h3>
        <p>Votre navigateur ne supporte pas la reconnaissance vocale.</p>
        <p>Utilisez Chrome, Edge ou Safari récent.</p>
      </div>
    );
  }

  return (
    <div className="voice-to-text-editor">
      {/* Notification */}
      {notification && (
        <div className="notification">
          ⚠️ {notification}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h4>Confirmation</h4>
            <p>Effacer tout le texte ?</p>
            <div className="confirm-actions">
              <button className="btn-confirm-yes" onClick={confirmClear}>
                Oui, effacer
              </button>
              <button className="btn-confirm-no" onClick={cancelClear}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      {/* En-tête avec contrôles */}
      <div className="editor-header">
        <h3>
          <span className="icon">🎤</span>
          Dictée Vocale
        </h3>
        
        <div className="status-bar">
          {isListening && (
            <span className="status-indicator listening">
              <span className="pulse"></span>
              Écoute en cours...
            </span>
          )}
          {error && (
            <span className="status-indicator error">
              ⚠️ {error}
            </span>
          )}
        </div>
      </div>

      {/* Zone de texte éditable */}
      <div className="editor-content">
        <div className="text-preview">
          <textarea
            className="editable-text"
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            placeholder={placeholder}
            rows={10}
            disabled={isListening}
          />
          
          {/* Transcription temporaire (interimResults) */}
          {interimTranscript && (
            <div className="interim-transcript">
              <span className="interim-label">En cours:</span>
              <span className="interim-text">{interimTranscript}</span>
            </div>
          )}
        </div>

        {/* Comparaison avec texte amélioré */}
        {showComparison && improvedText && (
          <div className="comparison-panel">
            <div className="comparison-header">
              <h4>✨ Texte amélioré par l'IA</h4>
              <div className="comparison-actions">
                <button 
                  className="btn-accept" 
                  onClick={acceptImprovement}
                  title="Utiliser cette version"
                >
                  ✓ Accepter
                </button>
                <button 
                  className="btn-reject" 
                  onClick={rejectImprovement}
                  title="Garder l'original"
                >
                  ✗ Refuser
                </button>
              </div>
            </div>
            
            <div className="comparison-content">
              <div className="original-text">
                <label>Original:</label>
                <div className="text-display">{editableText}</div>
              </div>
              
              <div className="improved-text">
                <label>Amélioré:</label>
                <div className="text-display highlight">{improvedText}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barre d'actions */}
      <div className="editor-actions">
        <div className="left-actions">
          {/* Bouton Microphone */}
          <button
            className={`btn-mic ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            disabled={isImproving}
            title={isListening ? 'Arrêter l\'écoute' : 'Commencer à parler'}
          >
            {isListening ? (
              <>
                <span className="mic-icon active">⏸</span>
                Pause
              </>
            ) : (
              <>
                <span className="mic-icon">🎤</span>
                Parler
              </>
            )}
          </button>

          {/* Bouton Améliorer */}
          <button
            className="btn-improve"
            onClick={improveText}
            disabled={!editableText.trim() || isImproving || isListening}
            title="Améliorer avec l'IA"
          >
            {isImproving ? (
              <>
                <span className="spinner">⏳</span>
                Amélioration...
              </>
            ) : (
              <>
                <span className="icon">✨</span>
                Améliorer
              </>
            )}
          </button>

          {/* Bouton Effacer */}
          <button
            className="btn-clear"
            onClick={handleClear}
            disabled={!editableText.trim() || isListening || isImproving}
            title="Tout effacer"
          >
            <span className="icon">🗑️</span>
            Effacer
          </button>
        </div>

        <div className="right-actions">
          {/* Bouton Annuler */}
          <button
            className="btn-cancel"
            onClick={handleCancel}
            disabled={isImproving}
          >
            Annuler
          </button>

          {/* Bouton Valider */}
          <button
            className="btn-validate"
            onClick={handleValidate}
            disabled={!editableText.trim() || isImproving}
          >
            <span className="icon">✓</span>
            Valider
          </button>
        </div>
      </div>

      {/* Aide rapide */}
      <div className="editor-help">
        <details>
          <summary>💡 Aide rapide</summary>
          <ul>
            <li>🎤 Cliquez sur "Parler" et dictez votre texte</li>
            <li>✏️ Vous pouvez éditer le texte pendant ou après la dictée</li>
            <li>✨ Cliquez sur "Améliorer" pour que l'IA reformule le texte</li>
            <li>✓ Validez quand vous êtes satisfait du résultat</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
