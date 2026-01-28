# ============================================================================
# Azure Key Vault Secret Rotation Script
# ============================================================================
# Usage: ./scripts/azure-keyvault-rotate.ps1 -SecretName "NEXTAUTH-SECRET"
# Supports: NEXTAUTH-SECRET, ALL
# 
# Security: This script rotates secrets stored in Azure Key Vault
# Schedule: Run via Azure Automation or GitHub Actions monthly
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("NEXTAUTH-SECRET", "ALL")]
    [string]$SecretName = "ALL",
    
    [string]$VaultName = "memoLib-vault",
    [string]$ResourceGroup = "memoLib-rg",
    [string]$AppServiceName = "memoLib-app",
    [switch]$DryRun,
    [switch]$AutoRestart
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "INFO" { "White" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function New-CryptoRandomSecret {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return [Convert]::ToBase64String($bytes).Substring(0, $Length)
}

function Get-SecretExpiry {
    param([string]$Name)
    try {
        $secret = az keyvault secret show --vault-name $VaultName --name $Name 2>$null | ConvertFrom-Json
        if ($secret.attributes.expires) {
            return [DateTime]::Parse($secret.attributes.expires)
        }
    } catch {}
    return $null
}

function Rotate-AzureSecret {
    param([string]$Name)
    
    Write-Log "Processing secret: $Name"
    
    # Check expiry
    $expiry = Get-SecretExpiry -Name $Name
    if ($expiry) {
        $daysUntilExpiry = ($expiry - (Get-Date)).Days
        if ($daysUntilExpiry -gt 30 -and -not $Force) {
            Write-Log "Secret $Name expires in $daysUntilExpiry days, skipping rotation" -Level "INFO"
            return "SKIPPED"
        }
        Write-Log "Secret $Name expires in $daysUntilExpiry days, rotating..." -Level "WARNING"
    }
    
    # Generate new secret
    $newValue = switch ($Name) {
        "NEXTAUTH-SECRET" { New-CryptoRandomSecret -Length 32 }
        default { New-CryptoRandomSecret -Length 32 }
    }
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would rotate $Name" -Level "WARNING"
        return "DRY_RUN"
    }
    
    # Set new secret version with 90-day expiry
    $expiryDate = (Get-Date).AddDays(90).ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    $result = az keyvault secret set `
        --vault-name $VaultName `
        --name $Name `
        --value $newValue `
        --expires $expiryDate `
        --tags "rotated=$(Get-Date -Format 'yyyy-MM-dd')" "app=memoLib" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Secret $Name rotated, expires: $expiryDate" -Level "SUCCESS"
        return "ROTATED"
    } else {
        Write-Log "Failed: $result" -Level "ERROR"
        return "FAILED"
    }
}

# ============================================================================
# Main Execution
# ============================================================================

Write-Log "=========================================="
Write-Log "Azure Key Vault Secret Rotation"
Write-Log "Vault: $VaultName"
Write-Log "=========================================="

if ($DryRun) {
    Write-Log "DRY RUN MODE - No changes will be made" -Level "WARNING"
}

# Verify Azure CLI login
try {
    $account = az account show 2>&1 | ConvertFrom-Json
    Write-Log "Azure Account: $($account.name)" -Level "INFO"
} catch {
    Write-Log "Please login: az login" -Level "ERROR"
    exit 1
}

# Get secrets to rotate
$secretsToRotate = if ($SecretName -eq "ALL") {
    @("NEXTAUTH-SECRET")
} else {
    @($SecretName)
}

# Rotation results
$results = @{
    ROTATED = @()
    SKIPPED = @()
    FAILED = @()
    DRY_RUN = @()
}

foreach ($secret in $secretsToRotate) {
    $status = Rotate-AzureSecret -Name $secret
    $results[$status] += $secret
}

# Summary
Write-Log "=========================================="
Write-Log "Rotation Summary:"
if ($results.ROTATED.Count -gt 0) {
    Write-Log "  Rotated: $($results.ROTATED -join ', ')" -Level "SUCCESS"
}
if ($results.SKIPPED.Count -gt 0) {
    Write-Log "  Skipped: $($results.SKIPPED -join ', ')" -Level "INFO"
}
if ($results.FAILED.Count -gt 0) {
    Write-Log "  Failed: $($results.FAILED -join ', ')" -Level "ERROR"
}
Write-Log "=========================================="

# Auto-restart App Service if secrets were rotated
if ($results.ROTATED.Count -gt 0 -and $AutoRestart -and -not $DryRun) {
    Write-Log "Restarting App Service to apply new secrets..." -Level "INFO"
    az webapp restart --name $AppServiceName --resource-group $ResourceGroup 2>&1 | Out-Null
    Write-Log "App Service restarted" -Level "SUCCESS"
}

# Exit code
if ($results.FAILED.Count -gt 0) {
    exit 1
}
exit 0
