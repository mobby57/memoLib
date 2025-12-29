/**
 * Authentication Service
 * Gère l'authentification utilisateur avec JWT
 */

import logger from '../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class AuthService {
  /**
   * Login utilisateur
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur de connexion');
      }

      const data = await response.json();
      return {
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      logger.error('Login failed', error, { email, endpoint: '/auth/login' });
      throw error;
    }
  }

  /**
   * Register utilisateur
   */
  async register(userData) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur d\'inscription');
      }

      const data = await response.json();
      return {
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      logger.error('Registration failed', error, { endpoint: '/auth/register' });
      throw error;
    }
  }

  /**
   * Valide le token JWT
   */
  async validateToken(token) {
    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      logger.warn('Token validation failed', { endpoint: '/auth/validate' });
      return null;
    }
  }

  /**
   * Logout utilisateur
   */
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  /**
   * Récupère le token stocké
   */
  getToken() {
    return localStorage.getItem('auth_token');
  }

  /**
   * Récupère les données utilisateur stockées
   */
  getUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Sauvegarde les données utilisateur
   */
  saveUser(user) {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Récupère les headers avec authentification
   */
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }
}

export const authService = new AuthService();
export default authService;
