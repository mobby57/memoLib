'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Mail, MessageSquare, Phone, Video, 
  Slack, Users, Linkedin, Twitter,
  FileText, Settings, AlertTriangle, Clock,
  Search, Filter, RefreshCw, Download,
  CheckCircle, XCircle, Clock3, Loader2
} from 'lucide-react';

// Types
interface ChannelMessage {
  id: string;
  channel: string;
  direction: string;
  status: string;
  sender: { name?: string; email?: string; phone?: string };
  subject?: string;
  body: string;
  aiAnalysis?: {
    summary?: string;
    urgency: string;
    category?: string;
    tags: string[];
  };
  timestamps: {
    received: string;
    processed?: string;
  };
  clientId?: string;
  dossierId?: string;
}

interface ChannelStats {
  byChannel: { channel: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byUrgency: { urgency: string; count: number }[];
  pendingMessages: number;
  urgentMessages: number;
  totalMessages: number;
}

// Icônes par canal
const channelIcons: Record<string, any> = {
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  SMS: Phone,
  VOICE: Video,
  SLACK: Slack,
  TEAMS: Users,
  LINKEDIN: Linkedin,
  TWITTER: Twitter,
  FORM: FileText,
  DOCUMENT: FileText,
  DECLAN: Settings,
  INTERNAL: Users,
};

// Couleurs par canal
const channelColors: Record<string, string> = {
  EMAIL: 'bg-blue-500',
  WHATSAPP: 'bg-green-500',
  SMS: 'bg-purple-500',
  VOICE: 'bg-orange-500',
  SLACK: 'bg-pink-500',
  TEAMS: 'bg-indigo-500',
  LINKEDIN: 'bg-blue-700',
  TWITTER: 'bg-sky-500',
  FORM: 'bg-gray-500',
  DOCUMENT: 'bg-amber-500',
  DECLAN: 'bg-teal-500',
  INTERNAL: 'bg-gray-600',
};

// Couleurs urgence
const urgencyColors: Record<string, string> = {
  LOW: 'text-gray-500 bg-gray-100',
  MEDIUM: 'text-yellow-700 bg-yellow-100',
  HIGH: 'text-orange-700 bg-orange-100',
  CRITICAL: 'text-red-700 bg-red-100',
};

export default function MultiChannelDashboard() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('7d');
  const [selectedMessage, setSelectedMessage] = useState<ChannelMessage | null>(null);

  // Charger les messages
  const loadMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedChannel) params.set('channel', selectedChannel);
      if (selectedStatus) params.set('status', selectedStatus);
      
      const response = await fetch(`/api/multichannel/messages?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  }, [selectedChannel, selectedStatus]);

  // Charger les stats
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/multichannel/stats?period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  }, [period]);

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadMessages(), loadStats()]);
      setLoading(false);
    };
    loadData();
  }, [loadMessages, loadStats]);

  // Filtrer les messages par recherche
  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      msg.body.toLowerCase().includes(search) ||
      msg.subject?.toLowerCase().includes(search) ||
      msg.sender.name?.toLowerCase().includes(search) ||
      msg.sender.email?.toLowerCase().includes(search)
    );
  });

  // Rafraîchir les données
  const refresh = async () => {
    setLoading(true);
    await Promise.all([loadMessages(), loadStats()]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Chargement des données multi-canal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">?? Centre de Communication Multi-Canal</h1>
            <p className="text-gray-500 mt-1">Tous vos canaux de communication centralisés</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="24h">Dernières 24h</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
            </select>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Messages */}
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalMessages || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Messages en attente */}
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">En attente</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.pendingMessages || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Messages urgents */}
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Urgents</p>
                <p className="text-3xl font-bold text-red-600">{stats?.urgentMessages || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Canaux actifs */}
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Canaux actifs</p>
                <p className="text-3xl font-bold text-green-600">{stats?.byChannel?.length || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Filters */}
      <div className="px-6 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedChannel(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !selectedChannel ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Tous les canaux
          </button>
          {Object.entries(channelIcons).map(([channel, Icon]) => (
            <button
              key={channel}
              onClick={() => setSelectedChannel(channel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedChannel === channel 
                  ? `${channelColors[channel]} text-white` 
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {channel}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value || null)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="RECEIVED">Reçu</option>
              <option value="PROCESSING">En traitement</option>
              <option value="PROCESSED">Traité</option>
              <option value="FAILED">Échoué</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Messages ({filteredMessages.length})</h2>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun message trouvé</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const Icon = channelIcons[msg.channel] || Mail;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedMessage?.id === msg.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${channelColors[msg.channel]}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 truncate">
                            {msg.sender.name || msg.sender.email || msg.sender.phone || 'Inconnu'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamps.received).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        {msg.subject && (
                          <p className="text-sm font-medium text-gray-700 truncate mb-1">
                            {msg.subject}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {msg.aiAnalysis?.summary || msg.body}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {msg.aiAnalysis?.urgency && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColors[msg.aiAnalysis.urgency]}`}>
                              {msg.aiAnalysis.urgency}
                            </span>
                          )}
                          {msg.aiAnalysis?.category && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {msg.aiAnalysis.category}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            msg.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                            msg.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {msg.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stats & Details Panel */}
        <div className="space-y-4">
          {/* Message Details */}
          {selectedMessage && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Détails du message</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Canal</label>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const Icon = channelIcons[selectedMessage.channel];
                      return <Icon className="w-4 h-4" />;
                    })()}
                    <span className="font-medium">{selectedMessage.channel}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Expéditeur</label>
                  <p className="font-medium">
                    {selectedMessage.sender.name || selectedMessage.sender.email || selectedMessage.sender.phone}
                  </p>
                </div>
                {selectedMessage.subject && (
                  <div>
                    <label className="text-xs text-gray-500">Sujet</label>
                    <p className="font-medium">{selectedMessage.subject}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500">Résumé IA</label>
                  <p className="text-sm text-gray-700">
                    {selectedMessage.aiAnalysis?.summary || 'Pas de résumé disponible'}
                  </p>
                </div>
                {selectedMessage.aiAnalysis?.tags && selectedMessage.aiAnalysis.tags.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMessage.aiAnalysis.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                    Répondre
                  </button>
                  <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    Archiver
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Channel Distribution */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Répartition par canal</h3>
            <div className="space-y-2">
              {stats?.byChannel?.map(({ channel, count }) => {
                const Icon = channelIcons[channel] || Mail;
                const total = stats.totalMessages || 1;
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={channel} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{channel}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${channelColors[channel]}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgency Distribution */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Niveaux d'urgence</h3>
            <div className="grid grid-cols-2 gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((urgency) => {
                const count = stats?.byUrgency?.find(u => u.urgency === urgency)?.count || 0;
                return (
                  <div key={urgency} className={`p-3 rounded-lg ${urgencyColors[urgency]}`}>
                    <p className="text-xs opacity-75">{urgency}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
