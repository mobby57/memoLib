import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Import du nouveau design system
import './styles/workspace-concept.css';
import './App.css';

// Pages avec le nouveau design
import ModernDashboard from './pages/ModernDashboard';
import EmailGenerator from './pages/EmailGenerator';
import Templates from './pages/Templates';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import WorkspaceManager from './components/WorkspaceManager';

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Dashboard principal avec nouveau design */}
            <Route path="/" element={<ModernDashboard />} />
            
            {/* Pages principales */}
            <Route path="/generate" element={<EmailGenerator />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/workspace" element={<WorkspaceManager />} />
            
            {/* Fallback vers le dashboard */}
            <Route path="*" element={<ModernDashboard />} />
          </Routes>

          {/* Notifications toast */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'white',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f43f5e',
                  secondary: 'white',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;