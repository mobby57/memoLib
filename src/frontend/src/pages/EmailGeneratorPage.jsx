import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Send, Loader2 } from 'lucide-react';

/* eslint-disable no-alert, no-undef */

export default function EmailGenerator() {
  const navigate = useNavigate();
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('professionnel');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(null);
  const [recipient, setRecipient] = useState('');

  const tones = [
    { value: 'professionnel', label: '💼 Professionnel' },
    { value: 'amical', label: '😊 Amical' },
    { value: 'formel', label: '🎩 Formel' },
    { value: 'urgent', label: '⚡ Urgent' },
    { value: 'persuasif', label: '🎯 Persuasif' }
  ];

  const generateEmail = async () => {
    if (!context.trim()) {
      alert('Veuillez décrire le contexte de l\'email');
      return;
    }

    setLoading(true);
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
        setEmail(data);
      } else {
        alert('Erreur: ' + (data.error || 'Génération échouée'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!recipient.trim()) {
      alert('Veuillez entrer une adresse email');
      return;
    }

    if (!email) {
      alert('Générez d\'abord un email');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: recipient,
          subject: email.subject,
          body: email.body
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Email envoyé avec succès!');
        setEmail(null);
        setContext('');
        setRecipient('');
      } else {
        alert('Erreur: ' + (data.error || 'Envoi échoué'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur d\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">✨ Générateur d'Email IA</h1>
            <p className="text-blue-200">Propulsé par Llama 3.1 - 100% Gratuit</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">📝 Contexte</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Décrivez votre email
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ex: Demande de congés du 24 au 31 décembre pour les fêtes de fin d'année"
                  className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3 h-32 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Ton de l'email
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 focus:ring-2 focus:ring-purple-500"
                >
                  {tones.map(t => (
                    <option key={t.value} value={t.value} className="bg-gray-900">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={generateEmail}
                disabled={loading || !context.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Générer avec IA
                  </>
                )}
              </button>

              <div className="text-xs text-gray-300 text-center">
                💰 Coût: 0€ (Llama 3.1 local)
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">📧 Email Généré</h2>
            
            {!email ? (
              <div className="text-center py-12 text-gray-400">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Décrivez votre contexte et cliquez sur<br />"Générer avec IA"</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Objet
                  </label>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-3 text-white">
                    {email.subject}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Corps du message
                  </label>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-3 text-white whitespace-pre-wrap h-64 overflow-y-auto">
                    {email.body}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Destinataire
                  </label>
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="email@exemple.com"
                    className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  onClick={sendEmail}
                  disabled={loading || !recipient.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer l'email
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setEmail(null);
                    setContext('');
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all"
                >
                  Nouvelle génération
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
