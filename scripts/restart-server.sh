#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4173}"
PROVIDER="${MAGAZINE_AI_PROVIDER:-codex-app-server}"
LOG_FILE="$ROOT_DIR/.server.log"

cd "$ROOT_DIR"

echo "Stopping MyMagazine server on port $PORT..."
if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti "tcp:$PORT" || true)"
  if [[ -n "$PIDS" ]]; then
    kill $PIDS || true
  fi
fi

pkill -f "$ROOT_DIR/server.js" 2>/dev/null || true

sleep 1

echo "Starting MyMagazine server..."
PORT="$PORT" MAGAZINE_AI_PROVIDER="$PROVIDER" nohup node server.js > "$LOG_FILE" 2>&1 &
SERVER_PID="$!"

for _ in {1..30}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Server failed to start. Log:"
    tail -80 "$LOG_FILE" || true
    exit 1
  fi

  if curl -fsS "http://localhost:$PORT/api/status" >/dev/null 2>&1; then
    break
  fi

  sleep 0.5
done

if ! curl -fsS "http://localhost:$PORT/api/status" >/dev/null 2>&1; then
  echo "Server did not become ready. Log:"
  tail -80 "$LOG_FILE" || true
  exit 1
fi

echo "Started PID $SERVER_PID"
echo "URL: http://localhost:$PORT"
echo "Provider: $PROVIDER"
echo "Log: $LOG_FILE"
