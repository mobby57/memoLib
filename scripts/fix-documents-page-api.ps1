$ErrorActionPreference = 'Stop'

Write-Host "=== Migration page Documents vers API ===" -ForegroundColor Cyan

$pagePath = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot '..\src\app\[locale]\documents\page.tsx')
)

if (-not (Test-Path -LiteralPath $pagePath)) {
    throw "Fichier introuvable : $pagePath"
}

$content = Get-Content -LiteralPath $pagePath -Raw -Encoding UTF8

# ------------------------------------------------------------
# Imports
# ------------------------------------------------------------

$content = $content -replace `
    "import \{ getStoredFiles, getFileVersions, deleteFile, downloadFile, formatFileSize, getFileIcon, getStorageStats, type StoredFile \} from '@/lib/services/storageService'",
    "import { formatFileSize, getFileIcon, type StoredFile } from '@/lib/services/storageService'"

# ------------------------------------------------------------
# Remplacer le début de la fonction jusqu'aux catégories
# ------------------------------------------------------------

$startMarker = "export default function DocumentsPage() {"
$endMarker = "  const catégories = ["

$start = $content.IndexOf($startMarker)
$end = $content.IndexOf($endMarker)

if ($start -lt 0) {
    throw "Début de DocumentsPage introuvable"
}

if ($end -lt 0) {
    throw "Bloc catégories introuvable"
}

$prefix = $content.Substring(0, $start)

$suffix = $content.Substring($end)

$newFunctionStart = @'
export default function DocumentsPage() {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null)
  const [selectedFileVersions, setSelectedFileVersions] = useState<StoredFile[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const getDossierId = (): string | null => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('dossierId')
  }

  const loadFiles = async () => {
    const dossierId = getDossierId()

    if (!dossierId) {
      setFiles([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        `/api/documents/upload?dossierId=${encodeURIComponent(dossierId)}&limit=100`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        throw new Error('Impossible de récupérer les documents')
      }

      const data = await response.json()

      const documents: StoredFile[] = (data.documents || []).map((document: any) => ({
        id: document.id,
        name: document.filename,
        originalName: document.originalName || document.filename,
        size: document.size,
        mimeType: document.mimeType,
        url: `/api/documents/download?id=${encodeURIComponent(document.id)}`,
        uploadedAt: new Date(document.createdAt),
        uploadedBy: '',
        version: 1,
        tags: [],
        metadata: {
          dossierId: document.dossierId,
          category: document.category || 'autre',
          description: document.description || undefined,
        },
      }))

      setFiles(documents)
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error)
      showToast('Impossible de charger les documents', 'error')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFiles()
  }, [])

  const refreshFiles = () => {
    void loadFiles()
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return

    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(fileId)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      await loadFiles()
      showToast('Fichier supprimé avec succès', 'success')
    } catch (error) {
      console.error('Erreur suppression:', error)
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  const handleDownload = async (file: StoredFile) => {
    try {
      const response = await fetch(
        `/api/documents/download?id=${encodeURIComponent(file.id)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Erreur lors du téléchargement')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = file.originalName
      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(url)

      showToast('Téléchargement démarré', 'info')
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      showToast(
        error instanceof Error ? error.message : 'Erreur lors du téléchargement',
        'error'
      )
    }
  }

  const handleViewVersions = async (file: StoredFile) => {
    setSelectedFile(file)

    try {
      /*
       * Le modèle Document actuel ne possède pas encore de véritable
       * endpoint de versioning. On affiche donc au minimum le document
       * courant comme version 1.
       */
      setSelectedFileVersions([file])
    } catch (error) {
      console.error('Erreur chargement versions:', error)
      setSelectedFileVersions([])
    }

    setShowVersions(true)
  }

  const stats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    byCategory: files.reduce((result, file) => {
      const category = file.metadata.category
      result[category] = (result[category] || 0) + 1
      return result
    }, {} as Record<string, number>),
    byType: files.reduce((result, file) => {
      const type = file.mimeType.split('/')[0]
      result[type] = (result[type] || 0) + 1
      return result
    }, {} as Record<string, number>),
  }

  const filteredFiles =
    selectedCategory === 'all'
      ? files
      : files.filter(
          file => file.metadata.category === selectedCategory
        )

'@

$content = $prefix + $newFunctionStart + "`r`n" + $suffix

# ------------------------------------------------------------
# Corriger catégories : ne pas dépendre du vieux storageService
# ------------------------------------------------------------

$content = $content -replace `
    "const catégories = \[",
    "const catégories = ["

# ------------------------------------------------------------
# Ajouter le dossierId au FileUploader
# ------------------------------------------------------------

$oldUploader = @'
          options={{
            category: 'piece_jointe',
            description: 'Document uploade via l\'interface',
          }}
'@

$newUploader = @'
          options={{
            dossierId: getDossierId() || undefined,
            category: 'piece_jointe',
            description: 'Document uploadé via l\'interface',
          }}
'@

$content = $content.Replace($oldUploader, $newUploader)

# ------------------------------------------------------------
# Affichage loading
# ------------------------------------------------------------

$oldEmpty = @'
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun fichier trouve
            </p>
          </div>
'@

$newEmpty = @'
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Chargement des documents...
            </p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun fichier trouvé
            </p>
          </div>
'@

$content = $content.Replace($oldEmpty, $newEmpty)

# ------------------------------------------------------------
# Écriture
# ------------------------------------------------------------

Set-Content -LiteralPath $pagePath -Value $content -Encoding UTF8

Write-Host ""
Write-Host "page.tsx migré vers l'API." -ForegroundColor Green

# ------------------------------------------------------------
# Vérification des anciens appels
# ------------------------------------------------------------

Write-Host ""
Write-Host "=== Recherche anciens appels ===" -ForegroundColor Cyan

$remaining = Select-String `
    -LiteralPath $pagePath `
    -Pattern 'getStoredFiles|getFileVersions|deleteFile|downloadFile|getStorageStats'

if ($remaining) {
    Write-Host "ATTENTION : anciens appels encore présents :" -ForegroundColor Yellow
    $remaining
}

# ------------------------------------------------------------
# TypeScript
# ------------------------------------------------------------

Write-Host ""
Write-Host "=== TypeScript ===" -ForegroundColor Cyan

npx tsc --noEmit

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript contient encore des erreurs." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host " TypeScript : OK" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green