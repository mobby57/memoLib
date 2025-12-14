import { useState, useEffect } from 'react';
import { Send, Mail, FileText, Paperclip, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { emailAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SendEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    recipient: '',
    subject: '',
    body: '',
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  // Charger les données depuis localStorage ou URL params au montage
  useEffect(() => {
    // Vérifier les données générées par l'IA
    const generatedEmail = localStorage.getItem('generatedEmail');
    if (generatedEmail) {
      try {
        const data = JSON.parse(generatedEmail);
        setFormData({
          recipient: formData.recipient || '',
          subject: data.subject || '',
          body: data.body || '',
        });
        localStorage.removeItem('generatedEmail');
        toast.success('📝 Email généré chargé!');
      } catch (e) {
        console.error('Erreur parsing generatedEmail:', e);
      }
    }

    // Vérifier le template sélectionné
    const selectedTemplate = localStorage.getItem('selectedTemplate');
    if (selectedTemplate) {
      try {
        const template = JSON.parse(selectedTemplate);
        setFormData({
          recipient: formData.recipient || '',
          subject: template.subject || '',
          body: template.body || '',
        });
        localStorage.removeItem('selectedTemplate');
        toast.success('📋 Template chargé!');
      } catch (e) {
        console.error('Erreur parsing template:', e);
      }
    }

    // Vérifier les paramètres URL
    const params = new URLSearchParams(location.search);
    if (params.get('recipient') || params.get('subject') || params.get('body')) {
      setFormData({
        recipient: params.get('recipient') || '',
        subject: params.get('subject') || '',
        body: params.get('body') || '',
      });
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const sendWithPassword = async (pwd) => {
    const payload = { ...formData };
    if (pwd) {
      payload.password = pwd;
    }

    try {
      const response = await emailAPI.send(payload);
      
      if (response.data.success) {
        setProgress(100);
        toast.success('✅ Email envoyé avec succès!');
        setTimeout(() => navigate('/history'), 1500);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.data?.needsPassword) {
        setShowPasswordModal(true);
      } else if (error.response?.data?.needsSetup) {
        toast.error('Configuration Gmail requise');
        setTimeout(() => navigate('/config'), 2000);
      } else {
        toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
      }
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.recipient || !formData.subject || !formData.body) {
      toast.error('Tous les champs sont requis');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipient)) {
      toast.error('Email invalide');
      return;
    }

    setLoading(true);
    setProgress(30);

    setTimeout(() => setProgress(60), 300);
    setTimeout(() => setProgress(90), 600);

    await sendWithPassword();
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast.error('Mot de passe requis');
      return;
    }

    setShowPasswordModal(false);
    setLoading(true);
    setProgress(30);

    await sendWithPassword(password);
    setPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📧 Envoyer un email
          </h1>
          <p className="text-gray-600">
            Composez et envoyez votre email en toute sécurité
          </p>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Envoi en cours...</span>
              <span className="text-sm font-medium text-primary-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinataire *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="recipient"
                value={formData.recipient}
                onChange={handleChange}
                className="input pl-10"
                placeholder="exemple@email.com"
                required
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objet *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Objet de votre email"
                required
              />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              rows={10}
              className="input resize-none"
              placeholder="Écrivez votre message ici..."
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              {formData.body.length} caractères
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/ai-generate')}
            >
              ✨ Générer avec IA
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Envoyer l'email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              🔐 Mot de passe requis
            </h3>
            <p className="text-gray-600 mb-4">
              Session expirée. Entrez votre mot de passe maître pour continuer.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input mb-4"
              placeholder="Mot de passe maître"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <div className="flex space-x-3">
              <button
                onClick={handlePasswordSubmit}
                className="btn btn-primary flex-1"
              >
                Confirmer
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setLoading(false);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
