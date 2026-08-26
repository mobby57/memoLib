$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Analyse du projet MEMOLIB ===" -ForegroundColor Cyan
Write-Host ""

$root = (Get-Location).Path
$output = Join-Path $root "code-report.txt"

$excludedDirs = @(
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    "coverage",
    ".turbo"
)

$extensions = @(
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".prisma",
    ".css",
    ".scss",
    ".md"
)

function Is-Excluded {
    param([string]$Path)

    foreach ($dir in $excludedDirs) {
        if ($Path -match "[\\/]" + [regex]::Escape($dir) + "([\\/]|$)") {
            return $true
        }
    }

    return $false
}

$files = Get-ChildItem -Path $root -Recurse -File |
    Where-Object {
        (-not (Is-Excluded $_.FullName)) -and
        ($extensions -contains $_.Extension.ToLower())
    } |
    Sort-Object FullName

$report = New-Object System.Collections.Generic.List[string]

$report.Add("============================================================")
$report.Add("MEMOLIB - RAPPORT D'ANALYSE DU CODE")
$report.Add("============================================================")
$report.Add("")
$report.Add("Projet : $root")
$report.Add("Date   : $(Get-Date)")
$report.Add("")

# ------------------------------------------------------------
# 1. Informations générales
# ------------------------------------------------------------

$report.Add("============================================================")
$report.Add("1. INFORMATIONS GENERALES")
$report.Add("============================================================")
$report.Add("")

$packagePath = Join-Path $root "package.json"

if (Test-Path -LiteralPath $packagePath) {
    $package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json

    $report.Add("Nom       : $($package.name)")
    $report.Add("Version   : $($package.version)")
    $report.Add("Scripts   :")

    if ($package.scripts) {
        $package.scripts.PSObject.Properties | ForEach-Object {
            $report.Add("  - $($_.Name) : $($_.Value)")
        }
    }

    $report.Add("")
}

# ------------------------------------------------------------
# 2. Arborescence
# ------------------------------------------------------------

$report.Add("============================================================")
$report.Add("2. ARBORESCENCE DU CODE")
$report.Add("============================================================")
$report.Add("")

foreach ($file in $files) {
    $relative = $file.FullName.Substring($root.Length).TrimStart('\')
    $report.Add($relative)
}

$report.Add("")

# ------------------------------------------------------------
# 3. Statistiques
# ------------------------------------------------------------

$report.Add("============================================================")
$report.Add("3. STATISTIQUES")
$report.Add("============================================================")
$report.Add("")

$report.Add("Nombre de fichiers : $($files.Count)")
$report.Add("")

$files |
    Group-Object Extension |
    Sort-Object Name |
    ForEach-Object {
        $report.Add("  $($_.Name) : $($_.Count)")
    }

$report.Add("")

# ------------------------------------------------------------
# 4. Fichiers importants
# ------------------------------------------------------------

$importantPatterns = @(
    "package.json",
    "schema.prisma",
    "next.config",
    "middleware",
    "route.ts",
    "page.tsx",
    "layout.tsx",
    "auth",
    "services",
    "api"
)

$report.Add("============================================================")
$report.Add("4. FICHIERS IMPORTANTS")
$report.Add("============================================================")
$report.Add("")

foreach ($file in $files) {
    $relative = $file.FullName.Substring($root.Length).TrimStart('\')

    foreach ($pattern in $importantPatterns) {
        if ($relative -like "*$pattern*") {
            $report.Add("------------------------------------------------------------")
            $report.Add($relative)
            $report.Add("------------------------------------------------------------")

            try {
                $content = Get-Content -LiteralPath $file.FullName -Raw

                $lines = $content -split "`r?`n"

                $maxLines = [Math]::Min($lines.Count, 250)

                for ($i = 0; $i -lt $maxLines; $i++) {
                    $report.Add(("{0,4}: {1}" -f ($i + 1), $lines[$i]))
                }

                if ($lines.Count -gt 250) {
                    $report.Add("")
                    $report.Add("... fichier tronqué après 250 lignes ...")
                }
            }
            catch {
                $report.Add("Impossible de lire le fichier : $($_.Exception.Message)")
            }

            $report.Add("")
            break
        }
    }
}

# ------------------------------------------------------------
# 5. Vérifications TypeScript
# ------------------------------------------------------------

$report.Add("============================================================")
$report.Add("5. ETAT TYPESCRIPT")
$report.Add("============================================================")
$report.Add("")

$tsconfig = Join-Path $root "tsconfig.json"

if (Test-Path -LiteralPath $tsconfig) {
    $report.Add("tsconfig.json : PRESENT")
} else {
    $report.Add("tsconfig.json : ABSENT")
}

$report.Add("")

# ------------------------------------------------------------
# 6. Documents spécifiques
# ------------------------------------------------------------

$documentFiles = @(
    "src\app\api\documents\[id]\route.ts",
    "src\lib\services\storageService.ts",
    "src\app\[locale]\documents\page.tsx"
)

$report.Add("============================================================")
$report.Add("6. MODULE DOCUMENTS")
$report.Add("============================================================")
$report.Add("")

foreach ($relativePath in $documentFiles) {

    $fullPath = Join-Path $root $relativePath

    $report.Add("------------------------------------------------------------")
    $report.Add($relativePath)
    $report.Add("------------------------------------------------------------")

    if (Test-Path -LiteralPath $fullPath) {
        $content = Get-Content -LiteralPath $fullPath -Raw
        $lines = $content -split "`r?`n"

        for ($i = 0; $i -lt $lines.Count; $i++) {
            $report.Add(("{0,4}: {1}" -f ($i + 1), $lines[$i]))
        }
    }
    else {
        $report.Add("FICHIER ABSENT")
    }

    $report.Add("")
}

# ------------------------------------------------------------
# 7. Fin
# ------------------------------------------------------------

$report.Add("============================================================")
$report.Add("FIN DU RAPPORT")
$report.Add("============================================================")

$report | Set-Content -LiteralPath $output -Encoding UTF8

Write-Host "Rapport cree :" -ForegroundColor Green
Write-Host $output -ForegroundColor Yellow
Write-Host ""
Write-Host "Fichiers analyses : $($files.Count)" -ForegroundColor Green
Write-Host ""