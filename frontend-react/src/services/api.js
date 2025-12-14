import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Services Email
export const emailAPI = {
  send: (emailData) => api.post('/email/send', emailData),
  getHistory: () => api.get('/email/history')
}

// Services IA
export const aiAPI = {
  generate: (prompt, tone = 'professional') => 
    api.post('/ai/generate', { prompt, tone })
}

// Services Vocal
export const voiceAPI = {
  transcribe: (audioData) => api.post('/voice/transcribe', audioData),
  speak: (text) => api.post('/voice/speak', { text })
}

// Services Auth
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout')
}

// Services Configuration
export const configAPI = {
  getSettings: () => api.get('/config/settings'),
  updateSettings: (settings) => api.post('/config/settings', settings)
}

// Services Templates
export const templateAPI = {
  getAll: () => api.get('/templates'),
  create: (template) => api.post('/templates', template)
}

// Services Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
}

export default api