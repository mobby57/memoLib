# IAPosteManager Windows Deployment Script
# Run this in PowerShell as Administrator

Write-Host "🚀 IAPosteManager Windows Deploy" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Please run PowerShell as Administrator" -ForegroundColor Red
    exit 1
}

# Install Docker Desktop if not installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "🐳 Installing Docker Desktop..." -ForegroundColor Yellow
    Write-Host "Please download and install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    Write-Host "Then restart this script."
    exit 1
}

# Create directory
$deployPath = "C:\iapostemanager"
if (!(Test-Path $deployPath)) {
    New-Item -ItemType Directory -Path $deployPath -Force
}
Set-Location $deployPath

# Clone or update repository
if (!(Test-Path ".git")) {
    Write-Host "📥 Cloning repository..." -ForegroundColor Yellow
    git clone https://github.com/mobby57/iapm.com.git .
} else {
    Write-Host "🔄 Updating code..." -ForegroundColor Yellow
    git pull origin main
}

# Deploy with Docker
Write-Host "🚀 Deploying application..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for startup
Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Health check
Write-Host "✅ Health check..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "🎉 Deployment successful!" -ForegroundColor Green
        Write-Host "🌐 Application available at: http://localhost:5000" -ForegroundColor Cyan
        Write-Host "📊 Health check: http://localhost:5000/api/health" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    Write-Host "Checking logs..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml logs
}