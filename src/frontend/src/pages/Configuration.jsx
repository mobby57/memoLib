import { useState, useEffect } from 'react';
import { Settings, Save, Key, Mail as MailIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { configAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Configuration() {
  const [gmailData, setGmailData] = useState({
    email: '',
    app_password: '',
    master_password: '',
  });

  const [openaiData, setOpenaiData] = useState({
    api_key: '',
    master_password: '',
  });

  const [loading, setLoading] = useState({ gmail: false, openai: false });

  const handleGmailSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, gmail: true });

    try {
      const response = await configAPI.saveGmail(gmailData);
      if (response.data.success) {
        toast.success('✅ Configuration Gmail enregistrée!');
        setGmailData({ email: '', app_password: '', master_password: '' });
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading({ ...loading, gmail: false });
    }
  };

  const handleOpenAISubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, openai: true });

    try {
      const response = await configAPI.saveOpenAI(openaiData);
      if (response.data.success) {
        toast.success('✅ Configuration OpenAI enregistrée!');
        setOpenaiData({ api_key: '', master_password: '' });
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading({ ...loading, openai: false });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Settings className="w-8 h-8 mr-3 text-primary-600" />
            Configuration
          </h1>
          <p className="text-gray-600">
            Configurez vos identifiants Gmail et OpenAI
          </p>
        </div>

        {/* Gmail Configuration */}
        <div className="card">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
              <MailIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Configuration Gmail</h2>
              <p className="text-sm text-gray-600">Connectez votre compte Gmail pour envoyer des emails</p>
            </div>
          </div>

          <form onSubmit={handleGmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Gmail
              </label>
              <input
                type="email"
                value={gmailData.email}
                onChange={(e) => setGmailData({ ...gmailData, email: e.target.value })}
                className="input"
                placeholder="votre.email@gmail.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe d'application Gmail
              </label>
              <input
                type="password"
                value={gmailData.app_password}
                onChange={(e) => setGmailData({ ...gmailData, app_password: e.target.value })}
                className="input"
                placeholder="Mot de passe d'application (16 caractères)"
                required
              />
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>📘 Besoin d'aide ?</strong>
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <a 
                    href="guide-app-password.html" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary-600 hover:underline font-medium flex items-center"
                  >
                    📖 Guide complet illustré (débutants)
                  </a>
                  <a 
                    href="https://myaccount.google.com/apppasswords" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary-600 hover:underline flex items-center"
                  >
                    🔗 Lien direct pour créer le mot de passe →
                  </a>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe maître (pour chiffrement)
              </label>
              <input
                type="password"
                value={gmailData.master_password}
                onChange={(e) => setGmailData({ ...gmailData, master_password: e.target.value })}
                className="input"
                placeholder="Votre mot de passe maître"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading.gmail}
              className="btn btn-primary w-full flex items-center justify-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading.gmail ? 'Enregistrement...' : 'Enregistrer Gmail'}
            </button>
          </form>
        </div>

        {/* OpenAI Configuration */}
        <div className="card">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Configuration OpenAI</h2>
              <p className="text-sm text-gray-600">Activez la génération de contenu avec IA</p>
            </div>
          </div>

          <form onSubmit={handleOpenAISubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API OpenAI
              </label>
              <input
                type="password"
                value={openaiData.api_key}
                onChange={(e) => setOpenaiData({ ...openaiData, api_key: e.target.value })}
                className="input"
                placeholder="sk-..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  Obtenez votre clé API OpenAI →
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe maître
              </label>
              <input
                type="password"
                value={openaiData.master_password}
                onChange={(e) => setOpenaiData({ ...openaiData, master_password: e.target.value })}
                className="input"
                placeholder="Votre mot de passe maître"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading.openai}
              className="btn btn-primary w-full flex items-center justify-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading.openai ? 'Enregistrement...' : 'Enregistrer OpenAI'}
            </button>
          </form>
        </div>

        {/* Security Note */}
        <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-100">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-primary-900">Sécurité & Confidentialité</h3>
              <div className="mt-2 text-sm text-primary-700 space-y-1">
                <p>✓ Vos credentials sont chiffrés avec Fernet (AES-256)</p>
                <p>✓ Le chiffrement utilise PBKDF2HMAC avec 100,000 itérations</p>
                <p>✓ Aucune donnée n'est envoyée vers des serveurs externes</p>
                <p>✓ Stockage local sécurisé dans data/credentials.enc</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
