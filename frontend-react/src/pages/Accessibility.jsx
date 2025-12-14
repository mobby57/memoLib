import { useState, useEffect } from 'react';

export default function Accessibility() {
  const [settings, setSettings] = useState({
    tts_enabled: false,
    tts_rate: 150,
    tts_volume: 1.0,
    font_size: 'medium',
    high_contrast: false
  });

  const createProfile = async (needs) => {
    try {
      const response = await fetch('/api/accessibility/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needs })
      });
      const data = await response.json();
      if (data.success) {
        alert('Profil appliqué avec succès');
      }
    } catch (error) {
      console.error('Erreur création profil:', error);
    }
  };

  const updateSetting = async (updates) => {
    try {
      const response = await fetch('/api/accessibility/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Erreur mise à jour paramètres:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          ♿ Centre d'Accessibilité
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Configurez votre expérience pour qu'elle soit adaptée à vos besoins spécifiques.
        </p>
      </div>

      {/* Profils rapides */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
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

      {/* Paramètres */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
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
              <button
                onClick={() => alert('Test TTS')}
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
                A
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
          <p className="text-gray-400 text-center py-4">
            Aucune transcription récente
          </p>
        </div>
      </div>

      {/* Raccourcis clavier */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
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
        </div>
      </div>
    </div>
  );
}