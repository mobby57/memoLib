"use client";

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/forms/Button'
import { Input } from '@/components/forms/Input'
import { useToast } from '@/hooks'
import {
  generateDocument,
  getSuggestions,
  analyzeRisk,
  summarizeDocument,
  chatWithAI,
  extractEntities,
  checkCompliance,
  getAIUsageStats,
} from '@/lib/services/aiService'
import {
  Sparkles,
  FileText,
  AlertTriangle,
  MessageSquare,
  Search,
  CheckCircle,
  TrendingUp,
  Zap,
} from 'lucide-react'

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze' | 'chat' | 'extract'>('generate')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { showToast } = useToast()

  const mockDossier = {
    titre: 'Recouvrement creance Societe ABC',
    type: 'Contentieux commercial',
    statut: 'En cours',
    client: 'Societe ABC',
    echeances: [
      { date: '2026-02-15', description: 'Audience de conciliation' },
    ],
  }

  const handleGenerateDocument = async () => {
    setLoading(true)
    try {
      const doc = await generateDocument('contrat', {
        parties: 'ABC et XYZ',
        objet: 'Prestation de services',
        duree: '12 mois',
        conditions: 'Paiement a 30 jours',
      })
      setResult({ type: 'document', content: doc })
      showToast('Document genere avec succes', 'success')
    } catch (error) {
      showToast('Erreur lors de la generation', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeRisk = async () => {
    setLoading(true)
    try {
      const analysis = await analyzeRisk(mockDossier)
      setResult({ type: 'risk', content: analysis })
      showToast('Analyse terminee', 'success')
    } catch (error) {
      showToast('Erreur lors de l\'analyse', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGetSuggestions = async () => {
    setLoading(true)
    try {
      const suggestions = await getSuggestions(mockDossier)
      setResult({ type: 'suggestions', content: suggestions })
      showToast('Suggestions generees', 'success')
    } catch (error) {
      showToast('Erreur', 'error')
    } finally {
      setLoading(false)
    }
  }

  const stats = getAIUsageStats()

  const getRiskColor = (level: string) => {
    const colors = {
      faible: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
      moyen: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
      eleve: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
      critique: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300',
    }
    return colors[level as keyof typeof colors] || colors.moyen
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Assistant IA', href: '/ai-assistant' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Assistant Juridique IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generation de documents, analyse de risques, suggestions intelligentes
          </p>
        </div>
      </div>

      {/* Statistiques d'utilisation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Requetes totales</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalRequests}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Tokens utilises</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalTokens.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Cout estime</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.estimatedCost.toFixed(2)}€
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">economie de temps</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ~{stats.totalRequests * 15} min
          </p>
        </Card>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'generate'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Generation
        </button>
        <button
          onClick={() => setActiveTab('analyze')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'analyze'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Analyse
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'chat'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('extract')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'extract'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Extraction
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Generation de Documents
              </h2>
              <div className="space-y-3">
                <Button onClick={handleGenerateDocument} className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Generer un contrat
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Generer une mise en demeure
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Generer une assignation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Generer un courrier
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Suggestions Intelligentes
              </h2>
              <Button onClick={handleGetSuggestions} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Obtenir des suggestions pour ce dossier
              </Button>
            </Card>
          </div>

          {/* Resultats */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Resultat
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
              </div>
            ) : result?.type === 'document' ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                    {result.content}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Copier
                  </Button>
                  <Button size="sm" variant="outline">
                    Telecharger PDF
                  </Button>
                </div>
              </div>
            ) : result?.type === 'suggestions' ? (
              <div className="space-y-2">
                {result.content.map((suggestion: string, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                  >
                    <p className="text-sm text-gray-900 dark:text-white">{suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Aucun resultat pour le moment
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Analyse de Risques
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dossier a analyser :
                </p>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {mockDossier.titre}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {mockDossier.type} - {mockDossier.statut}
                </p>
              </div>

              <Button onClick={handleAnalyzeRisk} className="w-full">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Lancer l'analyse IA
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Resultat de l'analyse
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
              </div>
            ) : result?.type === 'risk' ? (
              <div className="space-y-4">
                {/* Score */}
                <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Score de risque</p>
                  <p className="text-5xl font-bold text-gray-900 dark:text-white">
                    {result.content.score}/100
                  </p>
                  <span className={`inline-block mt-3 px-4 py-1 rounded-full text-sm font-medium ${getRiskColor(result.content.level)}`}>
                    Risque {result.content.level}
                  </span>
                </div>

                {/* Facteurs */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Facteurs identifies :
                  </h3>
                  <div className="space-y-2">
                    {result.content.factors.map((factor: any, i: number) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          factor.impact === 'positif'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}
                      >
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {factor.impact === 'positif' ? '' : '️'} {factor.factor}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {factor.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommandations */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Recommandations :
                  </h3>
                  <ul className="space-y-2">
                    {result.content.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Cliquez sur "Lancer l'analyse" pour commencer
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'chat' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Chat avec l'Assistant IA
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[400px]">
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                Interface de chat a venir...
              </p>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Posez votre question juridique..." className="flex-1" />
              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'extract' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Extraction d'Entites
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Extrayez automatiquement les noms, dates, montants et references legales d'un document
          </p>
          <div className="space-y-4">
            <textarea
              placeholder="Collez le texte du document ici..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              rows={8}
            />
            <Button>
              <Search className="w-4 h-4 mr-2" />
              Extraire les entites
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
