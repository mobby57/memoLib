
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useStore = create(
  persist(
    (set, get) => ({
      // État
      user: null,
      emails: [],
      templates: [],
      contacts: [],
      loading: false,
      error: null,
      
      // Actions Auth
      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/auth/login', credentials);
          const { user, accessToken } = response.data;
          
          localStorage.setItem('token', accessToken);
          set({ user, loading: false });
          
          return { success: true };
        } catch (error) {
          set({ error: error.message, loading: false });
          return { success: false, error: error.message };
        }
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, emails: [], templates: [], contacts: [] });
      },
      
      // Actions Email
      generateEmail: async (context, tone = 'professional') => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/ai/generate', { context, tone });
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
      
      sendEmail: async (emailData) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/email/send', emailData);
          
          // Ajouter à l'historique
          const emails = get().emails;
          set({ 
            emails: [response.data, ...emails],
            loading: false 
          });
          
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
      
      // Actions Templates
      loadTemplates: async () => {
        try {
          const response = await api.get('/templates');
          set({ templates: response.data.templates });
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      // Actions Contacts
      loadContacts: async () => {
        try {
          const response = await api.get('/contacts');
          set({ contacts: response.data.contacts });
        } catch (error) {
          set({ error: error.message });
        }
      }
    }),
    {
      name: 'iaposte-store',
      partialize: (state) => ({ user: state.user })
    }
  )
);

export default useStore;
