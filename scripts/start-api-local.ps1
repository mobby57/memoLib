[CmdletBinding()]
param(
    [string]$Project = "MemoLib.Api.csproj",
    [string]$Issuer = "memolib-local",
    [string]$Audience = "memolib-local-client",
    [string]$SecretKey = "0123456789abcdef0123456789abcdef",
    [switch]$NoRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Set-IfMissing {
    param(
        [string]$Name,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($Name, "Process"))) {
        [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
        Write-Host "[start-api-local] $Name set (process scope)."
    }
    else {
        Write-Host "[start-api-local] $Name already defined, keeping existing value."
    }
}

Set-IfMissing -Name "JwtSettings__Issuer" -Value $Issuer
Set-IfMissing -Name "JwtSettings__Audience" -Value $Audience
Set-IfMissing -Name "JwtSettings__SecretKey" -Value $SecretKey

Write-Host "[start-api-local] Project: $Project"
Write-Host "[start-api-local] Ready to run .NET API with local JWT settings."

if ($NoRun) {
    Write-Host "[start-api-local] NoRun enabled, exiting before dotnet run."
    exit 0
}

dotnet run --project $Project
