#!/usr/bin/env bash
# Infra only + run backend locally (hot reload). Seeds on first empty DB.
# Usage: ./scripts/dev-up.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Starting infrastructure (MongoDB, Redis)..."
docker compose up -d

echo "Waiting for MongoDB..."
TRIES=0
until docker exec sole-mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" >/dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [[ $TRIES -ge 30 ]]; then
    echo "MongoDB not ready — check: docker compose logs mongodb"
    exit 1
  fi
  sleep 2
done

echo ""
echo "Infrastructure ready."
echo "Start backend (auto-seed if DB empty): cd be && ./gradlew bootRun"
echo "Start frontend: cd fe && npm run dev"
