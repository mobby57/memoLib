import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, CheckCircle, Mic, MicOff, Eye, EyeOff } from 'lucide-react';

// Hook personnalisé pour l'accessibilité
const useAccessibility = () => {
  const [isScreenReader, setIsScreenReader] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('medium');

  useEffect(() => {
    // Détection du lecteur d'écran
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                           window.navigator.userAgent.includes('JAWS') ||
                           window.speechSynthesis;
    setIsScreenReader(hasScreenReader);

    // Récupération des préférences utilisateur
    const savedContrast = localStorage.getItem('highContrast') === 'true';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    
    setHighContrast(savedContrast);
    setFontSize(savedFontSize);
  }, []);

  const announceToScreenReader = useCallback((message) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
    
    // Aussi utiliser aria-live region
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }, []);

  return {
    isScreenReader,
    highContrast,
    fontSize,
    setHighContrast,
    setFontSize,
    announceToScreenReader
  };
};

// Hook pour la reconnaissance vocale
const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'fr-FR';
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = useCallback((onResult) => {
    if (recognition) {
      setIsListening(true);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  return {
    isListening,
    startListening,
    stopListening,
    isSupported: !!recognition
  };
};

// Composant FormField individuel
const FormField = ({ field, value, onChange, error, onVoiceInput }) => {
  const fieldRef = useRef(null);
  const { isListening, startListening, stopListening, isSupported } = useVoiceInput();
  const [showPassword, setShowPassword] = useState(false);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        onChange(field.id, transcript);
        onVoiceInput && onVoiceInput(`Texte saisi par voix: ${transcript}`);
      });
    }
  }, [isListening, startListening, stopListening, onChange, field.id, onVoiceInput]);

  const renderField = () => {
    const baseProps = {
      id: field.id,
      name: field.id,
      value: value || '',
      onChange: (e) => onChange(field.id, e.target.value),
      className: `form-input ${error ? 'error' : ''} ${field.accessibility?.keyboard_accessible ? 'keyboard-accessible' : ''}`,
      'aria-label': field.aria_label,
      'aria-describedby': `${field.id}-help ${field.id}-error`,
      'aria-invalid': !!error,
      placeholder: field.placeholder,
      required: field.required,
      ref: fieldRef
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...baseProps}
            rows={field.accessibility?.auto_expand ? 'auto' : 4}
            spellCheck={field.accessibility?.spell_check}
            style={{ resize: field.accessibility?.resize || 'vertical' }}
          />
        );

      case 'select':
        return (
          <select {...baseProps}>
            <option value="">Sélectionnez une option</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'email':
        return (
          <input
            {...baseProps}
            type="email"
            autoComplete="email"
          />
        );

      case 'password':
        return (
          <div className="password-field-container">
            <input
              {...baseProps}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        );

      case 'date':
        return (
          <input
            {...baseProps}
            type="date"
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'number':
        return (
          <input
            {...baseProps}
            type="number"
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.validation?.step || 'any'}
          />
        );

      default:
        return (
          <input
            {...baseProps}
            type="text"
            pattern={field.validation?.pattern}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );
    }
  };

  return (
    <div className={`form-field ${field.type}-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={field.id} className="form-label">
        {field.label}
        {field.required && <span className="required-indicator" aria-label="obligatoire">*</span>}
      </label>
      
      <div className="input-container">
        {renderField()}
        
        {/* Bouton de saisie vocale */}
        {isSupported && field.type !== 'select' && field.type !== 'date' && (
          <button
            type="button"
            className={`voice-input-btn ${isListening ? 'listening' : ''}`}
            onClick={handleVoiceInput}
            aria-label={isListening ? 'Arrêter la saisie vocale' : 'Commencer la saisie vocale'}
            title={isListening ? 'Cliquez pour arrêter' : 'Cliquez pour dicter'}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}
      </div>

      {/* Texte d'aide */}
      {field.help_text && (
        <div id={`${field.id}-help`} className="field-help-text">
          {field.help_text}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div id={`${field.id}-error`} className="field-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Composant principal AdaptiveForm
const AdaptiveForm = ({ 
  formSchema, 
  onSubmit, 
  clientConfig = {},
  initialData = {},
  onFieldChange,
  className = ''
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const { 
    isScreenReader, 
    highContrast, 
    fontSize, 
    setHighContrast, 
    setFontSize, 
    announceToScreenReader 
  } = useAccessibility();
  
  const firstFieldRef = useRef(null);
  const formRef = useRef(null);

  // Focus automatique sur le premier champ pour l'accessibilité
  useEffect(() => {
    if (formSchema?.fields?.length > 0) {
      const firstField = document.getElementById(formSchema.fields[0].id);
      if (firstField) {
        firstField.focus();
        announceToScreenReader(`Formulaire ${formSchema.title} chargé. ${formSchema.fields.length} champs à remplir.`);
      }
    }
  }, [formSchema, announceToScreenReader]);

  // Sauvegarde automatique
  useEffect(() => {
    if (autoSaveEnabled && Object.keys(formData).length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`form_${formSchema?.form_id}`, JSON.stringify(formData));
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, autoSaveEnabled, formSchema?.form_id]);

  // Récupération des données sauvegardées
  useEffect(() => {
    if (formSchema?.form_id) {
      const savedData = localStorage.getItem(`form_${formSchema.form_id}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData(prev => ({ ...prev, ...parsedData }));
          announceToScreenReader('Données précédemment saisies récupérées');
        } catch (e) {
          console.warn('Erreur lors de la récupération des données sauvegardées');
        }
      }
    }
  }, [formSchema?.form_id, announceToScreenReader]);

  const handleFieldChange = useCallback((fieldId, value) => {
    setFormData(prev => {
      const newData = { ...prev, [fieldId]: value };
      
      // Validation en temps réel
      const field = formSchema?.fields?.find(f => f.id === fieldId);
      if (field) {
        const fieldError = validateField(field, value);
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          if (fieldError) {
            newErrors[fieldId] = fieldError;
          } else {
            delete newErrors[fieldId];
          }
          return newErrors;
        });
      }
      
      // Callback externe
      onFieldChange && onFieldChange(fieldId, value);
      
      return newData;
    });
  }, [formSchema?.fields, onFieldChange]);

  const validateField = (field, value) => {
    if (field.required && (!value || value.toString().trim() === '')) {
      return `Le champ ${field.label} est obligatoire`;
    }

    if (value && field.validation) {
      const validation = field.validation;
      
      if (validation.minLength && value.length < validation.minLength) {
        return `Minimum ${validation.minLength} caractères requis`;
      }
      
      if (validation.maxLength && value.length > validation.maxLength) {
        return `Maximum ${validation.maxLength} caractères autorisés`;
      }
      
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        return validation.message || 'Format invalide';
      }
      
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Adresse email invalide';
      }
      
      if (field.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return 'Valeur numérique requise';
        }
        if (validation.min !== undefined && numValue < validation.min) {
          return `Valeur minimum: ${validation.min}`;
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return `Valeur maximum: ${validation.max}`;
        }
      }
    }

    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    formSchema?.fields?.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      announceToScreenReader('Le formulaire contient des erreurs. Veuillez les corriger.');
      // Focus sur le premier champ en erreur
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      setSubmitSuccess(true);
      announceToScreenReader('Formulaire soumis avec succès');
      
      // Nettoyage de la sauvegarde automatique
      if (formSchema?.form_id) {
        localStorage.removeItem(`form_${formSchema.form_id}`);
      }
      
    } catch (error) {
      announceToScreenReader('Erreur lors de la soumission du formulaire');
      console.error('Erreur soumission formulaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceAnnouncement = useCallback((message) => {
    announceToScreenReader(message);
  }, [announceToScreenReader]);

  // Navigation clavier
  const handleKeyDown = (e) => {
    if (e.key === 'F1') {
      e.preventDefault();
      announceToScreenReader('Aide: Utilisez Tab pour naviguer entre les champs, Entrée pour soumettre, F2 pour les options d\'accessibilité');
    }
    
    if (e.key === 'F2') {
      e.preventDefault();
      // Ouvrir le panneau d'accessibilité
      document.getElementById('accessibility-panel')?.focus();
    }
  };

  if (submitSuccess) {
    return (
      <div className="form-success" role="alert" aria-live="polite">
        <CheckCircle size={48} className="success-icon" />
        <h2>Formulaire soumis avec succès !</h2>
        <p>Merci pour vos informations. Nous reviendrons vers vous rapidement.</p>
      </div>
    );
  }

  return (
    <div 
      className={`adaptive-form-container ${className} ${highContrast ? 'high-contrast' : ''} font-${fontSize}`}
      onKeyDown={handleKeyDown}
    >
      {/* Région aria-live pour les annonces */}
      <div id="aria-live-region" aria-live="polite" aria-atomic="true" className="sr-only"></div>
      
      {/* Panneau d'accessibilité */}
      <div id="accessibility-panel" className="accessibility-panel" tabIndex="-1">
        <h3>Options d'accessibilité</h3>
        <div className="accessibility-controls">
          <label>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => {
                setHighContrast(e.target.checked);
                localStorage.setItem('highContrast', e.target.checked);
              }}
            />
            Contraste élevé
          </label>
          
          <label>
            Taille de police:
            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                localStorage.setItem('fontSize', e.target.value);
              }}
            >
              <option value="small">Petite</option>
              <option value="medium">Moyenne</option>
              <option value="large">Grande</option>
              <option value="xlarge">Très grande</option>
            </select>
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
            />
            Sauvegarde automatique
          </label>
        </div>
      </div>

      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className="adaptive-form"
        noValidate
        role="form"
        aria-labelledby="form-title"
        aria-describedby="form-description"
      >
        <header className="form-header">
          <h1 id="form-title" className="form-title">
            {formSchema?.title || 'Formulaire'}
          </h1>
          {formSchema?.description && (
            <p id="form-description" className="form-description">
              {formSchema.description}
            </p>
          )}
        </header>

        <div className="form-fields">
          {formSchema?.fields?.map((field, index) => (
            <FormField
              key={field.id}
              field={field}
              value={formData[field.id]}
              onChange={handleFieldChange}
              error={errors[field.id]}
              onVoiceInput={handleVoiceAnnouncement}
              ref={index === 0 ? firstFieldRef : null}
            />
          ))}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="submit-button"
            aria-describedby="submit-help"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
          </button>
          
          <div id="submit-help" className="submit-help">
            {Object.keys(errors).length > 0 && (
              <span className="error-count" role="alert">
                {Object.keys(errors).length} erreur(s) à corriger
              </span>
            )}
          </div>
        </div>

        {/* Indicateur de progression */}
        <div className="form-progress" aria-label="Progression du formulaire">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${(Object.keys(formData).length / (formSchema?.fields?.length || 1)) * 100}%` 
              }}
            ></div>
          </div>
          <span className="progress-text">
            {Object.keys(formData).length} / {formSchema?.fields?.length || 0} champs remplis
          </span>
        </div>
      </form>

      {/* Aide contextuelle */}
      <div className="form-help" role="complementary">
        <details>
          <summary>Aide et raccourcis clavier</summary>
          <ul>
            <li><kbd>Tab</kbd> : Naviguer entre les champs</li>
            <li><kbd>Shift + Tab</kbd> : Navigation inverse</li>
            <li><kbd>F1</kbd> : Aide générale</li>
            <li><kbd>F2</kbd> : Options d'accessibilité</li>
            <li><kbd>Entrée</kbd> : Soumettre le formulaire</li>
          </ul>
        </details>
      </div>
    </div>
  );
};

export default AdaptiveForm;