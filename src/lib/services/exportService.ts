"use client"

import { logger } from '@/lib/logger';

/**
 * Service d'export multi-formats
 * Supporte Excel, Word, CSV avec ExcelJS (securise)
 */

import ExcelJS from 'exceljs'
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow } from 'docx'
import Papa from 'papaparse'

/**
 * Export vers Excel (.xlsx) avec ExcelJS
 */
export async function exportToExcel(
  data: any[],
  filename: string = 'export.xlsx',
  sheetName: string = 'Data'
): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    if (data.length > 0) {
      // Ajouter les en-tetes (cles du premier objet)
      const headers = Object.keys(data[0])
      worksheet.addRow(headers)
      
      // Ajouter les donnees
      data.forEach(row => {
        const values = headers.map(h => row[h])
        worksheet.addRow(values)
      })
    }

    // Generer et telecharger
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)

    logger.info('Export Excel reussi', { filename, rowCount: data.length });
  } catch (error) {
    logger.error('Erreur lors de l\'export Excel', error, { filename })
    throw error
  }
}

/**
 * Export de plusieurs feuilles vers Excel avec ExcelJS
 */
export async function exportToExcelMultiSheet(
  sheets: Array<{ name: string; data: any[] }>,
  filename: string = 'export.xlsx'
): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook()

    sheets.forEach(sheet => {
      const worksheet = workbook.addWorksheet(sheet.name)
      
      if (sheet.data.length > 0) {
        const headers = Object.keys(sheet.data[0])
        worksheet.addRow(headers)
        
        sheet.data.forEach(row => {
          const values = headers.map(h => row[h])
          worksheet.addRow(values)
        })
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)

    logger.info('Export Excel multi-feuilles reussi', { filename, sheetsCount: Object.keys(sheets).length });
  } catch (error) {
    logger.error('Erreur lors de l\'export Excel multi-feuilles', error, { filename })
    throw error
  }
}

/**
 * Export vers Word (.docx)
 */
export async function exportToWord(
  content: {
    title?: string
    sections: Array<{
      title?: string
      paragraphs: string[]
      table?: {
        headers: string[]
        rows: string[][]
      }
    }>
  },
  filename: string = 'export.docx'
): Promise<void> {
  try {
    const children: any[] = []

    // Titre principal
    if (content.title) {
      children.push(
        new Paragraph({
          text: content.title,
          heading: 'Heading1',
          spacing: { after: 300 },
        })
      )
    }

    // Sections
    content.sections.forEach(section => {
      // Titre de section
      if (section.title) {
        children.push(
          new Paragraph({
            text: section.title,
            heading: 'Heading2',
            spacing: { before: 200, after: 200 },
          })
        )
      }

      // Paragraphes
      section.paragraphs.forEach(para => {
        children.push(
          new Paragraph({
            children: [new TextRun(para)],
            spacing: { after: 100 },
          })
        )
      })

      // Table
      if (section.table) {
        const tableRows: TableRow[] = [
          // Headers
          new TableRow({
            children: section.table.headers.map(
              h =>
                new TableCell({
                  children: [new Paragraph({ text: h })],
                })
            ),
          }),
          // Rows
          ...section.table.rows.map(
            row =>
              new TableRow({
                children: row.map(
                  cell =>
                    new TableCell({
                      children: [new Paragraph({ text: cell })],
                    })
                ),
              })
          ),
        ]

        children.push(
          new Table({
            rows: tableRows,
          })
        )
      }
    })

    // Creer le document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    })

    // Generer et telecharger
    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    logger.info('Export Word reussi', { filename });
  } catch (error) {
    logger.error('Erreur lors de l\'export Word', error, { filename })
    throw error
  }
}

/**
 * Export vers CSV
 */
export function exportToCSV(
  data: any[],
  filename: string = 'export.csv',
  delimiter: string = ','
): void {
  try {
    const csv = Papa.unparse(data, { delimiter })
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    logger.info('Export CSV reussi', { filename, rowCount: data.length });
  } catch (error) {
    logger.error('Erreur lors de l\'export CSV', error, { filename })
    throw error
  }
}

/**
 * Import depuis CSV
 */
export async function importFromCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        logger.info('Import CSV reussi', {
          rowCount: results.data.length,
          filename: file.name
        });
        resolve(results.data)
      },
      error: (error: any) => {
        logger.error('Erreur lors de l\'import CSV', error, {
          filename: file.name
        });
        reject(error)
      },
    })
  })
}

/**
 * Export d'un rapport de dossiers
 */
export async function exportDossiersReport(
  dossiers: any[],
  format: 'excel' | 'word' | 'csv'
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0]

  switch (format) {
    case 'excel':
      await exportToExcel(
        dossiers.map(d => ({
          Numero: d.numero,
          Titre: d.titre,
          Client: d.client,
          Type: d.type,
          Statut: d.statut,
          'Date creation': d.createdAt,
          Responsable: d.responsable,
        })),
        `dossiers_${timestamp}.xlsx`,
        'Dossiers'
      )
      break

    case 'word':
      await exportToWord(
        {
          title: `Rapport des Dossiers - ${new Date().toLocaleDateString('fr-FR')}`,
          sections: [
            {
              title: 'Resume',
              paragraphs: [
                `Nombre total de dossiers: ${dossiers.length}`,
                `Date du rapport: ${new Date().toLocaleDateString('fr-FR')}`,
              ],
            },
            {
              title: 'Liste des dossiers',
              paragraphs: [],
              table: {
                headers: ['Numero', 'Titre', 'Client', 'Statut'],
                rows: dossiers.map(d => [
                  d.numero,
                  d.titre,
                  d.client,
                  d.statut,
                ]),
              },
            },
          ],
        },
        `dossiers_${timestamp}.docx`
      )
      break

    case 'csv':
      exportToCSV(
        dossiers.map(d => ({
          Numero: d.numero,
          Titre: d.titre,
          Client: d.client,
          Type: d.type,
          Statut: d.statut,
          'Date creation': d.createdAt,
        })),
        `dossiers_${timestamp}.csv`
      )
      break
  }
}

/**
 * Export d'un rapport financier
 */
export async function exportFinancialReport(
  factures: any[],
  stats: any
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0]

  await exportToExcelMultiSheet(
    [
      {
        name: 'Vue d\'ensemble',
        data: [
          { Metrique: 'Total facture', Valeur: stats.totalFacture },
          { Metrique: 'Total paye', Valeur: stats.totalPaye },
          { Metrique: 'En attente', Valeur: stats.enAttente },
          { Metrique: 'Taux recouvrement', Valeur: `${stats.tauxRecouvrement}%` },
        ],
      },
      {
        name: 'Factures',
        data: factures.map(f => ({
          Numero: f.numero,
          Client: f.client,
          Montant: f.montant,
          Statut: f.statut,
          'Date emission': f.dateEmission,
          'Date echeance': f.dateEcheance,
        })),
      },
      {
        name: 'Par client',
        data: Object.entries(
          factures.reduce((acc: any, f: any) => {
            acc[f.client] = (acc[f.client] || 0) + f.montant
            return acc
          }, {})
        ).map(([client, montant]) => ({
          Client: client,
          'Total facture': montant,
        })),
      },
    ],
    `rapport_financier_${timestamp}.xlsx`
  )
}

/**
 * Import de clients depuis CSV
 */
export async function importClients(file: File): Promise<any[]> {
  const data = await importFromCSV(file)

  // Validation et transformation
  return data.map((row: any) => ({
    nom: row.Nom || row.nom || '',
    email: row.Email || row.email || '',
    telephone: row.Telephone || row.telephone || row.phone || '',
    adresse: row.Adresse || row.adresse || '',
    type: row.Type || row.type || 'particulier',
  }))
}
