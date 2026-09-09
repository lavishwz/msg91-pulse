#!/usr/bin/env bash
# Apply Pulse's own schema to the local database.
#
#   ./scripts/pulse-store/up.sh          create (or update) pulse_store + seed policy
#   ./scripts/pulse-store/up.sh reset    drop it and start over
#
# Reads the same local server scripts/local-db/up.sh runs. Nothing here touches
# the MSG91 schema — pulse_store is a separate database on the same instance.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
SOCKET="$ROOT/.localdb/mysql.sock"

SERVER_ROOT="$(ls -d "$HOME"/.local/mariadb-*/ 2>/dev/null | grep -v mariadb-dl | head -1 || true)"
CLIENT="${SERVER_ROOT:+$SERVER_ROOT/bin/mariadb}"
[[ -x "${CLIENT:-}" ]] || CLIENT="$(command -v mariadb || command -v mysql)"

[[ -S "$SOCKET" ]] || { echo "✗ local server is not running — run: npm run db:local"; exit 1; }

# The MYSQL_* vars in the environment point at whichever database the app uses;
# the client would pick them up and connect there instead of over the socket.
client() {
  env -u MYSQL_HOST -u MYSQL_PORT -u MYSQL_USER -u MYSQL_PASSWORD -u MYSQL_DATABASE \
    "$CLIENT" --protocol=socket --socket="$SOCKET" -u root --skip-ssl "$@"
}

if [[ "${1:-}" == "reset" ]]; then
  echo "→ dropping pulse_store"
  client -e "DROP DATABASE IF EXISTS pulse_store"
fi

echo "→ applying schema"
client < "$HERE/schema.sql"
echo "→ seeding policy v1"
client < "$HERE/seed-policy.sql"
client -e "GRANT ALL ON pulse_store.* TO 'pulse'@'127.0.0.1'; FLUSH PRIVILEGES;"

echo "✓ pulse_store ready — $(client -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='pulse_store'") tables, $(client -N -B pulse_store -e 'SELECT COUNT(*) FROM pulse_policy') policy rows"
