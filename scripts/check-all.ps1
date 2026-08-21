param(
    [string]$BaseUrl = 'http://localhost:3000'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$checks = @(
    @{ Name = 'Application'; Uri = "$BaseUrl/"; Expected = @(200, 307) },
    @{ Name = 'Health endpoint'; Uri = "$BaseUrl/api/health"; Expected = @(200) },
    @{ Name = 'Auth providers'; Uri = "$BaseUrl/api/auth/providers"; Expected = @(200) },
    @{ Name = 'API version'; Uri = "$BaseUrl/api/version"; Expected = @(200) }
)

foreach ($check in $checks) {
    try {
        $response = Invoke-WebRequest -Uri $check.Uri -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 10
        if ($response.StatusCode -notin $check.Expected) {
            throw "Unexpected HTTP status $($response.StatusCode)."
        }

        Write-Host "[check-all] $($check.Name): OK" -ForegroundColor Green
    } catch {
        Write-Host "[check-all] $($check.Name): $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
