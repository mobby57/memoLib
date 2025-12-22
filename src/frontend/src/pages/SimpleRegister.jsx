import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

export default function SimpleRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Compte créé ! Redirection...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage('❌ ' + (data.error || 'Erreur création compte'));
      }
    } catch (error) {
      setMessage('❌ Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Créer un compte</h1>
          <p className="text-gray-300">Simple et rapide !</p>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 p-3 bg-white/10 rounded-lg border border-white/20">
            <p className="text-white text-center text-sm">{message}</p>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Nom */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Votre nom
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
              placeholder="Ex: Marie Dupont"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Votre email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
              placeholder="votre@email.com"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength="6"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
              placeholder="Au moins 6 caractères"
            />
            <p className="text-gray-400 text-xs mt-1">Minimum 6 caractères</p>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Création...' : '✅ Créer mon compte'}
          </button>
        </form>

        {/* Lien connexion */}
        <div className="text-center mt-6">
          <p className="text-gray-300 text-sm">
            Déjà un compte ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Se connecter
            </button>
          </p>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-500/20 rounded-lg border border-blue-400/50">
          <p className="text-blue-200 text-sm text-center">
            💡 <strong>Une fois connectée :</strong><br/>
            Parlez → L'IA écrit vos emails → Envoi automatique !
          </p>
        </div>
      </div>
    </div>
  );
}