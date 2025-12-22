import { useState } from 'react';
import { Wand2, Copy, Send, ArrowLeft, Save, Keyboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import FileUpload from '../components/FileUpload';
import { useTheme } from '../contexts/ThemeContext';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function EnhancedEmailGenerator() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('professionnel');
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  // Auto-save brouillon
  const { loadDraft, clearDraft } = useAutoSave(
    { context, tone, recipient, generatedEmail },
    'email_generator'
  );

  // Raccourcis clavier
  useKeyboardShortcuts([
    { key: 'n', ctrl: true, action: () => { setContext(''); setGeneratedEmail(null); } },
    { key: 's', ctrl: true, action: () => { setShowDraftSaved(true); setTimeout(() => setShowDraftSaved(false), 2000); } },
    { key: 'enter', ctrl: true, action: generateEmail },
    { key: 'g', ctrl: true, action: generateEmail }
  ]);

  const tones = [
    { id: 'professionnel', name: '💼 Professionnel', desc: 'Formel et courtois' },
    { id: 'amical', name: '😊 Amical', desc: 'Chaleureux et décontracté' },
    { id: 'urgent', name: '⚡ Urgent', desc: 'Direct et pressant' },
    { id: 'commercial', name: '💰 Commercial', desc: 'Persuasif et engageant' },
    { id: 'excuses', name: '🙏 Excuses', desc: 'Désolé et respectueux' },
    { id: 'remerciements', name: '🙏 Remerciements', desc: 'Reconnaissant et positif' }
  ];

  const generateEmail = async () => {
    if (!context.trim()) {
      alert('Veuillez saisir le contexte de votre email');
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ia/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ context, tone })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedEmail(data);
      } else {
        alert('Erreur: ' + (data.error || 'Échec de la génération'));
      }
    } catch (error) {
      alert('Erreur de connexion');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copié dans le presse-papiers !');
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
                🤖 Générateur Email IA
              </h1>
              <p className="text-gray-300">Créez des emails parfaits avec l'IA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {showDraftSaved && (
              <div className="bg-green-500/20 border border-green-400/50 rounded-lg px-3 py-1">
                <span className="text-green-300 text-sm flex items-center gap-1">
                  <Save className="w-4 h-4" />
                  Brouillon sauvé
                </span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Raccourcis clavier */}
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Raccourcis clavier :</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <span className="text-blue-200">Ctrl+N : Nouveau</span>
            <span className="text-blue-200">Ctrl+S : Sauver</span>
            <span className="text-blue-200">Ctrl+G : Générer</span>
            <span className="text-blue-200">Ctrl+Enter : Générer</span>
          </div>
        </div>

        {/* Contexte */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">📝 Contexte de l'email</h2>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full p-4 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none resize-none"
            rows="4"
            placeholder="Décrivez ce que vous voulez communiquer...

Exemple: Je dois confirmer la réunion de demain à 14h avec l'équipe marketing pour discuter du nouveau projet de site web."
          />
        </div>

        {/* Sélection du ton */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🎭 Ton de l'email</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tones.map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`p-4 rounded-lg border transition-all ${
                  tone === t.id
                    ? 'bg-blue-500/30 border-blue-400 scale-105'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="text-white font-semibold mb-1">{t.name}</div>
                <div className="text-gray-300 text-sm">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pièces jointes */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">📎 Pièces jointes</h2>
          <FileUpload 
            onFilesChange={setAttachments}
            maxFiles={5}
            maxSize={10}
          />
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <button
            onClick={generateEmail}
            disabled={isGenerating || !context.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-6 h-6" />
            {isGenerating ? 'Génération en cours...' : 'Générer l\'email'}
          </button>
        </div>

        {/* Email généré */}
        {generatedEmail && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">📧 Email généré</h2>
            
            {/* Sujet */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm">Sujet:</label>
                <button
                  onClick={() => copyToClipboard(generatedEmail.subject)}
                  className="text-blue-400 hover:text-blue-300 p-1"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <p className="text-white font-semibold">{generatedEmail.subject}</p>
              </div>
            </div>

            {/* Corps */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm">Corps de l'email:</label>
                <button
                  onClick={() => copyToClipboard(generatedEmail.body)}
                  className="text-blue-400 hover:text-blue-300 p-1"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white whitespace-pre-wrap">{generatedEmail.body}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Destinataire (optionnel)"
                className="flex-1 p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
              />
              <button
                onClick={generateEmail}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Wand2 className="w-5 h-5" />
                Régénérer
              </button>
              {recipient && (
                <button
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Envoyer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}