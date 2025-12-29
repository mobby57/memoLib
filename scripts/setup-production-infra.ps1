# Setup Infrastructure Production
# Usage: .\scripts\setup-production-infra.ps1

Write-Host "🏗️  Configuration Infrastructure Production..." -ForegroundColor Cyan

# Créer structure dossiers
$dirs = @(
    "docker/production",
    "monitoring/prometheus",
    "monitoring/grafana",
    "logs/production",
    "backups/automated"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✅ Créé: $dir" -ForegroundColor Green
    }
}

# Créer docker-compose.prod.yml
$dockerCompose = @"
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/iaposte
      - REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT=production
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - iaposte-network

  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:8000
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - iaposte-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=iaposte
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups/automated:/backups
    restart: unless-stopped
    networks:
      - iaposte-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - iaposte-network

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    restart: unless-stopped
    networks:
      - iaposte-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    restart: unless-stopped
    networks:
      - iaposte-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  iaposte-network:
    driver: bridge
"@

Set-Content -Path "docker-compose.prod.yml" -Value $dockerCompose
Write-Host "  ✅ docker-compose.prod.yml créé" -ForegroundColor Green

# Créer Dockerfile.prod
$dockerfile = @"
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY src/backend ./src/backend
COPY src/services ./src/services

# Expose port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "src.backend.main_fastapi:app", "--host", "0.0.0.0", "--port", "8000"]
"@

Set-Content -Path "Dockerfile.prod" -Value $dockerfile
Write-Host "  ✅ Dockerfile.prod créé" -ForegroundColor Green

# Créer prometheus.yml
$prometheusConfig = @"
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'iaposte-backend'
    static_configs:
      - targets: ['backend:8000']
  
  - job_name: 'iaposte-frontend'
    static_configs:
      - targets: ['frontend:3000']
"@

$prometheusDir = "monitoring/prometheus"
if (-not (Test-Path $prometheusDir)) {
    New-Item -ItemType Directory -Path $prometheusDir -Force | Out-Null
}
Set-Content -Path "$prometheusDir/prometheus.yml" -Value $prometheusConfig
Write-Host "  ✅ prometheus.yml créé" -ForegroundColor Green

Write-Host "`n✨ Infrastructure Production configurée!" -ForegroundColor Green
Write-Host "`n💡 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor White
Write-Host "  2. Vérifier services: http://localhost:9090 (Prometheus)" -ForegroundColor White
Write-Host "  3. Vérifier dashboard: http://localhost:3001 (Grafana)" -ForegroundColor White

