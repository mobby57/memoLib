import { useState, useEffect } from 'react'
import { Mail, Send, Clock, TrendingUp } from 'lucide-react'
import { dashboardAPI } from '../services/api'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmails: 0,
    sentToday: 0,
    pending: 0,
    successRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getStats()
        setStats(response.data)
      } catch (error) {
        toast.error('Erreur lors du chargement des statistiques')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      name: 'Total Emails',
      value: stats.totalEmails,
      icon: Mail,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'Envoyés Aujourd\'hui',
      value: stats.sentToday,
      icon: Send,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'En Attente',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      name: 'Taux de Succès',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-100'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Vue d'ensemble de votre activité email</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions Rapides</h3>
          <div className="space-y-3">
            <button className="btn-primary w-full">
              Composer un Email
            </button>
            <button className="btn-secondary w-full">
              Utiliser l'Agent Vocal
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activité Récente</h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              Email envoyé avec succès - Il y a 2 min
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              Nouveau template créé - Il y a 1h
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              Configuration mise à jour - Il y a 3h
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard