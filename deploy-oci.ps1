#!/usr/bin/env pwsh
# ============================================================
# MemoLib - Deploy sur OCI (Oracle Cloud)
# ============================================================
# Lance ce script depuis PowerShell :
#   .\deploy-oci.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$SSH_KEY = "c:\Users\moros\.ssh\memolib-oracle"
$SSH_USER = "opc"
$SSH_HOST = "89.168.55.130"
$SSH = "ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=15 ${SSH_USER}@${SSH_HOST}"

function Remote($cmd) {
    $result = Invoke-Expression "$SSH '$cmd'" 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host "  ERREUR: $result" -ForegroundColor Red; return $null }
    return $result
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MemoLib - Deploy OCI" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ── 1. Test connexion ─────────────────────────────────────────
Write-Host "[1/7] Test connexion SSH..." -ForegroundColor Yellow
$test = Remote "echo OK && uname -a"
if (-not $test -or $test -notmatch "OK") {
    Write-Host "ERREUR: Impossible de se connecter a $SSH_HOST" -ForegroundColor Red
    exit 1
}
Write-Host "  Connecte: $($test[1])" -ForegroundColor Green

# ── 2. Installer .NET 9 + PostgreSQL + Redis ──────────────────
Write-Host "`n[2/7] Installation des dependances..." -ForegroundColor Yellow

$installScript = @'
set -e

# Detecter OS
if [ -f /etc/oracle-linux-release ]; then
    OS="oracle"
elif [ -f /etc/redhat-release ]; then
    OS="rhel"
else
    OS="ubuntu"
fi
echo "OS: $OS"

# .NET 9
if ! command -v dotnet &>/dev/null || ! dotnet --list-runtimes 2>/dev/null | grep -q "9.0"; then
    echo ">>> Installation .NET 9..."
    if [ "$OS" = "oracle" ] || [ "$OS" = "rhel" ]; then
        sudo dnf install -y dotnet-sdk-9.0 2>/dev/null || {
            sudo rpm -Uvh https://packages.microsoft.com/config/rhel/8/packages-microsoft-prod.rpm 2>/dev/null
            sudo dnf install -y dotnet-sdk-9.0
        }
    else
        sudo apt-get update && sudo apt-get install -y dotnet-sdk-9.0
    fi
fi
dotnet --version
echo "OK .NET"

# PostgreSQL
if ! command -v psql &>/dev/null; then
    echo ">>> Installation PostgreSQL..."
    if [ "$OS" = "oracle" ] || [ "$OS" = "rhel" ]; then
        sudo dnf install -y postgresql-server postgresql
        sudo postgresql-setup --initdb 2>/dev/null || true
        sudo systemctl enable --now postgresql
    else
        sudo apt-get install -y postgresql postgresql-contrib
        sudo systemctl enable --now postgresql
    fi
fi
echo "OK PostgreSQL"

# Redis
if ! command -v redis-server &>/dev/null; then
    echo ">>> Installation Redis..."
    if [ "$OS" = "oracle" ] || [ "$OS" = "rhel" ]; then
        sudo dnf install -y redis
    else
        sudo apt-get install -y redis-server
    fi
    sudo systemctl enable --now redis
fi
echo "OK Redis"

echo "INSTALL_DONE"
'@

$result = Remote $installScript
$result | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
if ($result -notmatch "INSTALL_DONE") {
    Write-Host "  ERREUR installation" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependances: OK" -ForegroundColor Green

# ── 3. Configurer PostgreSQL ──────────────────────────────────
Write-Host "`n[3/7] Configuration PostgreSQL..." -ForegroundColor Yellow

$pgScript = @'
set -e
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='memolib'" | grep -q 1 || {
    sudo -u postgres psql -c "CREATE USER memolib WITH PASSWORD 'MemoLib2025Secure!';"
    echo "User cree"
}
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='memolibdb'" | grep -q 1 || {
    sudo -u postgres psql -c "CREATE DATABASE memolibdb OWNER memolib;"
    echo "DB creee"
}
# Autoriser connexion locale par password
sudo grep -q "memolib" /var/lib/pgsql/data/pg_hba.conf 2>/dev/null || \
sudo grep -q "memolib" /etc/postgresql/*/main/pg_hba.conf 2>/dev/null || {
    PG_HBA=$(sudo find /var/lib/pgsql /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
    if [ -n "$PG_HBA" ]; then
        echo "host memolibdb memolib 127.0.0.1/32 md5" | sudo tee -a "$PG_HBA" > /dev/null
        sudo systemctl reload postgresql
        echo "pg_hba mis a jour"
    fi
}
echo "PG_DONE"
'@

$result = Remote $pgScript
$result | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "  PostgreSQL: OK" -ForegroundColor Green

# ── 4. Build local + Upload ───────────────────────────────────
Write-Host "`n[4/7] Build & Upload..." -ForegroundColor Yellow

Write-Host "  Compilation Release..." -ForegroundColor Gray
dotnet publish -c Release -o ./publish --nologo -v quiet
if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR build" -ForegroundColor Red; exit 1 }

Write-Host "  Creation archive..." -ForegroundColor Gray
Remove-Item ./memolib-deploy.tar.gz -Force -ErrorAction SilentlyContinue
tar -czf memolib-deploy.tar.gz -C ./publish .

Write-Host "  Upload vers OCI (~30s)..." -ForegroundColor Gray
scp -i $SSH_KEY -o StrictHostKeyChecking=no ./memolib-deploy.tar.gz "${SSH_USER}@${SSH_HOST}:/tmp/memolib-deploy.tar.gz"
if ($LASTEXITCODE -ne 0) { Write-Host "ERREUR upload" -ForegroundColor Red; exit 1 }
Write-Host "  Upload: OK" -ForegroundColor Green

# ── 5. Deployer sur OCI ───────────────────────────────────────
Write-Host "`n[5/7] Deploiement sur le serveur..." -ForegroundColor Yellow

$deployScript = @'
set -e
APP_DIR=/opt/memolib
sudo mkdir -p $APP_DIR
sudo tar -xzf /tmp/memolib-deploy.tar.gz -C $APP_DIR
sudo chown -R opc:opc $APP_DIR
rm /tmp/memolib-deploy.tar.gz

# Fichier de config production
cat > $APP_DIR/appsettings.Production.json << 'EOF'
{
  "UsePostgreSQL": true,
  "ConnectionStrings": {
    "Default": "Host=127.0.0.1;Port=5432;Database=memolibdb;Username=memolib;Password=MemoLib2025Secure!"
  },
  "JwtSettings": {
    "SecretKey": "OCI_MemoLib_2025_SuperSecretKey_48chars_minimum!!",
    "Issuer": "MemoLib.Api",
    "Audience": "MemoLib.Client",
    "ExpirationMinutes": 1440
  },
  "Cors": {
    "AllowedOrigins": [
      "https://memolib.space",
      "https://www.memolib.space",
      "https://api.memolib.space"
    ]
  },
  "Kestrel": {
    "Endpoints": {
      "Http": { "Url": "http://0.0.0.0:5078" }
    }
  },
  "DisableHttpsRedirection": true,
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
EOF

echo "DEPLOY_DONE"
'@

$result = Remote $deployScript
$result | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "  Deploiement: OK" -ForegroundColor Green

# ── 6. Service systemd + Caddy ────────────────────────────────
Write-Host "`n[6/7] Configuration service + reverse proxy..." -ForegroundColor Yellow

$serviceScript = @'
set -e

# Service systemd MemoLib
sudo tee /etc/systemd/system/memolib.service > /dev/null << 'EOF'
[Unit]
Description=MemoLib API
After=network.target postgresql.service redis.service

[Service]
WorkingDirectory=/opt/memolib
ExecStart=/usr/bin/dotnet /opt/memolib/MemoLib.Api.dll
Restart=always
RestartSec=5
User=opc
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable memolib
sudo systemctl restart memolib
sleep 3
sudo systemctl status memolib --no-pager -l | tail -5
echo "SERVICE_OK"

# Caddy (reverse proxy + SSL auto)
if ! command -v caddy &>/dev/null; then
    echo ">>> Installation Caddy..."
    if [ -f /etc/oracle-linux-release ] || [ -f /etc/redhat-release ]; then
        sudo dnf install -y 'dnf-command(copr)' 2>/dev/null
        sudo dnf copr enable -y @caddy/caddy 2>/dev/null
        sudo dnf install -y caddy 2>/dev/null || {
            curl -sL "https://caddyserver.com/api/download?os=linux&arch=amd64" | sudo tee /usr/bin/caddy > /dev/null
            sudo chmod +x /usr/bin/caddy
        }
    else
        sudo apt-get install -y caddy
    fi
fi

# Config Caddy
sudo tee /etc/caddy/Caddyfile > /dev/null << 'EOF'
api.memolib.space {
    reverse_proxy localhost:5078
}
EOF

sudo systemctl enable caddy
sudo systemctl restart caddy
echo "CADDY_OK"
'@

$result = Remote $serviceScript
$result | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "  Service + Caddy: OK" -ForegroundColor Green

# ── 7. Firewall ───────────────────────────────────────────────
Write-Host "`n[7/7] Firewall..." -ForegroundColor Yellow

$fwScript = @'
# Ouvrir ports 80/443 si firewalld actif
if command -v firewall-cmd &>/dev/null; then
    sudo firewall-cmd --permanent --add-service=http 2>/dev/null
    sudo firewall-cmd --permanent --add-service=https 2>/dev/null
    sudo firewall-cmd --reload 2>/dev/null
    echo "firewalld OK"
fi
# Ouvrir iptables aussi
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null
echo "FW_DONE"
'@

$result = Remote $fwScript
$result | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "  Firewall: OK" -ForegroundColor Green

# ── Nettoyage local ──────────────────────────────────────────
Remove-Item './publish' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item './memolib-deploy.tar.gz' -Force -ErrorAction SilentlyContinue

# ── Resume ────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOIEMENT TERMINE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  API:     https://api.memolib.space" -ForegroundColor Green
Write-Host "  Demo:    https://api.memolib.space/demo.html" -ForegroundColor Green
Write-Host "  Swagger: https://api.memolib.space/swagger" -ForegroundColor Green
Write-Host "  Health:  https://api.memolib.space/health" -ForegroundColor Green
Write-Host ""
Write-Host "  ── DNS A CONFIGURER (Vercel Dashboard) ──" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Supprimer: A @ 89.168.55.130" -ForegroundColor Red
Write-Host "  Ajouter:   A @ 76.76.21.21 (Vercel)" -ForegroundColor Green
Write-Host "  Ajouter:   CNAME api -> 89.168.55.130" -ForegroundColor Green
Write-Host ""
Write-Host "  ── SUPPRIMER AZURE (optionnel) ──" -ForegroundColor Yellow
Write-Host "  az group delete --name memolib-rg --yes" -ForegroundColor Gray
Write-Host ""
Write-Host "  Cout: 0 EUR/mois" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
