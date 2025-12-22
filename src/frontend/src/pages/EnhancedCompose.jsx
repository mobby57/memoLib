import { useState, useEffect } from 'react';
import { Send, ArrowLeft, Save, Paperclip, Keyboard, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import FileUpload from '../components/FileUpload';
import { useTheme } from '../contexts/ThemeContext';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function EnhancedCompose() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  // Auto-save
  const { loadDraft, clearDraft } = useAutoSave(formData, 'compose');

  // Charger brouillon au démarrage
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.to || draft.subject || draft.body)) {
      setFormData({
        to: draft.to || '',
        subject: draft.subject || '',
        body: draft.body || ''
      });
    }
  }, []);

  // Raccourcis clavier
  useKeyboardShortcuts([
    { key: 'n', ctrl: true, action: () => { setFormData({ to: '', subject: '', body: '' }); clearDraft(); } },
    { key: 's', ctrl: true, action: () => { setShowDraftSaved(true); setTimeout(() => setShowDraftSaved(false), 2000); } },
    { key: 'enter', ctrl: true, action: sendEmail },
    { key: 'escape', action: () => navigate('/') }
  ]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sendEmail = async () => {
    if (!formData.to || !formData.subject) {
      alert('Veuillez remplir le destinataire et le sujet');
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          attachments: attachments.map(f => f.name),
          scheduledFor: scheduleDate || null
        })
      });

      const data = await response.json();
      if (data.success) {
        clearDraft();
        alert(scheduleDate ? 'Email programmé !' : 'Email envoyé !');
        navigate('/history');
      } else {
        alert('Erreur: ' + (data.error || 'Échec envoi'));
      }
    } catch (error) {
      alert('Erreur de connexion');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900'
    }`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                ✍️ Rédiger un Email
              </h1>
              <p className="text-gray-300">Composez votre message</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {showDraftSaved && (
              <div className="bg-green-500/20 border border-green-400/50 rounded-lg px-3 py-1">
                <span className="text-green-300 text-sm flex items-center gap-1">
                  <Save className="w-4 h-4" />
                  Auto-sauvé
                </span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Raccourcis */}
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Raccourcis :</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <span className="text-blue-200">Ctrl+N : Nouveau</span>
            <span className="text-blue-200">Ctrl+S : Sauver</span>
            <span className="text-blue-200">Ctrl+Enter : Envoyer</span>
            <span className="text-blue-200">Esc : Retour</span>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <div className="space-y-4">
            
            {/* Destinataire */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">À :</label>
              <input
                type="email"
                value={formData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
                placeholder="destinataire@email.com"
              />
            </div>

            {/* Sujet */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Sujet :</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
                placeholder="Objet de votre email"
              />
            </div>

            {/* Corps */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Message :</label>
              <textarea
                value={formData.body}
                onChange={(e) => handleInputChange('body', e.target.value)}
                className="w-full p-4 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none resize-none"
                rows="12"
                placeholder="Tapez votre message ici..."
              />
            </div>
          </div>
        </div>

        {/* Pièces jointes */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Pièces jointes
          </h2>
          <FileUpload 
            onFilesChange={setAttachments}
            maxFiles={5}
            maxSize={10}
          />
        </div>

        {/* Programmation */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Envoi programmé (optionnel)
          </h2>
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
            min={new Date().toISOString().slice(0, 16)}
          />
          {scheduleDate && (
            <p className="text-gray-300 text-sm mt-2">
              📅 Email programmé pour le {new Date(scheduleDate).toLocaleString('fr-FR')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={sendEmail}
            disabled={isSending || !formData.to || !formData.subject}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-6 h-6" />
            {isSending ? 'Envoi...' : scheduleDate ? 'Programmer' : 'Envoyer'}
          </button>
          
          <button
            onClick={() => navigate('/voice')}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 px-6 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            🎤 Mode Vocal
          </button>
        </div>
      </div>
    </div>
  );
}