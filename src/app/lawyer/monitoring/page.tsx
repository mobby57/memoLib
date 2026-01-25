'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { 
  Database, Mail, Brain, Activity, CheckCircle, 
  AlertTriangle, Server, Zap, Shield, Cloud,
  Users, FileText, RefreshCw
} from 'lucide-react';

interface SystemStatus {
  name: string;
  status: 'online' | 'warning' | 'offline';
  icon: any;
  details: string;
  metrics?: Record<string, any>;
}

export default function MonitoringPage() {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadSystemsStatus();
    const interval = setInterval(loadSystemsStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadSystemsStatus() {
    setLoading(true);
    
    try {
      // Simuler le chargement des statuts (a remplacer par de vrais appels API)
      const statuses: SystemStatus[] = [
        {
          name: 'Base de Donnees',
          status: 'online',
          icon: Database,
          details: 'PostgreSQL connectee',
          metrics: {
            tenants: 3,
            users: 12,
            dossiers: 45,
          }
        },
        {
          name: 'Email Monitoring',
          status: 'online',
          icon: Mail,
          details: 'Gmail API active',
          metrics: {
            total: 10,
            unread: 6,
            critical: 3,
          }
        },
        {
          name: 'IA Locale (Ollama)',
          status: 'online',
          icon: Brain,
          details: 'Modele llama3.2 charge',
          metrics: {
            model: 'llama3.2:3b',
            uptime: '99.8%',
          }
        },
        {
          name: 'WebSocket',
          status: 'online',
          icon: Zap,
          details: 'Notifications temps reel',
          metrics: {
            connections: 5,
            port: 3001,
          }
        },
        {
          name: 'GitHub OAuth',
          status: 'online',
          icon: Server,
          details: 'Configuration complete',
          metrics: {
            appId: '2594935',
            connected: true,
          }
        },
        {
          name: 'Smart Forms',
          status: 'online',
          icon: FileText,
          details: 'Systeme operationnel',
          metrics: {
            submissions: 0,
            approvals: 0,
          }
        },
        {
          name: 'Cloudflare Tunnel',
          status: 'online',
          icon: Cloud,
          details: 'URL publique active',
          metrics: {
            url: 'basic-powder-stomach-jesus.trycloudflare.com',
          }
        },
        {
          name: 'Securite',
          status: 'online',
          icon: Shield,
          details: 'Tous les secrets configures',
          metrics: {
            encryption: true,
            rateLimit: true,
          }
        },
      ];

      setSystems(statuses);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur chargement statuts:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const onlineCount = systems.filter(s => s.status === 'online').length;
  const warningCount = systems.filter(s => s.status === 'warning').length;
  const offlineCount = systems.filter(s => s.status === 'offline').length;
  const globalHealth = Math.round((onlineCount / systems.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🎛️ Monitoring Systeme
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                etat en temps reel de tous les workflows avances
              </p>
            </div>
            
            <button
              onClick={loadSystemsStatus}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Derniere mise a jour : {lastUpdate.toLocaleTimeString('fr-FR')}
          </p>
        </div>

        {/* Score Global */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                etat Global du Systeme
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Tous les composants critiques
              </p>
            </div>
            
            <div className="text-center">
              <div className={`text-6xl font-bold ${
                globalHealth >= 90 ? 'text-green-600' : 
                globalHealth >= 70 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {globalHealth}%
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Sante globale
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-3xl font-bold text-green-600">{onlineCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">En ligne</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <div>
                  <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avertissements</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-red-600" />
                <div>
                  <div className="text-3xl font-bold text-red-600">{offlineCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Hors ligne</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grille des Systemes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systems.map((system, index) => {
            const Icon = system.icon;
            
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
              >
                {/* Header avec statut */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {system.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {system.details}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)} animate-pulse`} />
                  </div>

                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(system.status)}`}>
                    {system.status === 'online' ? ' Operationnel' : 
                     system.status === 'warning' ? '️ Attention' : 
                     ' Hors ligne'}
                  </div>
                </div>

                {/* Metriques */}
                {system.metrics && (
                  <div className="p-6 bg-gray-50 dark:bg-slate-900/50">
                    <div className="space-y-2">
                      {Object.entries(system.metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {typeof value === 'boolean' ? (value ? '' : '') : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions Rapides */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">[emoji] Actions Rapides</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-colors border border-white/30">
              <div className="font-semibold mb-1">[emoji] Voir les Emails</div>
              <div className="text-sm text-white/80">Consulter les emails classifies</div>
            </button>
            
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-colors border border-white/30">
              <div className="font-semibold mb-1">[emoji] Analytics IA</div>
              <div className="text-sm text-white/80">Dashboard d'apprentissage</div>
            </button>
            
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-colors border border-white/30">
              <div className="font-semibold mb-1">[emoji] Recherche Semantique</div>
              <div className="text-sm text-white/80">Chercher dans les dossiers</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
