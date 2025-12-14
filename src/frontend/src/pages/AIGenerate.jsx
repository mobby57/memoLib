import { useState } from 'react';
import { Sparkles, Wand2, Send, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { aiAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AIGenerate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    context: '',
    tone: 'professional',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const tones = [
    { value: 'professional', label: '💼 Professionnel', description: 'Formel et courtois' },
    { value: 'friendly', label: '😊 Amical', description: 'Chaleureux et décontracté' },
    { value: 'formal', label: '🎩 Formel', description: 'Très professionnel' },
    { value: 'casual', label: '👋 Décontracté', description: 'Informel et léger' },
  ];

  const handleGenerate = async () => {
    if (!formData.context.trim()) {
      toast.error('Veuillez décrire le contexte de l\'email');
      return;
    }

    setLoading(true);

    try {
      const response = await aiAPI.generate(formData);
      
      if (response.data.success) {
        setResult({
          subject: response.data.subject,
          body: response.data.body,
        });
        toast.success('✨ Email généré avec succès!');
      } else {
        toast.error(response.data.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('OpenAI')) {
        toast.error('Configuration OpenAI requise');
        setTimeout(() => navigate('/config'), 2000);
      } else {
        toast.error('Erreur lors de la génération');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier!');
  };

  const useGenerated = () => {
    // Stocker dans localStorage pour l'utiliser sur la page send
    localStorage.setItem('generatedEmail', JSON.stringify(result));
    navigate('/send');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Sparkles className="w-8 h-8 mr-3 text-purple-600" />
            Génération d'email avec IA
          </h1>
          <p className="text-gray-600">
            Laissez l'IA générer un email professionnel pour vous
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📝 Décrivez votre besoin
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contexte de l'email
                </label>
                <textarea
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  rows={6}
                  className="input resize-none"
                  placeholder="Ex: Je veux remercier un client pour sa commande récente et lui proposer une réduction pour son prochain achat..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ton de l'email
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {tones.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setFormData({ ...formData, tone: tone.value })}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.tone === tone.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{tone.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{tone.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Générer avec IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              ✨ Résultat généré
            </h2>

            {result ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Objet
                    </label>
                    <button
                      onClick={() => copyToClipboard(result.subject)}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copier
                    </button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-800">{result.subject}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Corps du message
                    </label>
                    <button
                      onClick={() => copyToClipboard(result.body)}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copier
                    </button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                    <p className="text-gray-800 whitespace-pre-wrap">{result.body}</p>
                  </div>
                </div>

                <button
                  onClick={useGenerated}
                  className="btn btn-primary w-full flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Utiliser cet email
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Sparkles className="w-16 h-16 mb-4" />
                <p className="text-center">
                  Le résultat généré apparaîtra ici
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="card mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
          <div className="flex items-start">
            <Sparkles className="w-6 h-6 text-purple-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">À propos de la génération IA</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>✓ Propulsé par OpenAI GPT-3.5-Turbo</li>
                <li>✓ Génération en français naturel</li>
                <li>✓ Adaptation automatique au ton choisi</li>
                <li>✓ Relecture recommandée avant envoi</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
