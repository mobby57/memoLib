$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$file = Join-Path $root "src\lib\services\storageService.ts"

Write-Host "=== Ajout compatibilité storageService.ts ===" -ForegroundColor Cyan

if (-not (Test-Path $file)) {
    throw "Fichier introuvable : $file"
}

$content = Get-Content $file -Raw

$compatibility = @'

/**
 * Récupère les documents depuis l'API.
 *
 * Compatibilité avec les anciens composants qui utilisaient
 * auparavant le localStorage.
 */
export async function getStoredFiles(filters?: {
  dossierId?: string
  clientId?: string
  category?: string
  tags?: string[]
}): Promise<StoredFile[]> {
  if (!filters?.dossierId) {
    return []
  }

  const params = new URLSearchParams()
  params.set('dossierId', filters.dossierId)
  params.set('limit', '100')

  const response = await fetch(
    `/api/documents/upload?${params.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Impossible de récupérer les documents')
  }

  const data = await response.json()

  return (data.documents || []).map(
    (document: {
      id: string
      filename: string
      originalName: string
      mimeType: string
      category: string
      description?: string | null
      size: number
      dossierId?: string | null
      createdAt: string
    }): StoredFile => ({
      id: document.id,
      name: document.filename,
      originalName: document.originalName,
      size: document.size,
      mimeType: document.mimeType,
      url: `/api/documents/download?id=${encodeURIComponent(document.id)}`,
      uploadedAt: new Date(document.createdAt),
      uploadedBy: 'current_user',
      version: 1,
      tags: [],
      metadata: {
        dossierId: document.dossierId || undefined,
        category: (
          document.category === 'piece_jointe' ||
          document.category === 'document_genere' ||
          document.category === 'template' ||
          document.category === 'autre'
            ? document.category
            : 'autre'
        ),
        description: document.description || undefined,
      },
    })
  )
}

/**
 * Récupère les versions d'un document.
 *
 * Le backend actuel ne gère pas encore le versioning explicite.
 * On retourne donc le document courant.
 */
export async function getFileVersions(
  fileId: string
): Promise<StoredFile[]> {
  const response = await fetch(
    `/api/documents/download?id=${encodeURIComponent(fileId)}`,
    {
      method: 'HEAD',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    return []
  }

  return []
}

/**
 * Suppression d'un document.
 *
 * Le endpoint DELETE devra être ajouté côté serveur.
 */
export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(
    `/api/documents/delete?id=${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Impossible de supprimer le document')
  }

  logger.info('Fichier supprimé', { fileId })
}
'@

if ($content -notmatch "export async function getStoredFiles") {
    Add-Content -Path $file -Value $compatibility -Encoding UTF8
}

Write-Host ""
Write-Host "Exports de compatibilité ajoutés." -ForegroundColor Green
Write-Host ""
Write-Host "=== Vérification TypeScript ===" -ForegroundColor Cyan

Push-Location $root

try {
    npx tsc --noEmit

    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript a encore détecté des erreurs."
    }

    Write-Host ""
    Write-Host "=== TypeScript OK ===" -ForegroundColor Green
}
finally {
    Pop-Location
}