$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

function Invoke-ReleaseBuild {
    Write-Host '==> Build Release'
    dotnet build -c Release

    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Build échoué, tentative de nettoyage des process dotnet...'
        Get-Process dotnet -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 800

        dotnet build -c Release

        if ($LASTEXITCODE -ne 0) {
            throw 'Build Release échoué après retry.'
        }
    }
}

function Invoke-FullSmoke {
    Write-Host '==> Smoke full local (register + phase 4->7)'
    powershell -ExecutionPolicy Bypass -File .\scripts\smoke-full-local.ps1

    if ($LASTEXITCODE -ne 0) {
        throw 'Smoke full local a échoué.'
    }
}

function Invoke-DemoPackage {
    Write-Host '==> Build package local-demo'
    powershell -ExecutionPolicy Bypass -File .\scripts\publish-local-demo.ps1

    if ($LASTEXITCODE -ne 0) {
        throw 'Packaging local-demo a échoué.'
    }
}

function New-DemoZip {
    $distDir = Join-Path $projectDir 'dist'
    $demoDir = Join-Path $distDir 'local-demo'

    if (-not (Test-Path $demoDir)) {
        throw 'Dossier dist/local-demo introuvable.'
    }

    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $zipPath = Join-Path $distDir "memolib-local-demo-$stamp.zip"
    $latestZipPath = Join-Path $distDir 'memolib-local-demo-latest.zip'
    $latestShaPath = Join-Path $distDir 'memolib-local-demo-latest.sha256.txt'

    if (Test-Path $zipPath) {
        Remove-Item -Force $zipPath
    }

    Write-Host "==> Création archive: $zipPath"
    Compress-Archive -Path (Join-Path $demoDir '*') -DestinationPath $zipPath -Force

    Write-Host "==> Mise à jour alias stable: $latestZipPath"
    Copy-Item -Path $zipPath -Destination $latestZipPath -Force

    $hash = (Get-FileHash -Path $latestZipPath -Algorithm SHA256).Hash
    $hashLine = "SHA256  memolib-local-demo-latest.zip  $hash"
    Set-Content -Path $latestShaPath -Value $hashLine -Encoding ASCII

    return [pscustomobject]@{
        TimestampedZip = $zipPath
        LatestZip = $latestZipPath
        LatestSha256 = $latestShaPath
    }
}

Invoke-ReleaseBuild
Invoke-FullSmoke
Invoke-DemoPackage
$zipResult = New-DemoZip

$result = [pscustomobject]@{
    Status = 'READY'
    Zip = $zipResult.TimestampedZip
    LatestZip = $zipResult.LatestZip
    LatestSha256 = $zipResult.LatestSha256
    DemoFolder = (Join-Path $projectDir 'dist\local-demo')
}

$result | ConvertTo-Json -Depth 3
