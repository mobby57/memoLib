/**
 * Centralized API Service
 */

import logger from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = localStorage.getItem('token')
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      logger.apiError(endpoint, error, { method: options.method || 'GET' });
      throw error
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  }

  async logout() {
    return this.request('/api/auth/logout', { method: 'POST' })
  }

  async refreshToken() {
    return this.request('/api/auth/refresh', { method: 'POST' })
  }

  // Email endpoints
  async getEmailHistory() {
    return this.request('/api/email-history')
  }

  async sendEmail(emailData) {
    return this.request('/api/emails', {
      method: 'POST',
      body: JSON.stringify(emailData)
    })
  }

  // Contacts endpoints
  async getContacts() {
    return this.request('/api/contacts')
  }

  async createContact(contactData) {
    return this.request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData)
    })
  }

  async updateContact(id, contactData) {
    return this.request(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData)
    })
  }

  async deleteContact(id) {
    return this.request(`/api/contacts/${id}`, { method: 'DELETE' })
  }

  // Templates endpoints
  async getTemplates() {
    return this.request('/api/templates')
  }

  async createTemplate(templateData) {
    return this.request('/api/templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    })
  }

  async updateTemplate(id, templateData) {
    return this.request(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData)
    })
  }

  async deleteTemplate(id) {
    return this.request(`/api/templates/${id}`, { method: 'DELETE' })
  }

  // Inbox endpoints
  async getInboxMessages() {
    return this.request('/api/inbox/messages')
  }

  // AI endpoints
  async generateEmail(context, instruction) {
    return this.request('/api/generate-email', {
      method: 'POST',
      body: JSON.stringify({ contexte: context, instruction })
    })
  }

  async analyzeDocument(text) {
    return this.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ texte: text })
    })
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

export const apiService = new ApiService()
export default apiService