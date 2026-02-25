#!/bin/bash
# Cricket Analytics — Start both backend and frontend
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$SCRIPT_DIR/Data/venv/bin"

echo "🏏 Cricket Analytics Engine"
echo "=============================="

# Start backend
echo "Starting backend (port 8000)…"
cd "$SCRIPT_DIR/backend"
"$VENV/python" -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to load models…"
until curl -sf http://localhost:8000/health > /dev/null 2>&1; do
  sleep 2
done
echo "Backend ready ✓"

# Start frontend
echo "Starting frontend (port 5173)…"
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=============================="
echo "✓ Backend:  http://localhost:8000"
echo "✓ Frontend: http://localhost:5173"
echo "=============================="
echo ""
echo "Default login: admin / admin123"
echo ""
echo "Press Ctrl+C to stop both servers"

# Cleanup on exit
cleanup() {
  echo ""
  echo "Shutting down…"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

wait
