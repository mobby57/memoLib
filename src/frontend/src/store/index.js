import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasCredentials: false,
      needsPassword: false,
      
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setHasCredentials: (value) => set({ hasCredentials: value }),
      setNeedsPassword: (value) => set({ needsPassword: value }),
      
      logout: () => set({ 
        isAuthenticated: false, 
        needsPassword: false 
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useEmailStore = create((set) => ({
  emails: [],
  loading: false,
  error: null,
  
  setEmails: (emails) => set({ emails }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addEmail: (email) => set((state) => ({ 
    emails: [email, ...state.emails] 
  })),
}));

export const useConfigStore = create((set) => ({
  gmailConfigured: false,
  openaiConfigured: false,
  
  setGmailConfigured: (value) => set({ gmailConfigured: value }),
  setOpenaiConfigured: (value) => set({ openaiConfigured: value }),
}));
