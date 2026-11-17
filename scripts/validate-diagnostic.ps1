# ============================================================================
# Database Diagnostic System - Automated Validation Script (Windows)
# ============================================================================
# This script runs the full validation suite and reports readiness for deployment
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\validate-diagnostic.ps1
# ============================================================================

param(
    [switch]$Verbose = $false,
    [switch]$SkipDatabaseTest = $false,
    [string]$OutputPath = "diagnostic-validation-results.json"
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$projectRoot = Split-Path -Parent $PSScriptRoot
$resultsFile = Join-Path $projectRoot $OutputPath

# Color codes
$colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
    Header  = "Magenta"
}

# Results tracking
$results = @{
    timestamp = $timestamp
    status = "UNKNOWN"
    phases = @{}
    healthScore = 0
    errors = @()
    warnings = @()
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor $colors.Header
    Write-Host $Message -ForegroundColor $colors.Header
    Write-Host "===============================================================" -ForegroundColor $colors.Header
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "-> $Message" -ForegroundColor $colors.Info
}

function Write-Success {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor $colors.Success
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor $colors.Error
    $results.errors += $Message
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor $colors.Warning
    $results.warnings += $Message
}

function Test-CommandExists {
    param([string]$CommandName)
    $command = Get-Command $CommandName -ErrorAction SilentlyContinue
    return $null -ne $command
}

function Test-FileExists {
    param([string]$FilePath)
    return Test-Path -Path $FilePath -PathType Leaf
}

function Test-FolderExists {
    param([string]$FolderPath)
    return Test-Path -Path $FolderPath -PathType Container
}

function Test-EnvironmentVariable {
    param([string]$VariableName)
    return $null -ne (Get-Item -Path "Env:\$VariableName" -ErrorAction SilentlyContinue).Value
}

function Invoke-CommandSafely {
    param(
        [string]$Command,
        [string]$Description,
        [switch]$Optional = $false
    )
    
    Write-Step $Description
    
    try {
        $output = Invoke-Expression $Command 2>&1
        Write-Success $Description
        return $output
    }
    catch {
        if ($Optional) {
            Write-Warning-Custom "$Description (optional)"
            return $null
        }
        else {
            Write-Error-Custom "$Description failed: $_"
            throw
        }
    }
}

# ============================================================================
# PHASE 1: ENVIRONMENT CHECK
# ============================================================================

Write-Header "PHASE 1: Environment Check"

Write-Step "Checking Node.js installation"
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
}
else {
    Write-Error-Custom "Node.js not found"
    exit 1
}

Write-Step "Checking npm installation"
if (Test-CommandExists "npm") {
    $npmVersion = npm --version
    Write-Success "npm found: $npmVersion"
}
else {
    Write-Error-Custom "npm not found"
    exit 1
}

Write-Step "Checking project structure"
if (-not (Test-FileExists (Join-Path $projectRoot "package.json"))) {
    Write-Error-Custom "package.json not found"
    exit 1
}
Write-Success "package.json found"

if (-not (Test-FileExists (Join-Path $projectRoot "prisma\schema.prisma"))) {
    Write-Error-Custom "prisma/schema.prisma not found"
    exit 1
}
Write-Success "prisma/schema.prisma found"

$results.phases.environment = "PASS"

Write-Host ""

# ============================================================================
# PHASE 2: DEPENDENCY CHECK
# ============================================================================

Write-Header "PHASE 2: Dependencies"

Write-Step "Checking node_modules"
if (Test-FolderExists (Join-Path $projectRoot "node_modules")) {
    Write-Success "node_modules exists"
}
else {
    Write-Warning-Custom "node_modules not found, would need npm install"
}

$results.phases.dependencies = "PASS"

Write-Host ""

# ============================================================================
# PHASE 3: PRISMA VALIDATION
# ============================================================================

Write-Header "PHASE 3: Prisma Configuration"

Write-Step "Checking DATABASE_URL"
if (Test-EnvironmentVariable "DATABASE_URL") {
    Write-Success "DATABASE_URL is set"
}
else {
    Write-Warning-Custom "DATABASE_URL not set in this process; database connectivity remains untested"
}

Write-Step "Checking Prisma schema"
if (Test-FileExists (Join-Path $projectRoot "prisma\schema.prisma")) {
    Write-Success "Prisma schema found"
}
else {
    Write-Error-Custom "Prisma schema not found"
    exit 1
}

Write-Step "Validating schema contains DatabaseDiagnosticLog"
$schemaContent = Get-Content (Join-Path $projectRoot "prisma\schema.prisma") -Raw
if ($schemaContent -match "model DatabaseDiagnosticLog") {
    Write-Success "DatabaseDiagnosticLog model found"
}
else {
    Write-Error-Custom "DatabaseDiagnosticLog model not found in schema"
    exit 1
}

$results.phases.prisma = "PASS"

Write-Host ""

# ============================================================================
# PHASE 4: DATABASE CONNECTION (OPTIONAL)
# ============================================================================

if (-not $SkipDatabaseTest) {
    Write-Header "PHASE 4: Database Connection"
    
    Write-Step "Testing database connectivity (optional, may fail if DB not running locally)"
    try {
        # This would require Prisma client to be generated
        Write-Warning-Custom "Database test skipped (requires running application)"
        $results.phases.database = "SKIPPED"
    }
    catch {
        Write-Warning-Custom "Database test could not run: $_"
        $results.phases.database = "SKIPPED"
    }
}
else {
    Write-Header "PHASE 4: Database Connection (SKIPPED)"
    $results.phases.database = "SKIPPED"
}

Write-Host ""

# ============================================================================
# PHASE 5: DIAGNOSTIC FILES CHECK
# ============================================================================

Write-Header "PHASE 5: Diagnostic System Files"

$requiredFiles = @(
    "scripts/diagnostic-postgres.ts",
    ".github/workflows/postgres-diagnostic.yml",
    "src/app/api/cron/pg-diagnostic.ts",
    "docs/DATABASE_DIAGNOSTIC_AUTOMATION.md"
)

$allFilesFound = $true
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $projectRoot $file
    if (Test-FileExists $fullPath) {
        Write-Success "$file exists"
    }
    else {
        Write-Error-Custom "$file missing"
        $allFilesFound = $false
    }
}

if (-not $allFilesFound) {
    exit 1
}

$results.phases.diagnosticFiles = "PASS"

Write-Host ""

# ============================================================================
# PHASE 6: DIAGNOSTIC EXECUTION
# ============================================================================

Write-Header "PHASE 6: Diagnostic Script Validation"

Write-Step "Checking diagnostic script content"
$diagnosticPath = Join-Path $projectRoot "scripts\diagnostic-postgres.ts"

if (Test-FileExists $diagnosticPath) {
    $diagnosticContent = Get-Content $diagnosticPath -Raw
    
    $checkHealthScore = ($diagnosticContent -match "calculateHealthScore")
    $checkRunDiagnostic = ($diagnosticContent -match "async\s+run\s*\(")
    $checkPrisma = ($diagnosticContent -match "prisma\.databaseDiagnosticLog\.create")
    
    if ($checkHealthScore) {
        Write-Success "Contains: calculateHealthScore function"
    }
    else {
        Write-Error-Custom "Missing: calculateHealthScore function"
    }
    
    if ($checkRunDiagnostic) {
        Write-Success "Contains: diagnostic run method"
    }
    else {
        Write-Error-Custom "Missing: diagnostic run method"
    }
    
    if ($checkPrisma) {
        Write-Success "Contains: Prisma databaseDiagnosticLog.create"
    }
    else {
        Write-Error-Custom "Missing: Prisma databaseDiagnosticLog.create"
    }
    
    if (-not ($checkHealthScore -and $checkRunDiagnostic -and $checkPrisma)) {
        Write-Error-Custom "Diagnostic script validation failed"
        exit 1
    }
}
else {
    Write-Error-Custom "Diagnostic script not found"
    exit 1
}

Write-Warning-Custom "Diagnostic execution test requires running application (skipped)"
$results.phases.diagnosticExecution = "PARTIAL"

Write-Host ""

# ============================================================================
# PHASE 7: GITHUB ACTIONS WORKFLOW
# ============================================================================

Write-Header "PHASE 7: GitHub Actions Workflow"

$workflowPath = Join-Path $projectRoot ".github\workflows\postgres-diagnostic.yml"

Write-Step "Checking workflow file"
if (Test-FileExists $workflowPath) {
    Write-Success "Workflow file exists"
}
else {
    Write-Error-Custom "Workflow file missing"
    exit 1
}

Write-Step "Validating workflow configuration"
$workflowContent = Get-Content $workflowPath -Raw

$checkSchedule = ($workflowContent -match "schedule:")
$checkCron = ($workflowContent -match "cron:")
$checkDispatch = ($workflowContent -match "workflow_dispatch:")
$checkDiagnostic = ($workflowContent -match "diagnostic-postgres\.ts")
$checkSlackWebhook = ($workflowContent -match "SLACK_WEBHOOK_URL")

if ($checkSchedule) {
    Write-Success "Contains: schedule configuration"
}
else {
    Write-Error-Custom "Missing: schedule configuration"
}

if ($checkCron) {
    Write-Success "Contains: cron schedule"
}
else {
    Write-Error-Custom "Missing: cron schedule"
}

if ($checkDispatch) {
    Write-Success "Contains: workflow_dispatch trigger"
}
else {
    Write-Error-Custom "Missing: workflow_dispatch trigger"
}

if ($checkDiagnostic) {
    Write-Success "Contains: diagnostic-postgres.ts"
}
else {
    Write-Error-Custom "Missing: diagnostic-postgres.ts"
}

if ($checkSlackWebhook) {
    Write-Success "Contains: SLACK_WEBHOOK_URL"
}
else {
    Write-Error-Custom "Missing: SLACK_WEBHOOK_URL"
}

$workflowPassed = ($checkSchedule -and $checkCron -and $checkDispatch -and $checkDiagnostic -and $checkSlackWebhook)

if (-not $workflowPassed) {
    Write-Error-Custom "Workflow validation failed"
    exit 1
}

Write-Success "All workflow checks passed"

$results.phases.gitHubActions = "PASS"

Write-Host ""

# ============================================================================
# PHASE 8: API ENDPOINT CHECK
# ============================================================================

Write-Header "PHASE 8: Cron API Endpoint"

$apiPath = Join-Path $projectRoot "src\app\api\cron\pg-diagnostic.ts"

Write-Step "Checking API file"
if (Test-FileExists $apiPath) {
    Write-Success "API file exists"
}
else {
    Write-Error-Custom "API file missing"
    exit 1
}

Write-Step "Validating API configuration"
$apiContent = Get-Content $apiPath -Raw

$checkBearer = ($apiContent -match "Bearer")
$checkPrisma = ($apiContent -match "prisma\.databaseDiagnosticLog")

if ($checkBearer) {
    Write-Success "Bearer authentication check"
}
else {
    Write-Error-Custom "Missing Bearer authentication"
}

if ($checkPrisma) {
    Write-Success "Database persistence check"
}
else {
    Write-Error-Custom "Missing database persistence"
}

$apiPassed = ($checkBearer -and $checkPrisma)

if (-not $apiPassed) {
    exit 1
}

Write-Success "All API checks passed"

$results.phases.apiEndpoint = "PASS"

Write-Host ""

# ============================================================================
# PHASE 9: ENVIRONMENT SECRETS
# ============================================================================

Write-Header "PHASE 9: Configuration & Secrets"

Write-Step "Checking CRON_SECRET"
$cronSecret = [Environment]::GetEnvironmentVariable("CRON_SECRET")
if ($cronSecret) {
    if ($cronSecret.Length -gt 16) {
        Write-Success "CRON_SECRET set with sufficient length"
    }
    else {
        Write-Warning-Custom "CRON_SECRET may be too short (consider: openssl rand -hex 32)"
    }
}
else {
    Write-Warning-Custom "CRON_SECRET not set (required for GitHub Actions)"
}

Write-Step "Checking SLACK_WEBHOOK_URL"
$slackWebhook = [Environment]::GetEnvironmentVariable("SLACK_WEBHOOK_URL")
if ($slackWebhook) {
    if ($slackWebhook.StartsWith("https://hooks.slack.com")) {
        Write-Success "SLACK_WEBHOOK_URL valid format"
    }
    else {
        Write-Warning-Custom "SLACK_WEBHOOK_URL format may be incorrect"
    }
}
else {
    Write-Warning-Custom "SLACK_WEBHOOK_URL not set (alerts won't be sent)"
}

$results.phases.secrets = if ($cronSecret -and $slackWebhook) { "PASS" } else { "PARTIAL" }

Write-Host ""

# ============================================================================
# PHASE 10: DOCUMENTATION
# ============================================================================

Write-Header "PHASE 10: Documentation"

$docFiles = @(
    "docs/DATABASE_DIAGNOSTIC_AUTOMATION.md",
    "00_DATABASE_DIAGNOSTIC_SYSTEM_DELIVERY.md",
    "ALIGNMENT_DIAGNOSTIC_X_COMMERCIAL.md",
    "PLAN_90_JOURS_INTEGRATED.md"
)

$allDocsFound = $true
foreach ($file in $docFiles) {
    $fullPath = Join-Path $projectRoot $file
    if (Test-FileExists $fullPath) {
        Write-Success "$file exists"
    }
    else {
        Write-Warning-Custom "$file missing (optional)"
    }
}

$results.phases.documentation = "PASS"

Write-Host ""

# ============================================================================
# FINAL REPORT
# ============================================================================

Write-Header "STATIC CHECKS COMPLETE"

$allPassed = ($results.errors.Count -eq 0)

if ($allPassed) {
    Write-Host "Diagnostic System Status: " -NoNewline
    Write-Host "INCOMPLETE - database and diagnostic execution were not tested" -ForegroundColor $colors.Warning
}
else {
    Write-Host "Diagnostic System Status: " -NoNewline
    Write-Host "ISSUES FOUND" -ForegroundColor $colors.Error
}

Write-Host ""
Write-Host "Summary:"
Write-Host "  - Static file and content checks completed"
Write-Host "  - Database connectivity and diagnostic execution: not tested"
Write-Host ""

if ($results.errors.Count -gt 0) {
    Write-Host "Errors:"
    foreach ($error in $results.errors) {
        Write-Host "  - $error" -ForegroundColor $colors.Error
    }
    Write-Host ""
}

if ($results.warnings.Count -gt 0) {
    Write-Host "Warnings:"
    foreach ($warning in $results.warnings) {
        Write-Host "  - $warning" -ForegroundColor $colors.Warning
    }
    Write-Host ""
}

Write-Host "Next Steps:"
Write-Host "  1. Verify DATABASE_URL is set correctly"
Write-Host "  2. Configure GitHub secrets (if deploying to GitHub):"
Write-Host "     - CRON_SECRET: generate a cryptographically secure secret"
Write-Host "     - SLACK_WEBHOOK_URL: https://hooks.slack.com/services/..."
Write-Host "  3. Test database connectivity and diagnostic execution before deployment"
Write-Host ""
Write-Host "Report generated: $timestamp"
Write-Host ""

# ============================================================================
# SAVE RESULTS
# ============================================================================

$results.status = if ($allPassed) { "CHECKS_INCOMPLETE" } else { "NEEDS_ATTENTION" }

$resultsJson = $results | ConvertTo-Json -Depth 10
$resultsJson | Out-File -FilePath $resultsFile -Encoding UTF8

Write-Success "Results saved to: $resultsFile"
Write-Host ""

exit 1
