import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'
import { configAPI } from '../services/api'
import toast from 'react-hot-toast'

const Settings = () => {
  const [settings, setSettings] = useState({
    email: {
      smtp_server: '',
      smtp_port: 587,
      username: '',
      password: '',
      use_tls: true
    },
    ai: {
      openai_api_key: '',
      default_tone: 'professional'
    },
    voice: {
      enabled: true,
      language: 'fr-FR'
    }
  })
  const [showPasswords, setShowPasswords] = useState({
    email: false,
    ai: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await configAPI.getSettings()
        setSettings(response.data)
      } catch (error) {
        toast.error('Erreur lors du chargement des paramètres')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await configAPI.updateSettings(settings)
      toast.success('Paramètres sauvegardés avec succès!')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const togglePasswordVisibility = (section) => {
    setShowPasswords(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600">Configurez votre application</p>
      </div>

      <div className="space-y-6">
        {/* Configuration Email */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Configuration Email
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serveur SMTP
              </label>
              <input
                type="text"
                value={settings.email.smtp_server}
                onChange={(e) => handleInputChange('email', 'smtp_server', e.target.value)}
                className="input-field"
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port SMTP
              </label>
              <input
                type="number"
                value={settings.email.smtp_port}
                onChange={(e) => handleInputChange('email', 'smtp_port', parseInt(e.target.value))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <input
                type="email"
                value={settings.email.username}
                onChange={(e) => handleInputChange('email', 'username', e.target.value)}
                className="input-field"
                placeholder="votre@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPasswords.email ? 'text' : 'password'}
                  value={settings.email.password}
                  onChange={(e) => handleInputChange('email', 'password', e.target.value)}
                  className="input-field pr-10"
                  placeholder="App Password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('email')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.email ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.email.use_tls}
                onChange={(e) => handleInputChange('email', 'use_tls', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Utiliser TLS</span>
            </label>
          </div>
        </div>

        {/* Configuration IA */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Configuration IA
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API OpenAI
              </label>
              <div className="relative">
                <input
                  type={showPasswords.ai ? 'text' : 'password'}
                  value={settings.ai.openai_api_key}
                  onChange={(e) => handleInputChange('ai', 'openai_api_key', e.target.value)}
                  className="input-field pr-10"
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('ai')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.ai ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ton par défaut
              </label>
              <select
                value={settings.ai.default_tone}
                onChange={(e) => handleInputChange('ai', 'default_tone', e.target.value)}
                className="input-field"
              >
                <option value="professional">Professionnel</option>
                <option value="friendly">Amical</option>
                <option value="formal">Formel</option>
                <option value="casual">Décontracté</option>
              </select>
            </div>
          </div>
        </div>

        {/* Configuration Vocale */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Configuration Vocale
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.voice.enabled}
                  onChange={(e) => handleInputChange('voice', 'enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Activer l'interface vocale</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue
              </label>
              <select
                value={settings.voice.language}
                onChange={(e) => handleInputChange('voice', 'language', e.target.value)}
                className="input-field"
              >
                <option value="fr-FR">Français</option>
                <option value="en-US">Anglais</option>
                <option value="es-ES">Espagnol</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn-primary flex items-center disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings