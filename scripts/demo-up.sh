#!/usr/bin/env bash
# One-command demo stack: infra + backend (auto-seed) + frontend.
# Usage: ./scripts/demo-up.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Starting SOLE demo stack (MongoDB, Redis, ES, Backend, Frontend)..."
docker compose --profile demo up -d --build

echo ""
echo "Waiting for backend health (first boot may take 2–3 min while Gradle + seed run)..."
TRIES=0
until curl -sf "http://localhost:${BACKEND_PORT:-3001}/api/actuator/health" >/dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [[ $TRIES -ge 60 ]]; then
    echo "Backend not ready yet — check: docker compose logs -f backend"
    exit 1
  fi
  sleep 5
done

echo ""
echo "============================================================"
echo "SOLE demo is ready"
echo "  Frontend : http://localhost:${FRONTEND_PORT:-3000}"
echo "  API      : http://localhost:${BACKEND_PORT:-3001}/api"
echo "  Swagger  : http://localhost:${BACKEND_PORT:-3001}/api/swagger-ui.html"
echo "  Login    : customer@sole.test / Sole@123"
echo "  Admin    : admin@sole.test / Sole@123"
echo "============================================================"
echo "Logs: docker compose --profile demo logs -f backend"
