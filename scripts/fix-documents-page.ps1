$ErrorActionPreference = "Stop"

Write-Host "=== Correction storageService.ts ===" -ForegroundColor Cyan

$path = ".\src\app\[locale]\documents\page.tsx"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Fichier introuvable : $path"
}

$content = Get-Content -LiteralPath $path -Raw

# Corriger handleViewVersions pour gérer la fonction async
$old = @"
  const handleViewVersions = (file: StoredFile) => {
    setSelectedFile(file)
    setShowVersions(true)
  }
"@

$new = @"
  const handleViewVersions = async (file: StoredFile) => {
    try {
      setSelectedFile(file)
      const versions = await getFileVersions(file.id)
      setSelectedFileVersions(versions)
      setShowVersions(true)
    } catch (error) {
      console.error('Erreur lors du chargement des versions:', error)
      setSelectedFileVersions([])
      setSelectedFile(file)
      setShowVersions(true)
    }
  }
"@

if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    Write-Host "handleViewVersions corrige." -ForegroundColor Green
}
else {
    Write-Host "handleViewVersions deja modifie ou format different." -ForegroundColor Yellow
}

# Remplacer les statistiques locales par des statistiques basees sur les fichiers charges
$oldStats = @"
  const stats = getStorageStats()
  
  const filteredFiles = selectedCategory === 'all' 
"@

$newStats = @"
  const stats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    byCategory: files.reduce((acc, file) => {
      const category = file.metadata.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byType: files.reduce((acc, file) => {
      const type = file.mimeType.split('/')[0]
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  const filteredFiles = selectedCategory === 'all' 
"@

if ($content.Contains($oldStats)) {
    $content = $content.Replace($oldStats, $newStats)
    Write-Host "Statistiques corrigees." -ForegroundColor Green
}
else {
    Write-Host "Bloc statistiques deja modifie ou format different." -ForegroundColor Yellow
}

Set-Content -LiteralPath $path -Value $content -Encoding UTF8

Write-Host ""
Write-Host "=== Verification TypeScript ===" -ForegroundColor Cyan

npx tsc --noEmit

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript detecte encore des erreurs." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== SUCCES : TypeScript OK ===" -ForegroundColor Green
