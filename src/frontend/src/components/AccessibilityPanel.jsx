import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function AccessibilityPanel() {
  const [settings, setSettings] = useState({
    tts_enabled: false,
    tts_rate: 150,
    tts_volume: 1.0,
    font_size: 'medium',
    high_contrast: false
  });
  const [profile, setProfile] = useState(null);
  const [transcripts, setTranscripts] = useState([]);

  useEffect(() => {
    loadSettings();
    loadTranscripts();
    
    // Rafraîchir les transcripts toutes les 2 secondes si actif
    const interval = setInterval(() => {
      if (settings.tts_enabled) {
        loadTranscripts();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [settings.tts_enabled]);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/api/accessibility/settings');
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const loadTranscripts = async () => {
    try {
      const response = await axios.get('/api/accessibility/transcripts?limit=10');
      if (response.data.success) {
        setTranscripts(response.data.transcripts);
      }
    } catch (error) {
      console.error('Erreur chargement transcripts:', error);
    }
  };

  const updateSetting = async (updates) => {
    try {
      const response = await axios.post('/api/accessibility/settings', updates);
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Erreur mise à jour paramètres:', error);
    }
  };

  const createProfile = async (needs) => {
    try {
      const response = await axios.post('/api/accessibility/profile', { needs });
      if (response.data.success) {
        setProfile(response.data.profile);
        // Utiliser les settings retournés directement par le profil si disponibles
        if (response.data.settings) {
          setSettings(response.data.settings);
        } else {
          loadSettings(); // Recharger après application du profil
        }
      }
    } catch (error) {
      console.error('Erreur création profil:', error);
    }
  };

  const speak = async (text) => {
    try {
      await axios.post('/api/accessibility/speak', { 
        text, 
        priority: 'normal' 
      });
    } catch (error) {
      console.error('Erreur TTS:', error);
    }
  };

  return (
    <div className={`space-y-6 ${settings.high_contrast ? 'contrast-more' : ''}`}>
      {/* Profils rapides */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">🌟 Profils d'accessibilité</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => createProfile(['blind'])}
            className="p-4 bg-purple-100 hover:bg-purple-200 rounded-lg text-center transition"
          >
            <span className="text-2xl block mb-1">👁️</span>
            <span className="text-sm font-semibold">Aveugle</span>
          </button>
          <button
            onClick={() => createProfile(['deaf'])}
            className="p-4 bg-blue-100 hover:bg-blue-200 rounded-lg text-center transition"
          >
            <span className="text-2xl block mb-1">👂</span>
            <span className="text-sm font-semibold">Sourd</span>
          </button>
          <button
            onClick={() => createProfile(['mute'])}
            className="p-4 bg-green-100 hover:bg-green-200 rounded-lg text-center transition"
          >
            <span className="text-2xl block mb-1">🗣️</span>
            <span className="text-sm font-semibold">Muet</span>
          </button>
          <button
            onClick={() => createProfile(['motor_impaired'])}
            className="p-4 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-center transition"
          >
            <span className="text-2xl block mb-1">⌨️</span>
            <span className="text-sm font-semibold">Moteur</span>
          </button>
        </div>
      </div>

      {/* Profil actif */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <h3 className="font-semibold text-green-800 mb-2">✅ Profil appliqué</h3>
          <p className="text-sm text-green-700 mb-2">{profile.description}</p>
          <ul className="text-xs text-green-600 list-disc list-inside space-y-1">
            {profile.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Paramètres */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">⚙️ Paramètres</h2>
        
        {/* TTS */}
        <div className="mb-4 pb-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold">Synthèse vocale (TTS)</label>
            <input
              type="checkbox"
              checked={settings.tts_enabled}
              onChange={() => updateSetting({ toggle_tts: true })}
              className="w-5 h-5 rounded"
            />
          </div>
          
          {settings.tts_enabled && (
            <div className="space-y-3 pl-4">
              <div>
                <label className="text-sm block mb-1">
                  Vitesse: {settings.tts_rate} mots/min
                </label>
                <input
                  type="range"
                  min="100"
                  max="250"
                  value={settings.tts_rate}
                  onChange={(e) => updateSetting({ tts_rate: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm block mb-1">
                  Volume: {Math.round(settings.tts_volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.tts_volume}
                  onChange={(e) => updateSetting({ tts_volume: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              <button
                onClick={() => speak('Ceci est un test de la synthèse vocale')}
                className="text-sm bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                🔊 Tester
              </button>
            </div>
          )}
        </div>

        {/* Taille de police */}
        <div className="mb-4 pb-4 border-b">
          <label className="font-semibold block mb-3">Taille de police</label>
          <div className="flex gap-2">
            {['small', 'medium', 'large', 'x-large'].map((size) => (
              <button
                key={size}
                onClick={() => updateSetting({ font_size: size })}
                className={`px-4 py-2 rounded ${
                  settings.font_size === size
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {size === 'small' && 'A'}
                {size === 'medium' && 'A'}
                {size === 'large' && 'A'}
                {size === 'x-large' && 'A'}
              </button>
            ))}
          </div>
        </div>

        {/* Haut contraste */}
        <div className="flex items-center justify-between">
          <label className="font-semibold">Haut contraste</label>
          <input
            type="checkbox"
            checked={settings.high_contrast}
            onChange={() => updateSetting({ toggle_contrast: true })}
            className="w-5 h-5 rounded"
          />
        </div>
      </div>

      {/* Transcription Vocale */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">🎤 Transcription Vocale</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {transcripts.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              Aucune transcription récente
            </p>
          ) : (
            transcripts.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm">{item.text}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Raccourcis clavier */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">⌨️ Raccourcis clavier</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Démarrer/Arrêter enregistrement</span>
            <kbd className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">
              Ctrl+R
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Activer/Désactiver TTS</span>
            <kbd className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">
              Ctrl+T
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Augmenter contraste</span>
            <kbd className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">
              Ctrl+H
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Augmenter taille texte</span>
            <kbd className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">
              Ctrl++
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Diminuer taille texte</span>
            <kbd className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">
              Ctrl+-
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Décrire écran</span>
            <kbd className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">
              Ctrl+D
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
