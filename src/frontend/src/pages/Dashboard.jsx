import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, emailAPI } from '../services/api';
import { 
  EnvelopeIcon, 
  SparklesIcon, 
  UserGroupIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_emails: 0,
    ai_generations: 0,
    accessibility_users: 0,
    templates_count: 0,
    success_rate: 0,
    today_emails: 0,
    week_trend: 0
  });
  const [recentEmails, setRecentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboardData, emailHistory] = await Promise.all([
        dashboardAPI.getStats().catch((err) => {
          // Ne pas logger si c'est une erreur 401 (non authentifié)
          if (!err.message?.includes('401')) {
            console.warn('Erreur stats:', err.message);
          }
          return {
            total_emails: 0,
            ai_generations: 0,
            accessibility_users: 0,
            templates_count: 0,
            success_rate: 95,
            today_emails: 0,
            week_trend: 5.2
          };
        }),
        emailAPI.getHistory(5).catch((err) => {
          // Ne pas logger si c'est une erreur 401 (non authentifié)
          if (!err.message?.includes('401')) {
            console.warn('Erreur historique:', err.message);
          }
          return { emails: [] };
        })
      ]);
      
      setStats(dashboardData);
      setRecentEmails(emailHistory.emails || emailHistory || []);
      setError(null);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-4xl font-bold text-white mb-2">{value.toLocaleString()}</h3>
          {subtitle && <p className="text-white/70 text-xs">{subtitle}</p>}
        </div>
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-2">
          {trend >= 0 ? (
            <ArrowTrendingUpIcon className="w-4 h-4 text-white" />
          ) : (
            <ArrowTrendingDownIcon className="w-4 h-4 text-white" />
          )}
          <span className="text-white/90 text-sm font-semibold">
            {trend >= 0 ? '+' : ''}{trend}% cette semaine
          </span>
        </div>
      )}
    </div>
  );

  const QuickAction = ({ title, description, icon: Icon, onClick, color }) => (
    <button
      onClick={onClick}
      className={`group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-${color}-500 text-left w-full`}
    >
      <div className="flex items-start gap-4">
        <div className={`bg-gradient-to-br ${color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );

  const RecentEmailItem = ({ email, index }) => {
    const statusColor = email.status === 'sent' ? 'green' : email.status === 'failed' ? 'red' : 'yellow';
    const StatusIcon = email.status === 'sent' ? CheckCircleIcon : XCircleIcon;
    
    return (
      <div 
        className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 border-b border-gray-100 last:border-0"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className={`bg-${statusColor}-100 p-2 rounded-lg`}>
          <StatusIcon className={`w-5 h-5 text-${statusColor}-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{email.subject || 'Sans objet'}</p>
          <p className="text-xs text-gray-500 truncate">{email.recipient || email.to}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">{formatDate(email.timestamp || email.date)}</p>
        </div>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-8 rounded-2xl border-2 border-red-200">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-2">Erreur de chargement</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="btn btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* En-tête */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Tableau de bord
              </h1>
              <p className="text-gray-600 text-lg">
                Bienvenue sur IAPosteManager - Gérez vos communications intelligemment
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Dernière mise à jour</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Emails envoyés"
            value={stats.total_emails}
            icon={EnvelopeIcon}
            trend={stats.week_trend}
            color="from-blue-500 to-blue-600"
            subtitle={`${stats.today_emails || 0} aujourd'hui`}
          />
          <StatCard
            title="Générations IA"
            value={stats.ai_generations}
            icon={SparklesIcon}
            trend={8.3}
            color="from-purple-500 to-purple-600"
            subtitle="Contenu automatisé"
          />
          <StatCard
            title="Taux de succès"
            value={`${stats.success_rate}%`}
            icon={CheckCircleIcon}
            color="from-green-500 to-green-600"
            subtitle="Emails délivrés"
          />
          <StatCard
            title="Templates actifs"
            value={stats.templates_count || 0}
            icon={DocumentTextIcon}
            color="from-orange-500 to-orange-600"
            subtitle="Prêts à l'emploi"
          />
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-primary-600" />
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction
              title="Envoyer un email"
              description="Composez et envoyez un nouvel email"
              icon={EnvelopeIcon}
              onClick={() => navigate('/send')}
              color="from-blue-500 to-blue-600"
            />
            <QuickAction
              title="Générer avec IA"
              description="Créez du contenu automatiquement"
              icon={SparklesIcon}
              onClick={() => navigate('/ai-multimodal')}
              color="from-purple-500 to-purple-600"
            />
            <QuickAction
              title="Analyse vocale"
              description="Dictez vos emails par la voix"
              icon={MicrophoneIcon}
              onClick={() => navigate('/voice-transcription')}
              color="from-green-500 to-green-600"
            />
            <QuickAction
              title="Mes templates"
              description="Gérez vos modèles d'emails"
              icon={DocumentTextIcon}
              onClick={() => navigate('/templates')}
              color="from-orange-500 to-orange-600"
            />
            <QuickAction
              title="Historique"
              description="Consultez vos emails envoyés"
              icon={ClockIcon}
              onClick={() => navigate('/history')}
              color="from-pink-500 to-pink-600"
            />
            <QuickAction
              title="Configuration"
              description="Paramétrez votre compte"
              icon={AdjustmentsHorizontalIcon}
              onClick={() => navigate('/config')}
              color="from-indigo-500 to-indigo-600"
            />
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ClockIcon className="w-8 h-8 text-primary-600" />
              Activité récente
            </h2>
            <button 
              onClick={() => navigate('/history')}
              className="text-primary-600 hover:text-primary-700 font-semibold text-sm hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="space-y-2">
            {recentEmails.length > 0 ? (
              recentEmails.map((email, index) => (
                <RecentEmailItem key={index} email={email} index={index} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <EnvelopeIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucune activité récente</p>
                <p className="text-sm mt-2">Commencez par envoyer votre premier email !</p>
                <button
                  onClick={() => navigate('/send')}
                  className="btn btn-primary mt-4"
                >
                  Envoyer un email
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}