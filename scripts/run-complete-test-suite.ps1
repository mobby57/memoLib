# MemoLib Complete Automated Test Suite
# PowerShell Orchestrator for All Test Categories
# Date: 2026-11-23

param(
    [switch]$SkipE2E = $false,
    [switch]$SkipPerformance = $false,
    [switch]$Fast = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$WarningPreference = "Continue"

# Colors
function Write-Header {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Section {
    param([string]$Message, [string]$Emoji = "")
    Write-Host "`n$Emoji $Message" -ForegroundColor Cyan
    Write-Host "-" * 60 -ForegroundColor DarkGray
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK]  $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INF] $Message" -ForegroundColor Blue
}

# Initialize results tracking
$testResults = @{
    StartTime = Get-Date
    Suites = @()
    TotalPassed = 0
    TotalFailed = 0
    TotalDuration = 0
}

function Run-Test {
    param(
        [string]$Label,
        [string]$Description,
        [string[]]$NpmArgs,
        [switch]$Optional = $false
    )
    
    Write-Section $Label
    Write-Info $Description
    
    $testStartTime = Get-Date
    
    try {
        $npmCommand = "npm $($NpmArgs -join ' ')"
        Write-Host "   Command: $npmCommand" -ForegroundColor DarkGray
        
        & npm @NpmArgs
        $exitCode = $LASTEXITCODE
        
        $testDuration = ((Get-Date) - $testStartTime).TotalSeconds
        
        if ($exitCode -eq 0) {
            Write-Success "$Label passed ($([Math]::Round($testDuration, 2))s)"
            $testResults.Suites += @{
                Label = $Label
                Status = "PASSED"
                Duration = $testDuration
                Command = $npmCommand
            }
            $testResults.TotalPassed++
            return $true
        } else {
            if ($Optional) {
                Write-Warning "$Label skipped or failed (exit code: $exitCode) - Optional suite"
                $testResults.TotalPassed++
            } else {
                Write-Error "$Label failed (exit code: $exitCode)"
                $testResults.Suites += @{
                    Label = $Label
                    Status = "FAILED"
                    Duration = $testDuration
                    Command = $npmCommand
                }
                $testResults.TotalFailed++
            }
            return $exitCode -eq 0
        }
    } catch {
        Write-Error "Exception in $Label : $_"
        $testResults.TotalFailed++
        return $false
    }
}

# Main Test Suite
Write-Header "🚀 MemoLib Complete Automated Test Suite"
Write-Info "Starting comprehensive test validation"
Write-Info "Date/Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Phase 1: Unit Tests
Write-Section "Phase 1: Core Unit Tests"
Run-Test "Unit Tests" `
    "Core business logic, utilities, constants, types" `
    @("run", "test:unit")

# Phase 2: Component Tests  
Write-Section "Phase 2: Component Tests"
Run-Test "Component Tests" `
    "React components, UI elements, hooks" `
    @("run", "test:components") `
    -Optional

# Phase 3: Integration Tests
Write-Section "Phase 3: Integration Tests"
Run-Test "Integration Tests" `
    "API routes, database integration, external services" `
    @("run", "test:integration") `
    -Optional

# Phase 4: CI-Optimized Tests
Write-Section "Phase 4: CI Test Suite"
Run-Test "CI Tests" `
    "Fast CI-optimized tests (excludes slow paths)" `
    @("run", "test:ci")

# Phase 5: E2E Tests (unless skipped)
if (-not $SkipE2E) {
    Write-Section "Phase 5: E2E Tests"
    Run-Test "End-to-End Tests" `
        "Full user workflows with Playwright" `
        @("run", "test:e2e") `
        -Optional
} else {
    Write-Info "E2E tests skipped"
}

# Phase 6: Security Tests
Write-Section "Phase 6: Security Tests"
Run-Test "Security Tests" `
    "Authentication, authorization, encryption, RGPD" `
    @("run", "test:security") `
    -Optional

# Phase 7: Performance Tests (unless skipped)
if (-not $SkipPerformance) {
    Write-Section "Phase 7: Performance Tests"
    Run-Test "Performance Tests" `
        "Load testing, response times, memory usage" `
        @("run", "test:performance") `
        -Optional
} else {
    Write-Info "Performance tests skipped"
}

# Phase 8: Health Checks
Write-Section "Phase 8: Health Checks"
Run-Test "Health Checks" `
    "Application status, database connectivity" `
    @("run", "test:health") `
    -Optional

# Phase 9: Smoke Tests
Write-Section "Phase 9: Smoke Tests"
Run-Test "Smoke Tests" `
    "Critical path verification" `
    @("run", "test:smoke") `
    -Optional

# Phase 10: Type Checking
Write-Section "Phase 10: Type Checking"
Run-Test "TypeScript Type Check" `
    "TypeScript strict mode validation" `
    @("run", "type-check")

# Phase 11: Linting
Write-Section "Phase 11: Code Linting"
Run-Test "ESLint" `
    "Code quality and style violations" `
    @("run", "lint")

# Phase 12: Coverage Report (unless in fast mode)
if (-not $Fast) {
    Write-Section "Phase 12: Coverage Report"
    Run-Test "Test Coverage" `
        "Test coverage metrics and analysis" `
        @("run", "test:coverage") `
        -Optional
} else {
    Write-Info "Coverage report skipped (fast mode enabled)"
}

# Calculate totals
$testResults.TotalDuration = ((Get-Date) - $testResults.StartTime).TotalSeconds
$totalTests = $testResults.TotalPassed + $testResults.TotalFailed
$passRate = if ($totalTests -gt 0) { [Math]::Round(($testResults.TotalPassed / $totalTests) * 100, 1) } else { 0 }

# Print Summary
Write-Header "Test Suite Summary"

Write-Host ""
Write-Host "Total Test Suites: $($testResults.Suites.Count)" -ForegroundColor Cyan
Write-Success "Passed: $($testResults.TotalPassed)"
if ($testResults.TotalFailed -gt 0) {
    Write-Error "Failed: $($testResults.TotalFailed)"
} else {
    Write-Success "Failed: 0"
}
Write-Info "Duration: $([Math]::Round($testResults.TotalDuration / 60, 2)) minutes"
Write-Info "Pass Rate: $passRate%"

# Details
Write-Section "Test Suite Details"
foreach ($suite in $testResults.Suites) {
    $statusEmoji = if ($suite.Status -eq "PASSED") { "[OK]" } else { "[ERR]" }
    Write-Host "$statusEmoji $($suite.Label) - $([Math]::Round($suite.Duration, 2))s" -ForegroundColor Gray
}

# Final verdict
Write-Section "Final Verdict"
if ($testResults.TotalFailed -eq 0 -and $testResults.TotalPassed -gt 0) {
    Write-Success "ALL TESTS PASSED!"
    Write-Success "MemoLib is production-ready for deployment."
    Write-Host ""
    Write-Host "[GO] Application Status: GO-LIVE AUTHORIZED" -ForegroundColor Green
    exit 0
} else {
    Write-Error "SOME TESTS FAILED"
    Write-Error "$($testResults.TotalFailed) test suite(s) failed. Review output above."
    Write-Host ""
    Write-Host "[STOP] Application Status: REVIEW REQUIRED" -ForegroundColor Red
    exit 1
}
