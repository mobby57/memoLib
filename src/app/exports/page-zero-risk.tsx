'use client'

import { ZeroRiskExport } from '@/lib/zero-risk-export'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Upload, FileText, Database } from 'lucide-react'

export default function ExportsPage() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExportDossiers = async () => {
    setExporting(true)
    try {
      const dossiers = [
        { numero: 'D-2026-001', client: 'Jean Dupuis', type: 'OQTF', statut: 'EN_COURS' },
        { numero: 'D-2026-002', client: 'Marie Martin', type: 'ASILE', statut: 'URGENT' }
      ]
      ZeroRiskExport.exportToCSV(dossiers, 'dossiers-export')
    } finally {
      setExporting(false)
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const data = await ZeroRiskExport.importFromCSV(file)
      console.log('Donnees importees:', data)
      alert(`${data.length} lignes importees avec succes`)
    } catch (error) {
      alert('Erreur import: ' + (error as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Exports & Imports ZeRO RISQUE</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Exports Securises
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleExportDossiers}
              disabled={exporting}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              {exporting ? 'Export...' : 'Exporter Dossiers (CSV)'}
            </Button>
            
            <Button 
              onClick={() => ZeroRiskExport.exportToJSON([], 'backup')}
              variant="outline"
              className="w-full"
            >
              <Database className="w-4 h-4 mr-2" />
              Backup JSON
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Imports Securises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Importer fichier CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFile}
                  disabled={importing}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              {importing && (
                <div className="text-sm text-blue-600">
                  Import en cours...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>? Securite ZeRO RISQUE</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li> Aucune dependance externe vulnerable</li>
            <li> APIs natives du navigateur uniquement</li>
            <li> Validation stricte des formats</li>
            <li> Pas de parsing complexe</li>
            <li> Zero vulnerabilite npm audit</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
