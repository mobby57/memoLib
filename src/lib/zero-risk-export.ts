/**
 * Solution ZeRO RISQUE - Export/Import sans dependances externes
 * Utilise uniquement les APIs natives du navigateur
 */

export class ZeroRiskExport {
  // Export CSV natif (zero vulnerabilite)
  static exportToCSV(data: any[], filename: string): void {
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Import CSV natif (zero vulnerabilite)
  static async importFromCSV(file: File): Promise<any[]> {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('Seuls les fichiers CSV sont autorises')
    }
    
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim())
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index] || ''
        return obj
      }, {} as any)
    })
  }

  // Export JSON natif (zero vulnerabilite)
  static exportToJSON(data: any[], filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Import JSON natif (zero vulnerabilite)
  static async importFromJSON(file: File): Promise<any[]> {
    if (!file.name.toLowerCase().endsWith('.json')) {
      throw new Error('Seuls les fichiers JSON sont autorises')
    }
    
    const text = await file.text()
    return JSON.parse(text)
  }
}