/**
 * Workspace API Service - PostgreSQL Backend (API v2)
 * Handles all workspace-related API calls with JWT authentication
 */

import logger from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class WorkspaceApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get JWT token from localStorage
   */
  getToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  /**
   * Set JWT token in localStorage
   */
  setToken(token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token); // Backward compatibility
  }

  /**
   * Remove JWT token from localStorage
   */
  clearToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
  }

  /**
   * Generic API request handler
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      logger.apiCall(endpoint, { method: options.method || 'GET' });
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      logger.apiError(endpoint, error, { method: options.method || 'GET' });
      throw error;
    }
  }

  // ============================================================
  // AUTH ENDPOINTS
  // ============================================================

  /**
   * Register new user
   * @param {Object} userData - {username, email, password, role?}
   * @returns {Promise<{message, user}>}
   */
  async register(userData) {
    const response = await this.request('/api/v2/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.user?.token) {
      this.setToken(response.user.token);
    }
    
    return response;
  }

  /**
   * Login user
   * @param {Object} credentials - {username, password}
   * @returns {Promise<{message, user}>}
   */
  async login(credentials) {
    const response = await this.request('/api/v2/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.user?.token) {
      this.setToken(response.user.token);
    }
    
    return response;
  }

  /**
   * Get current user info
   * @returns {Promise<{user}>}
   */
  async getCurrentUser() {
    return this.request('/api/v2/auth/me', {
      method: 'GET'
    });
  }

  /**
   * Logout (clear token)
   */
  logout() {
    this.clearToken();
  }

  // ============================================================
  // WORKSPACE ENDPOINTS
  // ============================================================

  /**
   * List user's workspaces with optional filters
   * @param {Object} filters - {status?, priority?, source?, limit?}
   * @returns {Promise<{workspaces}>}
   */
  async listWorkspaces(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.source) params.append('source', filters.source);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `/api/v2/workspaces?${queryString}` 
      : '/api/v2/workspaces';
    
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Create new workspace
   * @param {Object} workspaceData - {title, source?, status?, priority?}
   * @returns {Promise<{message, workspace}>}
   */
  async createWorkspace(workspaceData) {
    return this.request('/api/v2/workspaces', {
      method: 'POST',
      body: JSON.stringify(workspaceData)
    });
  }

  /**
   * Get workspace by ID
   * @param {number} workspaceId
   * @returns {Promise<{workspace}>}
   */
  async getWorkspace(workspaceId) {
    return this.request(`/api/v2/workspaces/${workspaceId}`, {
      method: 'GET'
    });
  }

  /**
   * Update workspace
   * @param {number} workspaceId
   * @param {Object} updates - {title?, status?, priority?, progress?, description?}
   * @returns {Promise<{message, workspace}>}
   */
  async updateWorkspace(workspaceId, updates) {
    return this.request(`/api/v2/workspaces/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Delete workspace
   * @param {number} workspaceId
   * @returns {Promise<{message}>}
   */
  async deleteWorkspace(workspaceId) {
    return this.request(`/api/v2/workspaces/${workspaceId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================
  // MESSAGE ENDPOINTS
  // ============================================================

  /**
   * List messages in a workspace
   * @param {number} workspaceId
   * @returns {Promise<{messages}>}
   */
  async listMessages(workspaceId) {
    return this.request(`/api/v2/workspaces/${workspaceId}/messages`, {
      method: 'GET'
    });
  }

  /**
   * Add message to workspace
   * @param {number} workspaceId
   * @param {Object} messageData - {role, content, metadata?}
   * @returns {Promise<{message, data}>}
   */
  async addMessage(workspaceId, messageData) {
    return this.request(`/api/v2/workspaces/${workspaceId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  }

  // ============================================================
  // STATS & HEALTH
  // ============================================================

  /**
   * Get user statistics
   * @returns {Promise<{stats}>}
   */
  async getUserStats() {
    return this.request('/api/v2/stats', {
      method: 'GET'
    });
  }

  /**
   * Health check
   * @returns {Promise<{status, database, version}>}
   */
  async healthCheck() {
    return this.request('/api/v2/health', {
      method: 'GET'
    });
  }
}

// Export singleton instance
const workspaceApi = new WorkspaceApiService();
export default workspaceApi;
