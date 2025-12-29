import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  MapPin, TrendingUp, AlertTriangle, Package, Clock, 
  Users, Target, Award, Calendar, RefreshCw 
} from 'lucide-react';
import axios from 'axios';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

/**
 * 📊 Dashboard Analytics Postal Management
 * 
 * Features:
 * - KPIs temps réel (taux succès, productivité, incidents)
 * - Charts interactifs (Recharts)
 * - Maps Waze avec routes optimisées
 * - Drill-down par zone/facteur
 * - Rapports automatisés
 */
const PostalAnalyticsDashboard = () => {
  const [period, setPeriod] = useState('daily'); // daily, weekly, monthly
  const [report, setReport] = useState(null);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [selectedPostman, setSelectedPostman] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Charger rapport initial
  useEffect(() => {
    fetchReport(period);
    fetchActiveIncidents();
    
    // Refresh auto toutes les 5 minutes
    const interval = setInterval(() => {
      fetchReport(period);
      fetchActiveIncidents();
    }, 300000);
    
    return () => clearInterval(interval);
  }, [period]);
  
  const fetchReport = async (reportPeriod) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/postal/reports/${reportPeriod}`);
      setReport(response.data.report);
    } catch (error) {
      console.error('Erreur chargement rapport:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchActiveIncidents = async () => {
    try {
      const response = await axios.get('/api/postal/incidents/active');
      setActiveIncidents(response.data.incidents);
    } catch (error) {
      console.error('Erreur chargement incidents:', error);
    }
  };
  
  const fetchPostmanPerformance = async (postmanId) => {
    try {
      const response = await axios.get(`/api/postal/performance/postman/${postmanId}`);
      setSelectedPostman(response.data.performance);
    } catch (error) {
      console.error('Erreur chargement performance:', error);
    }
  };
  
  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  if (!report) return null;
  
  // Préparer données charts
  const deliveryData = [
    { name: 'Réussies', value: report.kpis.successful_deliveries, color: '#10b981' },
    { name: 'Échouées', value: report.kpis.failed_deliveries, color: '#ef4444' }
  ];
  
  const performanceData = report.top_performers.map((p, idx) => ({
    name: p.name,
    livraisons: p.deliveries,
    succès: p.success_rate,
    note: p.avg_rating
  }));
  
  const areasData = report.areas_needing_support.map(area => ({
    zone: area.area_name,
    échecs: area.failed_count,
    incidents: area.incidents_count,
    taux: area.failure_rate
  }));
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Postal Management Analytics
          </h1>
          
          {/* Sélecteur période */}
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {p === 'daily' ? 'Jour' : p === 'weekly' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-gray-600 mt-2">
          Période: {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
        </p>
      </div>
      
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          icon={<Target className="w-6 h-6" />}
          title="Taux de Succès"
          value={`${report.kpis.delivery_success_rate}%`}
          trend={report.kpis.delivery_success_rate >= 95 ? 'up' : 'down'}
          color="blue"
        />
        
        <KPICard
          icon={<Package className="w-6 h-6" />}
          title="Livraisons Totales"
          value={report.kpis.total_deliveries}
          subtitle={`${report.kpis.successful_deliveries} réussies`}
          color="green"
        />
        
        <KPICard
          icon={<Clock className="w-6 h-6" />}
          title="Temps Moyen"
          value={`${report.kpis.average_delivery_time} min`}
          subtitle={`Productivité: ${report.kpis.average_productivity}/h`}
          color="orange"
        />
        
        <KPICard
          icon={<AlertTriangle className="w-6 h-6" />}
          title="Incidents Actifs"
          value={activeIncidents.length}
          subtitle={`${report.kpis.incidents_count} total période`}
          color="red"
        />
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Livraisons - Pie Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Répartition Livraisons
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deliveryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {deliveryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Top Performers - Bar Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Top 5 Facteurs
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="livraisons" fill="#3b82f6" />
              <Bar dataKey="succès" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Zones à Supporter - Bar Chart */}
        {areasData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Zones Nécessitant Support
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="échecs" fill="#ef4444" />
                <Bar dataKey="incidents" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Incidents Actifs */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Incidents Actifs ({activeIncidents.length})
          </h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {activeIncidents.slice(0, 5).map((incident) => (
              <div
                key={incident.id}
                className={`p-3 rounded-lg border-l-4 ${
                  incident.severity === 'CRITICAL' ? 'border-red-600 bg-red-50' :
                  incident.severity === 'HIGH' ? 'border-orange-500 bg-orange-50' :
                  incident.severity === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{incident.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {incident.description.substring(0, 80)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {incident.type} | {incident.severity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {activeIncidents.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                ✅ Aucun incident actif
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Top Performers Détaillé */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Performance Facteurs Détaillée
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rang
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Facteur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Livraisons
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Taux Succès
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Note Moyenne
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.top_performers.map((performer, idx) => (
                <tr key={performer.postman_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {idx === 0 && <span className="text-2xl">🥇</span>}
                    {idx === 1 && <span className="text-2xl">🥈</span>}
                    {idx === 2 && <span className="text-2xl">🥉</span>}
                    {idx > 2 && <span className="text-gray-600">#{idx + 1}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {performer.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {performer.deliveries}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      performer.success_rate >= 95 ? 'bg-green-100 text-green-800' :
                      performer.success_rate >= 90 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {performer.success_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    ⭐ {performer.avg_rating}/5
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => fetchPostmanPerformance(performer.postman_id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Détails →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Détails Facteur Sélectionné */}
      {selectedPostman && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                {selectedPostman.postman_name}
              </h2>
              <p className="text-gray-600 mt-1">
                Rang: #{selectedPostman.analysis.rank} | Tendance: {
                  selectedPostman.analysis.performance_trend === 'improving' ? '📈 En amélioration' :
                  selectedPostman.analysis.performance_trend === 'declining' ? '📉 En baisse' :
                  '➡️ Stable'
                }
              </p>
            </div>
            <button
              onClick={() => setSelectedPostman(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Livraisons</h3>
              <p className="text-2xl font-bold text-blue-600">
                {selectedPostman.metrics.deliveries.total}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPostman.metrics.deliveries.success_rate}% succès
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Productivité</h3>
              <p className="text-2xl font-bold text-green-600">
                {selectedPostman.metrics.timing.productivity} /h
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPostman.metrics.timing.average_delivery_time} min/livraison
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Qualité</h3>
              <p className="text-2xl font-bold text-yellow-600">
                ⭐ {selectedPostman.metrics.quality.average_rating}/5
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPostman.metrics.quality.incident_count} incidents
              </p>
            </div>
          </div>
          
          {/* Points forts */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Points Forts
            </h3>
            <div className="space-y-2">
              {selectedPostman.analysis.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Axes d'amélioration */}
          {selectedPostman.analysis.areas_for_improvement.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Axes d'Amélioration
              </h3>
              <div className="space-y-2">
                {selectedPostman.analysis.areas_for_improvement.map((area, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-500">→</span>
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommandations Coaching */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Recommandations Coaching
            </h3>
            <div className="space-y-3">
              {selectedPostman.analysis.personalized_recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-gray-800">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant KPI Card
const KPICard = ({ icon, title, value, subtitle, trend, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? '↗' : '↘'}
          </span>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
};

export default PostalAnalyticsDashboard;
