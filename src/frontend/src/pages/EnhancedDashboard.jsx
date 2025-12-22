import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, Mail, History, Users, FileText, Settings, 
  BarChart3, Zap, Clock, Star, Search, Plus 
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import AnalysisDashboard from '../components/AnalysisDashboard';
import AlertNotification from '../components/AlertNotification';
import { AlertManager } from '../components/AlertNotification';
import { useTheme } from '../contexts/ThemeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function EnhancedDashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    totalEmails: 0,
    todayEmails: 0,
    drafts: 0,
    scheduled: 0
  });
  const [recentEmails, setRecentEmails] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState([]);

  // Raccourcis clavier
  useKeyboardShortcuts([
    { key: 'v', ctrl: true, action: () => navigate('/voice') },
    { key: 'c', ctrl: true, action: () => navigate('/compose') },
    { key: 'h', ctrl: true, action: () => navigate('/history') },
    { key: 'g', ctrl: true, action: () => navigate('/email-generator') },
    { key: 'f', ctrl: true, action: () => document.getElementById('search')?.focus() }
  ]);

  useEffect(() => {
    // Charger les statistiques
    const loadStats = () => {
      const drafts = localStorage.getItem('draft_compose') || localStorage.getItem('draft_email_generator');
      setStats({
        totalEmails: 42,
        todayEmails: 7,
        drafts: drafts ? 1 : 0,
        scheduled: 2
      });
    };
    loadStats();

    // S'abonner aux alertes
    const unsubscribe = AlertManager.subscribe((alert) => {
      setAlerts(prev => [...prev, { ...alert, id: Date.now() }]);
    });

    return unsubscribe;
  }, []);

  const quickActions = [
    { 
      icon: Mic, 
      title: 'Assistant Vocal', 
      desc: 'Parlez → IA → Email',
      color: 'from-red-500 to-pink-500',
      path: '/voice',
      shortcut: 'Ctrl+V'
    },
    { 
      icon: Mail, 
      title: 'Rédiger', 
      desc: 'Composer un email',
      color: 'from-blue-500 to-cyan-500',
      path: '/compose',
      shortcut: 'Ctrl+C'
    },
    { 
      icon: Zap, 
      title: 'Générateur IA', 
      desc: 'Créer avec l\'IA',
      color: 'from-purple-500 to-indigo-500',
      path: '/email-generator',
      shortcut: 'Ctrl+G'
    },
    { 
      icon: History, 
      title: 'Historique', 
      desc: 'Emails envoyés',
      color: 'from-green-500 to-emerald-500',
      path: '/history',
      shortcut: 'Ctrl+H'
    }
  ];

  const features = [
    { icon: Users, title: 'Contacts', path: '/contacts' },
    { icon: FileText, title: 'Modèles', path: '/templates' },
    { icon: BarChart3, title: 'Analyse IA', path: '/ia-analysis' },
    { icon: Settings, title: 'Paramètres', path: '/settings' }
  ];

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900'
    }`}>
      {/* Notifications d'alertes */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alerts.map((alert) => (
          <AlertNotification
            key={alert.id}
            alert={alert}
            onDismiss={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              🚀 IAPosteManager
            </h1>
            <p className="text-gray-300">Assistant email intelligent avec IA</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher... (Ctrl+F)"
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Raccourcis info */}
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-blue-200">
            <span>Ctrl+V : Vocal</span>
            <span>Ctrl+C : Composer</span>
            <span>Ctrl+G : Générateur</span>
            <span>Ctrl+H : Historique</span>
            <span>Ctrl+F : Recherche</span>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total emails</p>
                <p className="text-2xl font-bold text-white">{stats.totalEmails}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Aujourd'hui</p>
                <p className="text-2xl font-bold text-white">{stats.todayEmails}</p>
              </div>
              <Zap className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Brouillons</p>
                <p className="text-2xl font-bold text-white">{stats.drafts}</p>
              </div>
              <FileText className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Programmés</p>
                <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">⚡ Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`bg-gradient-to-r ${action.color} p-6 rounded-xl text-white hover:scale-105 transition-transform group`}
              >
                <action.icon className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90 mb-3">{action.desc}</p>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">{action.shortcut}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🛠️ Fonctionnalités</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => navigate(feature.path)}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors group"
              >
                <feature.icon className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium">{feature.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tableau de bord intelligent */}
        <div className="mb-8">
          <AnalysisDashboard />
        </div>

        {/* Activité récente */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">📈 Activité récente</h2>
            <button
              onClick={() => navigate('/history')}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              Voir tout <History className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {[
              { type: 'sent', to: 'client@example.com', subject: 'Proposition commerciale', time: '2h' },
              { type: 'draft', to: 'equipe@example.com', subject: 'Réunion hebdomadaire', time: '4h' },
              { type: 'scheduled', to: 'partenaire@example.com', subject: 'Suivi projet', time: 'Demain 9h' }
            ].map((email, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    email.type === 'sent' ? 'bg-green-400' : 
                    email.type === 'draft' ? 'bg-yellow-400' : 'bg-purple-400'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{email.subject}</p>
                    <p className="text-gray-400 text-sm">À: {email.to}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">{email.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}