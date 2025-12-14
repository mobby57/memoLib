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
    <div className="login-page">
      <div className="login-container">
        <h1>🔐 IAPosteManager</h1>
        <p>Interface unifiée pour l'envoi d'emails</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Mode :</label>
            <div className="mode-toggle">
              <button
                type="button"
                className={isNewUser ? 'active' : ''}
                onClick={() => setIsNewUser(true)}
              >
                Nouveau compte
              </button>
              <button
                type="button"
                className={!isNewUser ? 'active' : ''}
                onClick={() => setIsNewUser(false)}
              >
                Compte existant
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Mot de passe maître :</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe sécurisé"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? '⏳ Connexion...' : '🚀 Se connecter'}
          </button>
        </form>

        <div className="login-features">
          <h3>✨ Fonctionnalités disponibles :</h3>
          <ul>
            <li>📧 Envoi d'emails avec IA</li>
            <li>🎤 Interface vocale</li>
            <li>♿ Mode accessible</li>
            <li>📊 Dashboard unifié</li>
          </ul>
        </div>
      </div>
    </div>
  );
}