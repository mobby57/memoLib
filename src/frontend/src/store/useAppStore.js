import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useAppStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        emails: [],
        stats: { emailsSent: 0, aiGenerated: 0, templates: 0, contacts: 0 },
        loading: false,
        error: null,

        // Actions
        setUser: (user) => set({ user }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        
        addEmail: (email) => set(state => ({ 
          emails: [...state.emails, email],
          stats: { ...state.stats, emailsSent: state.stats.emailsSent + 1 }
        })),

        loadDashboard: async () => {
          set({ loading: true, error: null });
          try {
            const response = await fetch('/api/dashboard/stats');
            const data = await response.json();
            set({ stats: data.stats || get().stats, loading: false });
          } catch (error) {
            set({ error: error.message, loading: false });
          }
        },

        // Selectors
        getRecentEmails: () => get().emails.slice(-5),
        getTotalEmails: () => get().emails.length
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ user: state.user, stats: state.stats })
      }
    )
  )
);

export default useAppStore;