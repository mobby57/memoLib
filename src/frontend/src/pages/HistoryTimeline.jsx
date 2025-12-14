import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Search, 
  Calendar,
  BarChart3,
  Download,
  Filter,
  TrendingUp,
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
  Eye,
  Zap,
  ChevronRight,
  Grid,
  List,
  ChevronLeft
} from 'lucide-react';
import { emailAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Composant vue calendrier
function CalendarView({ emails, currentMonth, setCurrentMonth, onSelectEmail }) {
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const getEmailsForDay = (day) => {
    const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return emails.filter(email => {
      const emailDate = new Date(email.timestamp);
      return emailDate.toDateString() === targetDate.toDateString();
    });
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEmails = getEmailsForDay(day);
          const hasEmails = dayEmails.length > 0;
          const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.05 }}
              className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all ${
                isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              } ${hasEmails ? 'bg-green-50' : 'bg-white'}`}
              onClick={() => hasEmails && onSelectEmail(dayEmails[0])}
            >
              <div className="text-sm font-medium text-gray-700">{day}</div>
              {hasEmails && (
                <div className="mt-1">
                  <div className="text-xs text-green-600 font-semibold">{dayEmails.length} email{dayEmails.length > 1 ? 's' : ''}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {dayEmails.slice(0, 3).map((email, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${email.status === 'sent' ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Envoyé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Échec</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
          <span className="text-gray-600">Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
}

// Composant vue statistiques
function StatsView({ emails }) {
  // Préparer données pour graphiques
  const prepareDailyData = () => {
    const last30Days = [];
    const counts = {};
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.push(dateStr);
      counts[dateStr] = 0;
    }
    
    emails.forEach(email => {
      const emailDate = new Date(email.timestamp).toISOString().split('T')[0];
      if (counts.hasOwnProperty(emailDate)) {
        counts[emailDate]++;
      }
    });
    
    return {
      labels: last30Days.map(d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
      data: last30Days.map(d => counts[d])
    };
  };

  const prepareStatusData = () => {
    const sent = emails.filter(e => e.status === 'sent').length;
    const failed = emails.filter(e => e.status === 'failed' || e.status !== 'sent').length;
    return { sent, failed };
  };

  const prepareTopRecipients = () => {
    const recipients = {};
    emails.forEach(email => {
      recipients[email.to] = (recipients[email.to] || 0) + 1;
    });
    return Object.entries(recipients)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  const dailyData = prepareDailyData();
  const statusData = prepareStatusData();
  const topRecipients = prepareTopRecipients();

  const lineChartData = {
    labels: dailyData.labels,
    datasets: [{
      label: 'Emails envoyés',
      data: dailyData.data,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const barChartData = {
    labels: topRecipients.map(([email]) => email.length > 20 ? email.substring(0, 20) + '...' : email),
    datasets: [{
      label: 'Nombre d\'emails',
      data: topRecipients.map(([, count]) => count),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }]
  };

  const pieChartData = {
    labels: ['Envoyés', 'Échecs'],
    datasets: [{
      data: [statusData.sent, statusData.failed],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Emails</p>
              <h3 className="text-3xl font-bold text-gray-900">{emails.length}</h3>
            </div>
            <Mail className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de Succès</p>
              <h3 className="text-3xl font-bold text-green-600">
                {emails.length > 0 ? Math.round((statusData.sent / emails.length) * 100) : 0}%
              </h3>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Destinataires Uniques</p>
              <h3 className="text-3xl font-bold text-gray-900">{topRecipients.length}</h3>
            </div>
            <Users className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendance 30 jours */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>Tendance des 30 derniers jours</span>
          </h3>
          <div style={{ height: '300px' }}>
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Statut emails */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            <span>Statut des Emails</span>
          </h3>
          <div style={{ height: '300px' }} className="flex items-center justify-center">
            <div style={{ width: '250px', height: '250px' }}>
              <Pie data={pieChartData} options={pieOptions} />
            </div>
          </div>
        </div>

        {/* Top destinataires */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span>Top 10 Destinataires</span>
          </h3>
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-cyan-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span>Insights</span>
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            📊 Vous avez envoyé <strong>{emails.length}</strong> emails au total
          </p>
          <p className="text-sm text-gray-700">
            ✅ Taux de succès : <strong>{emails.length > 0 ? Math.round((statusData.sent / emails.length) * 100) : 0}%</strong>
          </p>
          {topRecipients.length > 0 && (
            <p className="text-sm text-gray-700">
              👤 Destinataire le plus fréquent : <strong>{topRecipients[0][0]}</strong> ({topRecipients[0][1]} emails)
            </p>
          )}
          <p className="text-sm text-gray-700">
            📈 Moyenne : <strong>{emails.length > 0 ? (emails.length / 30).toFixed(1) : 0}</strong> emails par jour sur 30 jours
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HistoryTimeline() {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('timeline'); // timeline, list, calendar
  const [groupBy, setGroupBy] = useState('day'); // day, week, month, conversation
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month, custom
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [emails, searchQuery, dateRange]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await emailAPI.getHistory(500);
      setEmails(response.data.emails || []);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await emailAPI.getStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const filterEmails = () => {
    let filtered = [...emails];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.to?.toLowerCase().includes(query) ||
        e.subject?.toLowerCase().includes(query) ||
        e.body?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    const now = new Date();
    if (dateRange === 'today') {
      filtered = filtered.filter(e => {
        const emailDate = new Date(e.timestamp);
        return emailDate.toDateString() === now.toDateString();
      });
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => new Date(e.timestamp) >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => new Date(e.timestamp) >= monthAgo);
    }

    setFilteredEmails(filtered);
  };

  const groupEmailsByPeriod = () => {
    const groups = {};
    
    filteredEmails.forEach(email => {
      const date = new Date(email.timestamp);
      let key;

      if (groupBy === 'day') {
        key = date.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Semaine du ${weekStart.toLocaleDateString('fr-FR')}`;
      } else if (groupBy === 'month') {
        key = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      } else if (groupBy === 'conversation') {
        key = email.to || 'Inconnu';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(email);
    });

    return groups;
  };

  const exportHistory = () => {
    const csv = [
      ['Date', 'Destinataire', 'Sujet', 'Statut'].join(','),
      ...filteredEmails.map(e => [
        new Date(e.timestamp).toLocaleString('fr-FR'),
        e.to,
        `"${e.subject}"`,
        e.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-emails-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Historique exporté !');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const groupedEmails = groupEmailsByPeriod();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Historique & Timeline</h1>
              <p className="text-indigo-100 mt-2">
                Navigation intelligente dans vos emails envoyés
              </p>
            </div>
          </div>
          <button
            onClick={exportHistory}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total envoyé</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalSent || 0}</p>
            </div>
            <Send className="w-10 h-10 text-blue-500" />
          </div>
        </motion.div>

        <motion.div 
          className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Taux de succès</p>
              <p className="text-3xl font-bold text-green-900">{stats.successRate || 0}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </motion.div>

        <motion.div 
          className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Destinataires</p>
              <p className="text-3xl font-bold text-purple-900">{stats.uniqueRecipients || 0}</p>
            </div>
            <Users className="w-10 h-10 text-purple-500" />
          </div>
        </motion.div>

        <motion.div 
          className="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Cette semaine</p>
              <p className="text-3xl font-bold text-orange-900">{stats.thisWeek || 0}</p>
            </div>
            <Zap className="w-10 h-10 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Filters & Controls */}
      <div className="card p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans l'historique (destinataire, sujet, contenu)..."
            className="input pl-12"
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Vue:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm">Timeline</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Calendrier</span>
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-all ${
                  viewMode === 'stats'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Graphiques</span>
              </button>
            </div>
          </div>

          {/* Group By */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Grouper par:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="input py-2 text-sm"
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
              <option value="conversation">Conversation</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Période:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input py-2 text-sm"
            >
              <option value="all">Tout</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-8">
          {Object.entries(groupedEmails).map(([period, periodEmails], groupIndex) => (
            <motion.div
              key={period}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              {/* Period Header */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0 w-3 h-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800 capitalize">{period}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                <span className="text-sm text-gray-500 font-medium">
                  {periodEmails.length} email{periodEmails.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Emails in Period */}
              <div className="space-y-3 ml-8 border-l-2 border-gray-200 pl-6">
                {periodEmails.map((email, emailIndex) => (
                  <motion.div
                    key={email.id || emailIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.1 + emailIndex * 0.05 }}
                    className={`card p-4 hover:shadow-lg transition-all cursor-pointer border-l-4 ${
                      email.status === 'sent' 
                        ? 'border-l-green-500' 
                        : email.status === 'failed'
                        ? 'border-l-red-500'
                        : 'border-l-gray-400'
                    }`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Time */}
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {new Date(email.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {getStatusIcon(email.status)}
                        </div>

                        {/* Recipient */}
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs text-gray-500">À:</span>
                          <span className="font-semibold text-gray-800">{email.to}</span>
                        </div>

                        {/* Subject */}
                        <h3 className="font-medium text-gray-900 mb-2">
                          {email.subject}
                        </h3>

                        {/* Body Preview */}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {email.body?.substring(0, 150)}...
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(email.status)}`}>
                        {email.status === 'sent' ? 'Envoyé' : 'Échec'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          {filteredEmails.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun email trouvé</p>
              <p className="text-gray-400 text-sm">Modifiez vos filtres pour voir plus de résultats</p>
            </div>
          )}
        </div>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === 'calendar' && (
        <CalendarView 
          emails={filteredEmails} 
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          onSelectEmail={setSelectedEmail}
        />
      )}

      {/* Stats View Placeholder */}
      {viewMode === 'stats' && (
        <StatsView emails={filteredEmails} />
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEmail(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedEmail.subject}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{selectedEmail.to}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(selectedEmail.timestamp).toLocaleString('fr-FR')}
                    </span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <pre className="whitespace-pre-wrap text-gray-800 font-sans">
                {selectedEmail.body}
              </pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
