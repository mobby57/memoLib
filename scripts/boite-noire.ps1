param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$ContainerName = "memolib",
    [string]$OutputDir = "./artifacts/boite-noire",
    [int]$DockerLogLines = 300
)

$ErrorActionPreference = "Continue"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runDir = Join-Path $OutputDir "run-$timestamp"
New-Item -ItemType Directory -Path $runDir -Force | Out-Null

function Write-Section {
    param([string]$Title)
    "`n===== $Title =====`n"
}

function Save-CommandOutput {
    param(
        [string]$Title,
        [scriptblock]$Command,
        [string]$FileName
    )

    $target = Join-Path $runDir $FileName
    try {
        $content = & $Command 2>&1 | Out-String
        (Write-Section -Title $Title) + $content | Out-File -FilePath $target -Encoding utf8
    }
    catch {
        (Write-Section -Title $Title) + "ERROR: $($_.Exception.Message)" | Out-File -FilePath $target -Encoding utf8
    }
}

# 1) Runtime snapshot
Save-CommandOutput -Title "System info" -FileName "01-system.txt" -Command {
    Write-Output "Host: $env:COMPUTERNAME"
    Write-Output "User: $env:USERNAME"
    Write-Output "Timestamp: $(Get-Date -Format o)"
    Write-Output "PWD: $(Get-Location)"
    Write-Output "PowerShell: $($PSVersionTable.PSVersion)"
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Output "Git: $(git --version)"
    }
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Output "Docker: $(docker --version)"
    }
}

# 2) Git snapshot
Save-CommandOutput -Title "Git status" -FileName "02-git-status.txt" -Command {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        git status --short
        git branch --show-current
        git log --oneline -n 10
    } else {
        Write-Output "git not found"
    }
}

# 3) Health checks
$healthTarget = Join-Path $runDir "03-health.txt"
@(
    "/health",
    "/api/health",
    "/swagger"
) | ForEach-Object {
    $url = "$BaseUrl$_"
    try {
        $res = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing
        "[$url] HTTP $($res.StatusCode)" | Out-File -FilePath $healthTarget -Append -Encoding utf8
    }
    catch {
        "[$url] ERROR $($_.Exception.Message)" | Out-File -FilePath $healthTarget -Append -Encoding utf8
    }
}

# 4) Docker snapshot
Save-CommandOutput -Title "Docker ps" -FileName "04-docker-ps.txt" -Command {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker ps -a
    } else {
        Write-Output "docker not found"
    }
}

Save-CommandOutput -Title "Docker logs" -FileName "05-docker-logs.txt" -Command {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker logs $ContainerName --tail $DockerLogLines
    } else {
        Write-Output "docker not found"
    }
}

Save-CommandOutput -Title "Docker inspect" -FileName "06-docker-inspect.txt" -Command {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker inspect $ContainerName
    } else {
        Write-Output "docker not found"
    }
}

# 5) Appsettings quick check (without secrets)
Save-CommandOutput -Title "Appsettings flags" -FileName "07-appsettings-flags.txt" -Command {
    $candidates = @(
        "./appsettings.Production.json",
        "./appsettings.json",
        "./src/backend/appsettings.Production.json"
    )

    foreach ($file in $candidates) {
        if (Test-Path $file) {
            Write-Output "File: $file"
            $content = Get-Content $file -Raw
            if ($content -match '"UsePostgreSQL"\s*:\s*(true|false)') { Write-Output "UsePostgreSQL: $($Matches[1])" }
            if ($content -match '"DisableHttpsRedirection"\s*:\s*(true|false)') { Write-Output "DisableHttpsRedirection: $($Matches[1])" }
            if ($content -match '"Url"\s*:\s*"([^"]+)"') { Write-Output "Kestrel Url: $($Matches[1])" }
            Write-Output ""
        }
    }
}

# 6) Summary json
$summary = @{
    timestamp = (Get-Date -Format o)
    baseUrl = $BaseUrl
    containerName = $ContainerName
    outputDirectory = (Resolve-Path $runDir).Path
}
$summary | ConvertTo-Json | Out-File -FilePath (Join-Path $runDir "00-summary.json") -Encoding utf8

# 7) Zip package
$zipPath = Join-Path $OutputDir "boite-noire-$timestamp.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $runDir "*") -DestinationPath $zipPath

Write-Host "Boite noire generee:" -ForegroundColor Green
Write-Host $zipPath -ForegroundColor Green
