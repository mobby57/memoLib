import { useState } from 'react';
import { LogIn, UserPlus, LogOut } from 'lucide-react';
import workspaceApi from '../services/workspaceApi';

export default function AuthPanel({ onAuthChange }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      if (mode === 'login') {
        response = await workspaceApi.login({
          username: formData.username,
          password: formData.password
        });
      } else {
        response = await workspaceApi.register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
      }

      setCurrentUser(response.user);
      if (onAuthChange) onAuthChange(response.user);
      
      // Clear form
      setFormData({ username: '', email: '', password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    workspaceApi.logout();
    setCurrentUser(null);
    if (onAuthChange) onAuthChange(null);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (currentUser) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Connecté en tant que
            </h3>
            <p className="text-gray-400 mt-1">@{currentUser.username}</p>
            {currentUser.email && (
              <p className="text-sm text-gray-500">{currentUser.email}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">
          {mode === 'login' ? 'Connexion' : 'Inscription'}
        </h3>
        <p className="text-gray-400 text-sm">
          {mode === 'login' 
            ? 'Connectez-vous pour accéder à vos workspaces' 
            : 'Créez un compte pour commencer'}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            mode === 'login'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          <LogIn className="w-4 h-4 inline mr-2" />
          Connexion
        </button>
        <button
          onClick={() => {
            setMode('register');
            setError(null);
          }}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            mode === 'register'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          Inscription
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="votre_nom"
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="vous@exemple.com"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mot de passe
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="••••••••"
          />
          {mode === 'register' && (
            <p className="text-xs text-gray-500 mt-1">
              Minimum 6 caractères
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {mode === 'login' ? 'Connexion...' : 'Inscription...'}
            </span>
          ) : (
            mode === 'login' ? 'Se connecter' : "S'inscrire"
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-400">
        {mode === 'login' ? (
          <p>
            Pas encore de compte ?{' '}
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Inscrivez-vous
            </button>
          </p>
        ) : (
          <p>
            Déjà un compte ?{' '}
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Connectez-vous
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
