import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SendEmail from './pages/SendEmail';
import SendEmailWizard from './pages/SendEmailWizard';
import Configuration from './pages/Configuration';
import ConfigurationWizard from './pages/ConfigurationWizard';
import History from './pages/History';
import HistoryTimeline from './pages/HistoryTimeline';
import Templates from './pages/Templates';
import TemplatesPro from './pages/TemplatesPro';
import AIGenerate from './pages/AIGenerate';
import AIMultimodal from './pages/AIMultimodal';
import DocumentAnalysis from './pages/DocumentAnalysis';
import Contacts from './pages/Contacts';
import Inbox from './pages/Inbox';
import VoiceTranscription from './pages/VoiceTranscription';
import Accessibility from './pages/Accessibility';
import FrenchAdmin from './pages/FrenchAdmin';
import EmailGenerator from './pages/EmailGenerator';

// Layout
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="send" element={<SendEmailWizard />} />
          <Route path="config" element={<ConfigurationWizard />} />
          <Route path="history" element={<HistoryTimeline />} />
          <Route path="templates" element={<TemplatesPro />} />
          <Route path="ai-multimodal" element={<AIMultimodal />} />
          <Route path="ai-generate" element={<AIGenerate />} />
          <Route path="document-analysis" element={<DocumentAnalysis />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="voice-transcription" element={<VoiceTranscription />} />
          <Route path="accessibility" element={<Accessibility />} />
          <Route path="french-admin" element={<FrenchAdmin />} />
          <Route path="email-generator" element={<EmailGenerator />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
