$ErrorActionPreference = 'Stop'

$roots = @(
  'MemoLib.Api',
  'MemoLib.Api-cleanpush',
  'out-azure',
  'MemoLib-Package-Client/app/out-azure'
)

$replacements = @(
  @{ Old = 'IA POSTE MANAGER'; New = 'MEMOLIB' },
  @{ Old = 'IA Poste Manager'; New = 'memoLib' },
  @{ Old = 'IA-Poste-Manager'; New = 'memoLib' },
  @{ Old = 'IAPosteManager'; New = 'MemoLib' },
  @{ Old = 'IaPosteManager'; New = 'MemoLib' },
  @{ Old = 'iapostemanager'; New = 'memolib' },
  @{ Old = 'ia-poste-manager'; New = 'memolib' }
)

$includePatterns = @(
  '*.md','*.txt','*.json','*.yml','*.yaml','*.xml','*.html','*.htm','*.css','*.scss',
  '*.js','*.jsx','*.ts','*.tsx','*.py','*.ps1','*.sh','*.bat','*.cmd','*.sql','*.cs',
  '*.conf','*.env','*.example','*.prisma','*.toml','*.ini','*.properties','*.map','*.lock',
  'Dockerfile','_headers','.snyk','.gitignore','.gitattributes'
)

$changedFiles = New-Object System.Collections.Generic.List[string]
$scanned = 0

foreach ($root in $roots) {
  if (-not (Test-Path -LiteralPath $root)) { continue }

  $files = Get-ChildItem -LiteralPath $root -Recurse -File -Include $includePatterns -Force -ErrorAction SilentlyContinue
  foreach ($file in $files) {
    $scanned++

    try {
      $original = [System.IO.File]::ReadAllText($file.FullName)
    } catch {
      continue
    }

    $updated = $original
    foreach ($replacement in $replacements) {
      $updated = $updated.Replace($replacement.Old, $replacement.New)
    }

    if ($updated -ne $original) {
      [System.IO.File]::WriteAllText($file.FullName, $updated)
      $changedFiles.Add($file.FullName) | Out-Null
    }
  }
}

Write-Output ("SCANNED=$scanned")
Write-Output ("CHANGED=$($changedFiles.Count)")
$changedFiles | Select-Object -First 100
