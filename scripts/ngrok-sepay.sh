#!/usr/bin/env bash
# Expose local backend for SePay IPN webhook (HTTPS tunnel → localhost).
#
# Usage:
#   ./scripts/ngrok-sepay.sh          # start ngrok (foreground)
#   ./scripts/ngrok-sepay.sh --url    # print IPN URL if ngrok is already running
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${BACKEND_PORT:-3001}"
if [[ -f .env ]]; then
  # Do not `source .env` — values like `SOLE <email>` break bash parsing.
  ENV_PORT="$(grep -E '^BACKEND_PORT=' .env | tail -1 | cut -d= -f2- | tr -d '\r' | xargs || true)"
  if [[ -n "$ENV_PORT" ]]; then
    PORT="$ENV_PORT"
  fi
fi

CALLBACK_PATH="/api/payments/sepay/callback"

print_ipn_url() {
  local base="${1%/}"
  echo ""
  echo "============================================================"
  echo "SePay IPN webhook URL (copy vào SePay Dashboard):"
  echo "  ${base}${CALLBACK_PATH}"
  echo ""
  echo "SePay Dashboard → Payment Gateway → Configuration → IPN"
  echo ""
  echo "Cập nhật .env (tham chiếu):"
  echo "  SEPAY_IPN_URL=${base}${CALLBACK_PATH}"
  echo ""
  echo "Test nhanh:"
  echo "  curl ${base}${CALLBACK_PATH}"
  echo "  # Dashboard ngrok: http://127.0.0.1:4040"
  echo "============================================================"
}

fetch_ngrok_url() {
  curl -sf http://127.0.0.1:4040/api/tunnels 2>/dev/null \
    | python3 -c "
import sys, json
data = json.load(sys.stdin)
for t in data.get('tunnels', []):
    url = t.get('public_url', '')
    if url.startswith('https://'):
        print(url.rstrip('/'))
        break
" 2>/dev/null || true
}

if [[ "${1:-}" == "--url" ]]; then
  URL="$(fetch_ngrok_url)"
  if [[ -z "$URL" ]]; then
    echo "Ngrok chưa chạy. Khởi động: ./scripts/ngrok-sepay.sh"
    exit 1
  fi
  print_ipn_url "$URL"
  exit 0
fi

if ! command -v ngrok >/dev/null 2>&1; then
  echo "Chưa cài ngrok:"
  echo "  brew install ngrok"
  echo "  ngrok config add-authtoken <token>   # lấy tại https://dashboard.ngrok.com"
  exit 1
fi

if ! curl -sf "http://localhost:${PORT}/api/actuator/health" >/dev/null 2>&1; then
  echo "Backend chưa chạy trên port ${PORT}."
  echo "  cd be && ./gradlew bootRun"
  echo "  hoặc: ./scripts/demo-up.sh"
  exit 1
fi

echo "Tunnel ngrok → localhost:${PORT}"
echo "Sau khi ngrok lên, mở terminal khác: ./scripts/ngrok-sepay.sh --url"
echo ""

exec ngrok http "$PORT"
