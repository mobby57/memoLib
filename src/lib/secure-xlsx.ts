import ExcelJS from 'exceljs'

/**
 * Wrapper securise pour Excel avec ExcelJS
 * Alternative securisee a xlsx
 */

export class SecureXLSX {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv']

  static validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('Fichier trop volumineux (max 10MB)')
    }

    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error('Format de fichier non autorise')
    }
  }

  static async readFile(file: File): Promise<any[][]> {
    this.validateFile(file)
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const workbook = new ExcelJS.Workbook()
          await workbook.xlsx.load(arrayBuffer)
          
          const worksheet = workbook.worksheets[0]
          const jsonData: any[][] = []
          
          worksheet.eachRow((row) => {
            const rowData: any[] = []
            row.eachCell((cell) => {
              rowData.push(cell.value || '')
            })
            jsonData.push(rowData)
          })
          
          resolve(jsonData)
        } catch (error) {
          reject(new Error('Erreur lecture fichier Excel'))
        }
      }
      
      reader.onerror = () => reject(new Error('Erreur lecture fichier'))
      reader.readAsArrayBuffer(file)
    })
  }

  static async exportToExcel(data: any[], filename: string): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Data')
      
      // Ajouter les donnees
      data.forEach(row => {
        worksheet.addRow(row)
      })
      
      // Generer le fichier
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // Telecharger
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      throw new Error('Erreur export Excel')
    }
  }
}