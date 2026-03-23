param(
    [string]$ServerHost = "89.168.55.130",
    [string]$User = "opc",
    [string]$SshKeyPath = "C:\Users\moros\.oci\memolib_ssh_key",
    [string]$RemoteProjectDir = "/home/opc/MemoLib.Api",
    [string]$RemoteBaseUrl = "http://localhost:8080",
  [string]$PublicHttpsUrl = "https://memolib.space",
    [string]$ContainerName = "memolib",
    [string]$LocalOutputDir = "./artifacts/boite-noire-remote",
  [int]$DockerLogLines = 300,
  [switch]$Full
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SshKeyPath)) {
    throw "Cle SSH introuvable: $SshKeyPath"
}

New-Item -ItemType Directory -Path $LocalOutputDir -Force | Out-Null

$sshTarget = "$User@$ServerHost"
$sshOptions = @(
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "BatchMode=yes",
  "-o", "ConnectTimeout=20",
  "-o", "ServerAliveInterval=10",
  "-o", "ServerAliveCountMax=2",
    "-i", $SshKeyPath
)

$remoteScriptContent = @'
set -euo pipefail

PROJECT_DIR="__REMOTE_PROJECT_DIR__"
BASE_URL="__REMOTE_BASE_URL__"
PUBLIC_HTTPS_URL="__PUBLIC_HTTPS_URL__"
CONTAINER_NAME="__CONTAINER_NAME__"
LOG_LINES="__DOCKER_LOG_LINES__"
FULL_MODE="__FULL_MODE__"

cd "$PROJECT_DIR"

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${PROJECT_DIR}/artifacts/boite-noire"
RUN_DIR="${OUT_DIR}/run-${TS}"
ARCHIVE="${OUT_DIR}/boite-noire-${TS}.tar.gz"

mkdir -p "$RUN_DIR"

section() {
  printf '\n===== %s =====\n\n' "$1"
}

safe_cmd() {
  local title="$1"
  local file="$2"
  shift 2
  {
    section "$title"
    "$@"
  } > "${RUN_DIR}/${file}" 2>&1 || true
}

safe_cmd "System info" "01-system.txt" bash -lc '
  echo "Host: $(hostname)"
  echo "User: $(whoami)"
  echo "Timestamp: $(date -Is)"
  echo "PWD: $(pwd)"
  command -v docker >/dev/null && docker --version || echo "docker not found"
'

safe_cmd "Git status" "02-git-status.txt" bash -lc '
  command -v git >/dev/null && git status --short || echo "git not found"
  command -v git >/dev/null && git branch --show-current || true
  command -v git >/dev/null && git log --oneline -n 10 || true
'

{
  section "Health checks"
  for p in /health /api/health /swagger; do
    url="${BASE_URL}${p}"
    code="$(curl -s -o /tmp/boite_noire_body.$$ -w "%{http_code}" "$url" || echo "ERR")"
    echo "[${url}] HTTP ${code}"
  done
} > "${RUN_DIR}/03-health.txt" 2>&1

safe_cmd "Docker ps" "04-docker-ps.txt" bash -lc '
  command -v docker >/dev/null && docker ps -a || echo "docker not found"
'

safe_cmd "Docker logs" "05-docker-logs.txt" bash -lc "
  if command -v docker >/dev/null; then
    docker logs ${CONTAINER_NAME} --tail ${LOG_LINES}
  else
    echo docker not found
  fi
"

safe_cmd "Docker inspect" "06-docker-inspect.txt" bash -lc "
  if command -v docker >/dev/null; then
    docker inspect ${CONTAINER_NAME}
  else
    echo docker not found
  fi
"

safe_cmd "Host resources" "07-host-resources.txt" bash -lc '
  df -h || true
  free -h || true
  uptime || true
'

safe_cmd "Nginx status" "08-nginx-status.txt" bash -lc '
  command -v nginx >/dev/null && nginx -v 2>&1 || echo "nginx not found"
  sudo -n systemctl status nginx --no-pager || true
  sudo -n nginx -t || true
'

safe_cmd "Nginx conf memolib" "09-nginx-memolib-conf.txt" bash -lc '
  if [ -f /etc/nginx/conf.d/memolib.conf ]; then
    sudo -n cat /etc/nginx/conf.d/memolib.conf
  else
    echo "/etc/nginx/conf.d/memolib.conf not found"
  fi
'

safe_cmd "TLS certificate" "10-tls-cert.txt" bash -lc '
  if [ -f /etc/letsencrypt/live/memolib.space/fullchain.pem ]; then
    openssl x509 -in /etc/letsencrypt/live/memolib.space/fullchain.pem -noout -subject -issuer -dates
  else
    echo "Lets Encrypt certificate file not found"
  fi
  if command -v certbot >/dev/null; then
    sudo -n certbot certificates || true
  elif [ -x /usr/local/bin/certbot ]; then
    sudo -n /usr/local/bin/certbot certificates || true
  else
    echo "certbot not found"
  fi
'

safe_cmd "Network ports" "11-network-ports.txt" bash -lc '
  ss -tulpn | egrep ":80 |:443 |:8080 " || true
'

safe_cmd "Firewall" "12-firewall.txt" bash -lc '
  command -v firewall-cmd >/dev/null && sudo -n firewall-cmd --list-all || echo "firewall-cmd not found"
'

if [ "$FULL_MODE" = "1" ]; then
  safe_cmd "Nginx journal" "13-nginx-journal.txt" bash -lc '
    sudo -n journalctl -u nginx -n 200 --no-pager || true
  '

  safe_cmd "Nginx logs" "14-nginx-logs.txt" bash -lc '
    [ -f /var/log/nginx/access.log ] && sudo -n tail -n 200 /var/log/nginx/access.log || echo "access.log not found"
    echo
    [ -f /var/log/nginx/error.log ] && sudo -n tail -n 200 /var/log/nginx/error.log || echo "error.log not found"
  '

  safe_cmd "Public HTTPS checks" "15-public-https.txt" bash -lc '
    curl -I -k -L --max-time 20 "'"'${PUBLIC_HTTPS_URL}'"'" || true
  '

  safe_cmd "Public TLS handshake" "16-public-tls-handshake.txt" bash -lc '
    host=$(echo "'"'${PUBLIC_HTTPS_URL}'"'" | sed -E "s#https?://([^/]+)/?.*#\\1#")
    echo | openssl s_client -connect "${host}:443" -servername "${host}" 2>/dev/null | openssl x509 -noout -subject -issuer -dates || true
  '

  safe_cmd "DNS resolution" "17-dns-resolution.txt" bash -lc '
    host=$(echo "'"'${PUBLIC_HTTPS_URL}'"'" | sed -E "s#https?://([^/]+)/?.*#\\1#")
    getent hosts "${host}" || true
    command -v nslookup >/dev/null && nslookup "${host}" || true
  '
fi

cat > "${RUN_DIR}/00-summary.json" <<EOF
{
  "timestamp": "$(date -Is)",
  "baseUrl": "${BASE_URL}",
  "publicHttpsUrl": "${PUBLIC_HTTPS_URL}",
  "containerName": "${CONTAINER_NAME}",
  "fullMode": ${FULL_MODE},
  "runDirectory": "${RUN_DIR}"
}
EOF

tar -czf "$ARCHIVE" -C "$RUN_DIR" .
echo "$ARCHIVE"
'@

$remoteScriptContent = $remoteScriptContent.Replace("__REMOTE_PROJECT_DIR__", $RemoteProjectDir)
$remoteScriptContent = $remoteScriptContent.Replace("__REMOTE_BASE_URL__", $RemoteBaseUrl)
$remoteScriptContent = $remoteScriptContent.Replace("__PUBLIC_HTTPS_URL__", $PublicHttpsUrl)
$remoteScriptContent = $remoteScriptContent.Replace("__CONTAINER_NAME__", $ContainerName)
$remoteScriptContent = $remoteScriptContent.Replace("__DOCKER_LOG_LINES__", $DockerLogLines.ToString())
$remoteScriptContent = $remoteScriptContent.Replace("__FULL_MODE__", $(if ($Full) { "1" } else { "0" }))
$remoteScriptContent = $remoteScriptContent -replace "`r", ""

$localTempScript = Join-Path $env:TEMP "boite-noire-remote.sh"
$remoteTempScript = "/tmp/boite-noire-remote.sh"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($localTempScript, $remoteScriptContent, $utf8NoBom)

Write-Host "Transfert du script de collecte..." -ForegroundColor Cyan
& scp -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -i $SshKeyPath $localTempScript "${sshTarget}:${remoteTempScript}" | Out-Null

if ($LASTEXITCODE -ne 0) {
  throw "Echec du transfert SCP vers ${sshTarget}:${remoteTempScript}"
}

Write-Host "Execution de la boite noire distante..." -ForegroundColor Cyan
$remoteArchive = & ssh @sshOptions $sshTarget "tr -d '\r' < ${remoteTempScript} | sed '1s/^\xEF\xBB\xBF//' > ${remoteTempScript}.unix && chmod +x ${remoteTempScript}.unix && bash ${remoteTempScript}.unix"

if ([string]::IsNullOrWhiteSpace($remoteArchive)) {
    throw "Archive distante non retournee"
}

$remoteArchive = ($remoteArchive -split "`r?`n" | Where-Object { $_ -and $_.Trim().Length -gt 0 } | Select-Object -Last 1).Trim()

if (-not ($remoteArchive.StartsWith("/"))) {
  throw "Chemin archive distant invalide: $remoteArchive"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$localArchive = Join-Path $LocalOutputDir "boite-noire-remote-$timestamp.tar.gz"

Write-Host "Rapatriement de l'archive..." -ForegroundColor Cyan
& scp -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -i $SshKeyPath "${sshTarget}:${remoteArchive}" $localArchive | Out-Null

if ($LASTEXITCODE -ne 0) {
  throw "Echec du rapatriement SCP depuis ${sshTarget}:${remoteArchive}"
}

Write-Host "Boite noire distante generee:" -ForegroundColor Green
Write-Host $localArchive -ForegroundColor Green

Remove-Item -ErrorAction SilentlyContinue $localTempScript
