#!/usr/bin/env bash
# One command, one instance: Pulse on a fixed port with a tunnel in front.
#
# The port is pinned to 3100 deliberately. .claude/launch.json used autoPort,
# which handed each launch whatever port was free — that is how four servers
# ended up on 3000, 3002, 3005 and 3100 at once, two of them broken and one of
# them the thing being previewed.
#
# The tunnel URL is NOT stable: a quick tunnel gets a random trycloudflare.com
# hostname that dies with this process. For a URL that survives a restart you
# need a named tunnel — see the note at the bottom.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=3100

command -v cloudflared >/dev/null || { echo "cloudflared is not installed." >&2; exit 1; }

# Refuse to add a second instance rather than silently starting one.
EXISTING=$(ss -ltnp 2>/dev/null | grep ":$PORT " | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2 || true)
if [ -n "${EXISTING:-}" ]; then
  echo "Port $PORT is already serving (pid $EXISTING)."
  echo "Stop it first, or reuse it:  bash scripts/preview.sh tunnel-only"
  [ "${1:-}" = "tunnel-only" ] || exit 1
else
  echo "Building…"
  npm run build
  echo "Starting on :$PORT…"
  npm run start >/tmp/pulse-server.log 2>&1 &
  SERVER=$!
  trap 'kill $SERVER 2>/dev/null || true' EXIT
  for _ in $(seq 1 40); do sleep 1; curl -sf -o /dev/null "http://localhost:$PORT/" && break; done
fi

# A dev server answers 500 on every route right now (webpack cannot resolve
# string_decoder for the edge runtime), so check before publishing a URL that
# would only ever show an error page.
CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/api/pulse/bootstrap")
[ "$CODE" = "200" ] || { echo "Refusing to publish: /api/pulse/bootstrap returned $CODE." >&2; exit 1; }

echo "Opening tunnel…"
cloudflared tunnel --url "http://localhost:$PORT" >/tmp/pulse-tunnel.log 2>&1 &
TUNNEL=$!
trap 'kill ${SERVER:-0} $TUNNEL 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  sleep 1
  URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/pulse-tunnel.log | head -1 || true)
  [ -n "${URL:-}" ] && break
done
[ -n "${URL:-}" ] || { echo "Tunnel reported no URL; see /tmp/pulse-tunnel.log" >&2; exit 1; }

echo
echo "  Preview:  $URL"
echo "  Local:    http://localhost:$PORT"
echo
echo "This URL is temporary and changes every run. Ctrl-C takes it down."
echo "For a fixed hostname:  cloudflared tunnel login && cloudflared tunnel create pulse"
