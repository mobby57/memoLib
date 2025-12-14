import { useState } from 'react'
import { Send, Sparkles, Save } from 'lucide-react'
import { emailAPI, aiAPI } from '../services/api'
import toast from 'react-hot-toast'

const Composer = () => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    content: '',
    tone: 'professional'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generateWithAI = async () => {
    if (!formData.subject) {
      toast.error('Veuillez saisir un sujet pour générer le contenu')
      return
    }

    setIsGenerating(true)
    try {
      const response = await aiAPI.generate(formData.subject, formData.tone)
      setFormData(prev => ({
        ...prev,
        content: response.data.content
      }))
      toast.success('Contenu généré avec succès!')
    } catch (error) {
      toast.error('Erreur lors de la génération IA')
    } finally {
      setIsGenerating(false)
    }
  }

  const sendEmail = async () => {
    if (!formData.to || !formData.subject || !formData.content) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setIsSending(true)
    try {
      await emailAPI.send(formData)
      toast.success('Email envoyé avec succès!')
      setFormData({
        to: '',
        subject: '',
        content: '',
        tone: 'professional'
      })
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'email')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Composer un Email</h1>
        <p className="text-gray-600">Créez et envoyez des emails avec l'aide de l'IA</p>
      </div>

      <div className="card max-w-4xl">
        <div className="space-y-6">
          {/* Destinataire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinataire
            </label>
            <input
              type="email"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              className="input-field"
              placeholder="exemple@email.com"
            />
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sujet
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Sujet de l'email"
            />
          </div>

          {/* Ton de l'IA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ton de l'IA
            </label>
            <select
              name="tone"
              value={formData.tone}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="professional">Professionnel</option>
              <option value="friendly">Amical</option>
              <option value="formal">Formel</option>
              <option value="casual">Décontracté</option>
            </select>
          </div>

          {/* Contenu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Contenu
              </label>
              <button
                onClick={generateWithAI}
                disabled={isGenerating}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {isGenerating ? 'Génération...' : 'Générer avec IA'}
              </button>
            </div>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={12}
              className="input-field resize-none"
              placeholder="Contenu de l'email..."
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={sendEmail}
              disabled={isSending}
              className="btn-primary flex items-center disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Envoi...' : 'Envoyer'}
            </button>
            
            <button className="btn-secondary flex items-center">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder comme template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Composer