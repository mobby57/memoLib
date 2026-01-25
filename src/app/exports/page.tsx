"use client";

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/forms/Button'
import { Input } from '@/components/forms/Input'
import { useToast } from '@/hooks'
import { logger } from '@/lib/logger'
import {
  exportToExcel,
  exportToWord,
  exportToCSV,
  exportDossiersReport,
  exportFinancialReport,
  importFromCSV,
  importClients,
} from '@/lib/services/exportService'
import { FileDown, FileUp, FileSpreadsheet, FileText, Download } from 'lucide-react'

export default function ExportsPage() {
  const [importing, setImporting] = useState(false)
  const { showToast } = useToast()

  // Donnees mockees pour la demo
  const mockDossiers = [
    {
      numero: 'DOS-2026-001',
      titre: 'Contentieux commercial ABC',
      client: 'Societe ABC',
      type: 'Commercial',
      statut: 'En cours',
      createdAt: '2026-01-01',
      responsable: 'Jean Dupont',
    },
    {
      numero: 'DOS-2026-002',
      titre: 'Litige RH XYZ',
      client: 'Entreprise XYZ',
      type: 'RH',
      statut: 'Termine',
      createdAt: '2025-12-15',
      responsable: 'Marie Martin',
    },
  ]

  const mockFactures = [
    {
      numero: 'FAC-2026-001',
      client: 'Societe ABC',
      montant: 5000,
      statut: 'Payee',
      dateEmission: '2026-01-01',
      dateEcheance: '2026-01-31',
    },
    {
      numero: 'FAC-2026-002',
      client: 'Entreprise XYZ',
      montant: 3500,
      statut: 'En attente',
      dateEmission: '2026-01-05',
      dateEcheance: '2026-02-05',
    },
  ]

  const mockStats = {
    totalFacture: 8500,
    totalPaye: 5000,
    enAttente: 3500,
    tauxRecouvrement: 58.8,
  }

  const handleExportDossiers = async (format: 'excel' | 'word' | 'csv') => {
    try {
      await exportDossiersReport(mockDossiers, format)
      showToast(`Export ${format.toUpperCase()} reussi`, 'success')
    } catch (error) {
      showToast('Erreur lors de l\'export', 'error')
    }
  }

  const handleExportFinancial = async () => {
    try {
      await exportFinancialReport(mockFactures, mockStats)
      showToast('Rapport financier exporte', 'success')
    } catch (error) {
      showToast('Erreur lors de l\'export', 'error')
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const clients = await importClients(file)
      logger.info('Clients importes', { count: clients.length })
      showToast(`${clients.length} clients importes`, 'success')
    } catch (error) {
      showToast('Erreur lors de l\'import', 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Exports', href: '/exports' },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Export & Import Multi-formats
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Exportez vos donnees en Excel, Word, CSV ou importez des donnees
        </p>
      </div>

      {/* Export des dossiers */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Export des Dossiers
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Exportez la liste complete des dossiers
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => handleExportDossiers('excel')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel (.xlsx)
          </Button>
          <Button onClick={() => handleExportDossiers('word')} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Word (.docx)
          </Button>
          <Button onClick={() => handleExportDossiers('csv')} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </Card>

      {/* Export financier */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-green-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Rapport Financier
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Export complet avec statistiques et tableaux de bord
            </p>
          </div>
        </div>

        <Button onClick={handleExportFinancial}>
          <Download className="w-4 h-4 mr-2" />
          Generer rapport Excel multi-feuilles
        </Button>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            [emoji] Le rapport inclut : Vue d'ensemble, liste des factures, analyse par client
          </p>
        </div>
      </Card>

      {/* Import CSV */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileUp className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Import de Clients
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Importez vos clients depuis un fichier CSV
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="csv-upload"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
            >
              <FileUp className="w-4 h-4 mr-2" />
              {importing ? 'Import en cours...' : 'Selectionner un fichier CSV'}
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              disabled={importing}
              className="hidden"
            />
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Format attendu :
            </p>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`Nom,Email,Telephone,Adresse,Type
Dupont SA,contact@dupont.fr,0123456789,1 rue de Paris,entreprise
Martin SARL,info@martin.fr,0987654321,2 avenue Victor Hugo,entreprise`}
            </pre>
          </div>
        </div>
      </Card>

      {/* Exports personnalises */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Autres Exports Disponibles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
               Factures
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Exportez toutes vos factures avec statistiques
            </p>
            <Button size="sm" variant="outline">
              Exporter
            </Button>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              [emoji] Clients
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Liste complete avec coordonnees
            </p>
            <Button size="sm" variant="outline">
              Exporter
            </Button>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              [emoji] Calendrier
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              evenements et echeances au format iCal
            </p>
            <Button size="sm" variant="outline">
              Exporter
            </Button>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              [emoji] Analytics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Donnees d'analyse et metriques
            </p>
            <Button size="sm" variant="outline">
              Exporter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
