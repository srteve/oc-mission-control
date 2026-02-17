#!/usr/bin/env bash
# Mission Control startup script
# Starts Next.js dev server + Cloudflare tunnel

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
mkdir -p "$DATA_DIR"

echo "🚀 Starting Mission Control..."

# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start Next.js in background
cd "$SCRIPT_DIR"
npm run dev &
NEXT_PID=$!
echo "⚡ Next.js started (pid $NEXT_PID)"

# Wait for Next.js to be ready
echo "⏳ Waiting for Next.js..."
for i in $(seq 1 30); do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js ready"
    break
  fi
  sleep 1
done

# Start cloudflared tunnel and capture URL
echo "🌍 Starting Cloudflare tunnel..."
TUNNEL_LOG=$(mktemp)
cloudflared tunnel --url http://localhost:3000 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wait for URL to appear in log
for i in $(seq 1 20); do
  URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
  if [ -n "$URL" ]; then
    echo "🌐 Public URL: $URL"
    echo "{\"url\":\"$URL\",\"startedAt\":$(date +%s000)}" > "$DATA_DIR/tunnel.json"
    break
  fi
  sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Mission Control running!"
echo "  Local:  http://localhost:3000"
echo "  Public: $URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Keep running (trap for clean exit)
trap "kill $NEXT_PID $TUNNEL_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait
