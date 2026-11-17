# Usage: powershell -NoProfile -File .\scripts\check-local-environment.ps1
# Read-only checks; this script does not start Docker or connect to a database.

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$failures = 0

function Write-Check {
    param([string]$Status, [string]$Message)
    Write-Host "[$Status] $Message"
}

Write-Check 'INFO' 'Checking local development environment'

if (Test-Path -LiteralPath (Join-Path $projectRoot 'package.json') -PathType Leaf) {
    Write-Check 'PASS' 'Project package.json found'
} else {
    Write-Check 'FAIL' 'Project package.json not found'
    $failures++
}

if (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules') -PathType Container) {
    Write-Check 'PASS' 'node_modules directory found'
} else {
    Write-Check 'WARN' 'node_modules directory not found; dependencies are not verified'
}

try {
    $driveName = (Get-Item -LiteralPath $projectRoot).PSDrive.Name
    $drive = Get-PSDrive -Name $driveName -PSProvider FileSystem
    $freeGB = [math]::Round($drive.Free / 1GB, 2)
    if ($freeGB -lt 10) {
        Write-Check 'WARN' "Free space on ${driveName}: ${freeGB} GB; Docker may need more space"
    } else {
        Write-Check 'PASS' "Free space on ${driveName}: ${freeGB} GB"
    }
} catch {
    Write-Check 'WARN' 'Could not determine free disk space'
}

if (Get-Command node -ErrorAction SilentlyContinue) {
    try {
        $nodeVersion = & node --version
        if ($LASTEXITCODE -ne 0) { throw 'Node version command failed' }
        Write-Check 'PASS' "Node.js: $nodeVersion"
        $expectedNodePath = Join-Path $projectRoot '.node-version'
        if (Test-Path -LiteralPath $expectedNodePath -PathType Leaf) {
            $expectedNode = (Get-Content -LiteralPath $expectedNodePath -Raw).Trim()
            Write-Check 'INFO' "Project .node-version: $expectedNode"
            if ($nodeVersion.TrimStart('v') -ne $expectedNode.TrimStart('v')) {
                Write-Check 'WARN' 'Node.js version differs from the project version'
            }
        }
    } catch {
        Write-Check 'FAIL' 'Unable to read Node.js version'
        $failures++
    }
} else {
    Write-Check 'FAIL' 'Node.js not found'
    $failures++
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    try {
        $npmVersion = & npm --version
        if ($LASTEXITCODE -ne 0) { throw 'npm version command failed' }
        Write-Check 'PASS' "npm: $npmVersion"
    } catch {
        Write-Check 'FAIL' 'Unable to read npm version'
        $failures++
    }
} else {
    Write-Check 'FAIL' 'npm not found'
    $failures++
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Check 'PASS' 'Docker CLI found'
    $job = $null
    try {
        $job = Start-Job -ScriptBlock {
            $ErrorActionPreference = 'Continue'
            $output = & docker info --format '{{.ServerVersion}}' 2>&1
            [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = @($output | ForEach-Object { "$_" }) }
        }
        $finished = Wait-Job -Job $job -Timeout 20
        if (-not $finished) {
            Stop-Job -Job $job
            Write-Check 'FAIL' 'Docker engine did not respond within 20 seconds'
            $failures++
        } elseif ($job.State -ne 'Completed') {
            Write-Check 'FAIL' 'Docker engine check could not run'
            $failures++
        } else {
            $result = Receive-Job -Job $job
            if ($result.ExitCode -eq 0 -and $result.Output.Count -gt 0) {
                Write-Check 'PASS' "Docker engine: $($result.Output[0])"
            } else {
                Write-Check 'FAIL' 'Docker engine is unavailable; check Docker Desktop'
                $failures++
            }
        }
    } catch {
        Write-Check 'FAIL' 'Docker engine check could not be completed'
        $failures++
    } finally {
        if ($job) { Remove-Job -Job $job -Force }
    }
} else {
    Write-Check 'FAIL' 'Docker CLI not found'
    $failures++
}

Write-Check 'INFO' 'Database connectivity, application behavior, and production readiness were not tested'
if ($failures -gt 0) {
    Write-Check 'FAIL' "$failures required check(s) failed"
    exit 1
}
Write-Check 'PASS' 'Required environment checks passed'
exit 0
