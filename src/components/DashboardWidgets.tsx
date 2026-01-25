"use client"

import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import { safeLocalStorage } from '@/lib/localStorage'
import { logger } from '@/lib/logger'

export interface WidgetConfig {
  id: string
  type: 'metric' | 'chart' | 'list' | 'calendar' | 'progress'
  title: string
  size: 'sm' | 'md' | 'lg' | 'full'
  refreshInterval?: number // en secondes, 0 = pas d'auto-refresh
  dataSource: string // URL de l'API ou fonction
}

interface MetricWidgetProps {
  title: string
  value: number | string
  change?: number
  icon?: React.ReactNode
  format?: 'number' | 'currency' | 'percent'
  loading?: boolean
}

export function MetricWidget({
  title,
  value,
  change,
  icon,
  format = 'number',
  loading = false,
}: MetricWidgetProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(val)
      case 'percent':
        return `${val}%`
      default:
        return new Intl.NumberFormat('fr-FR').format(val)
    }
  }

  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-600'
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <Card className="p-4 relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatValue(value)}
        </p>
        
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </Card>
  )
}

interface DashboardWidgetProps {
  config: WidgetConfig
  onRemove?: (id: string) => void
  onRefresh?: (id: string) => void
}

export function DashboardWidget({ config, onRemove, onRefresh }: DashboardWidgetProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulation de chargement de donnees
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Donnees mockees selon le type
      const mockData = getMockData(config.type)
      setData(mockData)
      setLastUpdate(new Date())
    } catch (error) {
      logger.error('Erreur chargement widget', { error, widgetType: config.type })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Auto-refresh si configure
    if (config.refreshInterval && config.refreshInterval > 0) {
      const interval = setInterval(() => {
        loadData()
      }, config.refreshInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [config])

  const sizeClasses = {
    sm: 'col-span-1',
    md: 'col-span-2',
    lg: 'col-span-3',
    full: 'col-span-full',
  }

  return (
    <div className={sizeClasses[config.size]}>
      {config.type === 'metric' && data && (
        <MetricWidget
          title={config.title}
          value={data.value}
          change={data.change}
          icon={data.icon}
          format={data.format}
          loading={loading}
        />
      )}

      {config.type === 'list' && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {config.title}
            </h3>
            <button
              onClick={() => onRefresh?.(config.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : data && data.items ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.items.map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Aucune donnee
            </p>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Mis a jour: {lastUpdate.toLocaleTimeString('fr-FR')}
          </p>
        </Card>
      )}

      {config.type === 'progress' && data && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {config.title}
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : data.items ? (
            <div className="space-y-4">
              {data.items.map((item: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.value}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      )}
    </div>
  )
}

// Donnees mockees pour les widgets
function getMockData(type: string) {
  switch (type) {
    case 'metric':
      return {
        value: Math.floor(Math.random() * 10000),
        change: Math.floor(Math.random() * 40) - 20,
        format: 'currency',
      }
    
    case 'list':
      return {
        items: [
          { title: 'Dossier ABC-2026-001', subtitle: 'En cours - echeance: 15/01/2026' },
          { title: 'Dossier ABC-2026-002', subtitle: 'Urgent - echeance: 08/01/2026' },
          { title: 'Dossier ABC-2025-156', subtitle: 'Termine - Cloture le 28/12/2025' },
          { title: 'Dossier ABC-2026-003', subtitle: 'En attente - echeance: 22/01/2026' },
        ],
      }
    
    case 'progress':
      return {
        items: [
          { label: 'Dossiers traites', value: 78 },
          { label: 'Objectif mensuel', value: 65 },
          { label: 'Taux de recouvrement', value: 92 },
        ],
      }
    
    default:
      return null
  }
}

interface DashboardGridProps {
  widgets: WidgetConfig[]
  onWidgetRemove?: (id: string) => void
  editable?: boolean
}

export function DashboardGrid({ widgets, onWidgetRemove, editable = false }: DashboardGridProps) {
  const [localWidgets, setLocalWidgets] = useState(widgets)

  const handleRefresh = (id: string) => {
    // Forcer le rechargement du widget
    setLocalWidgets(prev => [...prev])
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
      {localWidgets.map(widget => (
        <DashboardWidget
          key={widget.id}
          config={widget}
          onRemove={onWidgetRemove}
          onRefresh={handleRefresh}
        />
      ))}
    </div>
  )
}

// Hook pour gerer la configuration du dashboard
export function useDashboardConfig() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])

  useEffect(() => {
    // Charger la configuration depuis localStorage
    const saved = safeLocalStorage.getItem('dashboard_config')
    if (saved) {
      setWidgets(JSON.parse(saved))
    } else {
      // Configuration par defaut
      const defaultWidgets: WidgetConfig[] = [
        {
          id: '1',
          type: 'metric',
          title: 'Chiffre d\'affaires du mois',
          size: 'sm',
          refreshInterval: 60,
          dataSource: '/api/metrics/revenue',
        },
        {
          id: '2',
          type: 'metric',
          title: 'Dossiers actifs',
          size: 'sm',
          refreshInterval: 30,
          dataSource: '/api/metrics/dossiers',
        },
        {
          id: '3',
          type: 'list',
          title: 'Dossiers recents',
          size: 'md',
          refreshInterval: 60,
          dataSource: '/api/dossiers/recent',
        },
        {
          id: '4',
          type: 'progress',
          title: 'Performance',
          size: 'md',
          refreshInterval: 0,
          dataSource: '/api/metrics/performance',
        },
      ]
      setWidgets(defaultWidgets)
      safeLocalStorage.setItem('dashboard_config', JSON.stringify(defaultWidgets))
    }
  }, [])

  const saveWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets)
    safeLocalStorage.setItem('dashboard_config', JSON.stringify(newWidgets))
  }

  const addWidget = (widget: WidgetConfig) => {
    saveWidgets([...widgets, widget])
  }

  const removeWidget = (id: string) => {
    saveWidgets(widgets.filter(w => w.id !== id))
  }

  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    saveWidgets(
      widgets.map(w => w.id === id ? { ...w, ...updates } : w)
    )
  }

  return {
    widgets,
    addWidget,
    removeWidget,
    updateWidget,
  }
}
