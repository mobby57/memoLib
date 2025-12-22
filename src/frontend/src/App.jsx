import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Compose from './pages/Compose';
import AIGenerator from './pages/AIGenerator';
import Voice from './pages/Voice';
import Templates from './pages/Templates';
import History from './pages/History';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import Accessibility from './pages/Accessibility';

// Services
import { apiService } from './services/api';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Initialisation rapide
    const init = async () => {
      try {
        // Vérifier la santé de l'API
        await apiService.health?.check?.() || fetch('/api/health');
        setIsLoading(false);
      } catch (error) {
        console.warn('API non disponible:', error);
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement d'IAPosteManager...</p>
        </div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/compose" element={<Compose />} />
              <Route path="/ai-generator" element={<AIGenerator />} />
              <Route path="/voice" element={<Voice />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/history" element={<History />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/accessibility" element={<Accessibility />} />
            </Routes>
          </div>
        </main>
        
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;