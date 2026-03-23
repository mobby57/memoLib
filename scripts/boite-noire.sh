#!/usr/bin/env bash
set -u

BASE_URL="${1:-http://localhost:8080}"
CONTAINER_NAME="${2:-memolib}"
OUT_DIR="${3:-./artifacts/boite-noire}"
LOG_LINES="${4:-300}"

TS="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="${OUT_DIR}/run-${TS}"
mkdir -p "${RUN_DIR}"

section() {
  printf '\n===== %s =====\n\n' "$1"
}

safe_cmd() {
  local title="$1"
  local file="$2"
  shift 2
  {
    section "${title}"
    "$@"
  } > "${RUN_DIR}/${file}" 2>&1 || true
}

safe_cmd "System info" "01-system.txt" bash -lc '
  echo "Host: $(hostname)"
  echo "User: $(whoami)"
  echo "Timestamp: $(date -Is)"
  echo "PWD: $(pwd)"
  command -v git >/dev/null && git --version || echo "git not found"
  command -v docker >/dev/null && docker --version || echo "docker not found"
'

safe_cmd "Git status" "02-git-status.txt" bash -lc '
  if command -v git >/dev/null; then
    git status --short || true
    git branch --show-current || true
    git log --oneline -n 10 || true
  else
    echo "git not found"
  fi
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
  if command -v docker >/dev/null; then
    docker ps -a
  else
    echo "docker not found"
  fi
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

safe_cmd "Disk and memory" "07-host-resources.txt" bash -lc '
  df -h || true
  free -h || true
  uptime || true
'

cat > "${RUN_DIR}/00-summary.json" <<EOF
{
  "timestamp": "$(date -Is)",
  "baseUrl": "${BASE_URL}",
  "containerName": "${CONTAINER_NAME}",
  "runDirectory": "${RUN_DIR}"
}
EOF

ARCHIVE="${OUT_DIR}/boite-noire-${TS}.tar.gz"
mkdir -p "${OUT_DIR}"
tar -czf "${ARCHIVE}" -C "${RUN_DIR}" .

echo "Boite noire generee: ${ARCHIVE}"
