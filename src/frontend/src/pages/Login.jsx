import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store';

export default function Login() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const navigate = useNavigate();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    try {
      const result = await authService.login({ password, isNewUser });
      
      if (result.success) {
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('isAuthenticated', 'true');
        setAuthenticated(true); // Update Zustand store
        navigate('/'); // Navigate to dashboard
      } else {
        alert('Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur login:', error);
      alert('Erreur technique');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh">
      <div className="modern-card glass max-w-md w-full p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 gradient-text">🔐 IAPosteManager</h1>
          <p className="text-gray-600 dark:text-gray-300">Interface unifiée pour l'envoi d'emails</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Mode :</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`btn-modern ${isNewUser ? 'gradient-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                onClick={() => setIsNewUser(true)}
              >
                Nouveau compte
              </button>
              <button
                type="button"
                className={`btn-modern ${!isNewUser ? 'gradient-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                onClick={() => setIsNewUser(false)}
              >
                Compte existant
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Mot de passe maître :</label>
            <input
              id="password"
              data-testid="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe sécurisé"
              className="input-modern w-full"
              required
            />
          </div>

          <button 
            id="submit"
            data-testid="submit-button"
            type="submit" 
            disabled={loading} 
            className="btn-modern gradient-primary text-white w-full text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner" />
                <span>Connexion...</span>
              </span>
            ) : (
              '🚀 Se connecter'
            )}
          </button>
        </form>

        <div className="mt-8 p-6 glass-dark rounded-xl animate-slide-in-right">
          <h3 className="text-lg font-semibold mb-4 gradient-text">✨ Fonctionnalités disponibles :</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 feature-card">
              <span className="text-2xl">📧</span>
              <span>Envoi d'emails avec IA</span>
            </li>
            <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 feature-card">
              <span className="text-2xl">🎤</span>
              <span>Interface vocale</span>
            </li>
            <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 feature-card">
              <span className="text-2xl">♿</span>
              <span>Mode accessible</span>
            </li>
            <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 feature-card">
              <span className="text-2xl">📊</span>
              <span>Dashboard unifié</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}