import { create } from 'zustand'

// Auth Store
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  
  login: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true })
  },
  
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('token')
    if (token) {
      // TODO: Verify token with backend
      set({ token, isAuthenticated: true })
    }
  }
}))

// Email Store
export const useEmailStore = create((set, get) => ({
  emails: [],
  loading: false,
  error: null,
  
  fetchEmails: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/email-history')
      const data = await response.json()
      set({ emails: data.emails, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  sendEmail: async (emailData) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      })
      const result = await response.json()
      set({ loading: false })
      return result
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
}))

// Contacts Store
export const useContactsStore = create((set, get) => ({
  contacts: [],
  loading: false,
  error: null,
  
  fetchContacts: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()
      set({ contacts: data.contacts, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  addContact: async (contactData) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      })
      const newContact = await response.json()
      set(state => ({ 
        contacts: [...state.contacts, newContact], 
        loading: false 
      }))
      return newContact
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
}))

// Templates Store
export const useTemplatesStore = create((set, get) => ({
  templates: [],
  loading: false,
  error: null,
  
  fetchTemplates: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()
      set({ templates: data.templates, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  updateTemplate: async (id, templateData) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })
      const updatedTemplate = await response.json()
      set(state => ({
        templates: state.templates.map(t => t.id === id ? updatedTemplate : t),
        loading: false
      }))
      return updatedTemplate
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  deleteTemplate: async (id) => {
    set({ loading: true, error: null })
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      set(state => ({
        templates: state.templates.filter(t => t.id !== id),
        loading: false
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
}))