import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './components/Dashboard/Dashboard';
import SendEmail from './pages/SendEmail.jsx';
import History from './pages/History.jsx';
import Contacts from './pages/Contacts.jsx';
import AIGenerate from './pages/AIGenerate.jsx';
import Configuration from './pages/Configuration.jsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // TODO: Add authentication check
  const isAuthenticated = true; // Temporary for development

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/send"
              element={isAuthenticated ? <SendEmail /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/history"
              element={isAuthenticated ? <History /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/contacts"
              element={isAuthenticated ? <Contacts /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/ai-generate"
              element={isAuthenticated ? <AIGenerate /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/configuration"
              element={isAuthenticated ? <Configuration /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#10B981',
                  secondary: '#fff',
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
