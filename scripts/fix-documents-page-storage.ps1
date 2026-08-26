$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$file = Join-Path $root "src\app\[locale]\documents\page.tsx"

Write-Host "=== Migration documents/page.tsx ===" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $file)) {
    throw "Fichier introuvable : $file"
}

$content = Get-Content -LiteralPath $file -Raw

# ------------------------------------------------------------
# 1. Ajouter useEffect
# ------------------------------------------------------------

$content = $content -replace `
    "import \{ useState \} from 'react'", `
    "import { useEffect, useState } from 'react'"

# Si l'import React est différent, essayer une deuxième forme.
if ($content -notmatch "useEffect") {
    $content = $content -replace `
        "import \{ useState,", `
        "import { useEffect, useState,"
}

# ------------------------------------------------------------
# 2. Remplacer l'initialisation synchrone
# ------------------------------------------------------------

$old = "const [files, setFiles] = useState<StoredFile[]>(getStoredFiles())"

$new = @'
const [files, setFiles] = useState<StoredFile[]>([])
'@

if ($content.Contains($old)) {
    $content = $content.Replace($old, $new.TrimEnd())
} else {
    Write-Host "Initialisation files déjà modifiée ou introuvable." -ForegroundColor Yellow
}

# ------------------------------------------------------------
# 3. Remplacer setFiles(getStoredFiles())
# ------------------------------------------------------------

$old = "setFiles(getStoredFiles())"

$new = @'
void loadFiles()
'@

$content = $content.Replace($old, $new.TrimEnd())

# ------------------------------------------------------------
# 4. Ajouter une fonction loadFiles après les states
# ------------------------------------------------------------

if ($content -notmatch "const loadFiles = async") {

    $marker = "const [files, setFiles] = useState<StoredFile[]>([])"

    if ($content.Contains($marker)) {

        $loadFunction = @'

  const loadFiles = async () => {
    try {
      const dossierId =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('dossierId')
          : null

      if (!dossierId) {
        setFiles([])
        return
      }

      const result = await getStoredFiles({ dossierId })
      setFiles(result)
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error)
      setFiles([])
    }
  }

  useEffect(() => {
    void loadFiles()
  }, [])
'@

        $content = $content.Replace(
            $marker,
            $marker + $loadFunction
        )
    }
}

# ------------------------------------------------------------
# 5. Remplacer getFileVersions(...).map(...)
# ------------------------------------------------------------

$old = "getFileVersions(selectedFile.id).map((version) => ("

if ($content.Contains($old)) {

    Write-Host "Migration du rendu des versions..." -ForegroundColor Yellow

    # Ajouter un state pour les versions
    $marker = "const [files, setFiles] = useState<StoredFile[]>([])"

    if ($content -notmatch "selectedFileVersions") {

        $state = @'

  const [selectedFileVersions, setSelectedFileVersions] =
    useState<StoredFile[]>([])
'@

        $content = $content.Replace(
            $marker,
            $marker + $state
        )
    }

    # Remplacer directement le map
    $content = $content.Replace(
        "getFileVersions(selectedFile.id).map((version) => (",
        "selectedFileVersions.map((version) => ("
    )

    # Ajouter le chargement lors de la sélection
    $selectionPattern = "setSelectedFile"

    if ($content.Contains($selectionPattern)) {
        Write-Host "La sélection des versions devra être vérifiée manuellement." -ForegroundColor Yellow
    }
}

# ------------------------------------------------------------
# 6. Sauvegarde
# ------------------------------------------------------------

Set-Content -LiteralPath $file -Value $content -Encoding UTF8

Write-Host ""
Write-Host "Migration écrite dans :" -ForegroundColor Green
Write-Host $file
Write-Host ""

# ------------------------------------------------------------
# 7. TypeScript
# ------------------------------------------------------------

Push-Location $root

try {
    Write-Host "=== Vérification TypeScript ===" -ForegroundColor Cyan

    npx tsc --noEmit

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "TypeScript contient encore des erreurs." -ForegroundColor Red
        exit $LASTEXITCODE
    }

    Write-Host ""
    Write-Host "=== TypeScript OK ===" -ForegroundColor Green
}
finally {
    Pop-Location
}