#!/usr/bin/env bash
#
# Bring up a local Pulse database — no root required.
#
# The production host is IP-bound, so it is unreachable from most machines. This
# runs a MariaDB server entirely inside the project's own directory, loads
# MSG91's schema dump into it, and fills it with dummy data.
#
#   ./scripts/local-db/up.sh          start it (installs on first run)
#   ./scripts/local-db/up.sh stop     stop the server
#   ./scripts/local-db/up.sh status   is it up?
#   ./scripts/local-db/up.sh reset    wipe the data directory and start over
#
# Everything lives under .localdb/ (git-ignored). Nothing is installed
# system-wide and no service is registered.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
DB_HOME="$ROOT/.localdb"
DATA="$DB_HOME/data"
SOCKET="$DB_HOME/mysql.sock"
PIDFILE="$DB_HOME/mysqld.pid"
LOG="$DB_HOME/mysqld.log"
PORT="${LOCAL_DB_PORT:-3399}"
DBNAME="pulse_local"
DUMP="$ROOT/../Dump20260903.sql"

# Where the server binaries live. A tarball unpacked into ~/.local wins; a
# system mysqld/mariadbd is used if one happens to exist.
SERVER_ROOT="$(ls -d "$HOME"/.local/mariadb-*/ 2>/dev/null | grep -v mariadb-dl | head -1 || true)"
if [[ -n "$SERVER_ROOT" && -x "$SERVER_ROOT/bin/mariadbd" ]]; then
  MYSQLD="$SERVER_ROOT/bin/mariadbd"
  CLIENT="$SERVER_ROOT/bin/mariadb"
  INSTALL_DB="$SERVER_ROOT/scripts/mariadb-install-db"
  BASEDIR="$SERVER_ROOT"
elif command -v mariadbd >/dev/null 2>&1; then
  MYSQLD="$(command -v mariadbd)"; CLIENT="$(command -v mariadb)"
  INSTALL_DB="$(command -v mariadb-install-db)"; BASEDIR="/usr"
elif command -v mysqld >/dev/null 2>&1; then
  MYSQLD="$(command -v mysqld)"; CLIENT="$(command -v mysql)"
  INSTALL_DB=""; BASEDIR="/usr"
else
  echo "✗ No MariaDB/MySQL server found."
  echo "  Unpack a server tarball into ~/.local, for example:"
  echo "    curl -L -o /tmp/mariadb.tar.gz \\"
  echo "      https://archive.mariadb.org/mariadb-11.4.4/bintar-linux-systemd-x86_64/mariadb-11.4.4-linux-systemd-x86_64.tar.gz"
  echo "    mkdir -p ~/.local && tar -xzf /tmp/mariadb.tar.gz -C ~/.local"
  echo "  or install one system-wide: sudo apt install -y mariadb-server"
  exit 1
fi

running() { [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; }

client() { "$CLIENT" --protocol=socket --socket="$SOCKET" -u root "$@"; }

stop_server() {
  if running; then
    echo "→ stopping (pid $(cat "$PIDFILE"))"
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    for _ in $(seq 1 40); do running || break; sleep 0.25; done
  fi
  rm -f "$PIDFILE"
  echo "✓ stopped"
}

case "${1:-start}" in
  stop) stop_server; exit 0 ;;
  status)
    if running; then echo "✓ running on port $PORT (pid $(cat "$PIDFILE"))"; else echo "· not running"; fi
    exit 0 ;;
  reset)
    stop_server
    echo "→ removing $DATA"
    rm -rf "$DATA"
    ;;
  start) ;;
  *) echo "usage: up.sh [start|stop|status|reset]"; exit 2 ;;
esac

if running; then
  echo "✓ already running on port $PORT"
  exit 0
fi

mkdir -p "$DB_HOME"

# First run: create the data directory.
if [[ ! -d "$DATA/mysql" ]]; then
  echo "→ initialising a fresh data directory"
  mkdir -p "$DATA"
  if [[ -n "$INSTALL_DB" ]]; then
    "$INSTALL_DB" --basedir="$BASEDIR" --datadir="$DATA" --auth-root-authentication-method=normal \
      >"$DB_HOME/install.log" 2>&1 || { echo "✗ init failed, see $DB_HOME/install.log"; exit 1; }
  else
    "$MYSQLD" --initialize-insecure --datadir="$DATA" \
      >"$DB_HOME/install.log" 2>&1 || { echo "✗ init failed, see $DB_HOME/install.log"; exit 1; }
  fi
  echo "✓ data directory ready"
fi

echo "→ starting server on port $PORT"
"$MYSQLD" \
  --datadir="$DATA" \
  --socket="$SOCKET" \
  --port="$PORT" \
  --pid-file="$PIDFILE" \
  --bind-address=127.0.0.1 \
  --skip-networking=0 \
  --skip-grant-tables=0 \
  --innodb-buffer-pool-size=256M \
  --sql-mode="NO_ENGINE_SUBSTITUTION" \
  >"$LOG" 2>&1 &

for _ in $(seq 1 80); do
  if client -e "SELECT 1" >/dev/null 2>&1; then break; fi
  sleep 0.5
done
client -e "SELECT 1" >/dev/null 2>&1 || { echo "✗ server did not come up — see $LOG"; tail -20 "$LOG"; exit 1; }
echo "✓ server up"

# The app connects over TCP as a normal user, so create one that matches
# .env.local rather than relying on root's socket auth.
client -e "
  CREATE DATABASE IF NOT EXISTS \`$DBNAME\` CHARACTER SET utf8mb4;
  CREATE USER IF NOT EXISTS 'pulse'@'127.0.0.1' IDENTIFIED BY 'pulse';
  GRANT ALL ON \`$DBNAME\`.* TO 'pulse'@'127.0.0.1';
  FLUSH PRIVILEGES;"

# Load the schema once. The dump carries 106 tables and no data.
if ! client -D "$DBNAME" -e "SELECT 1 FROM ms_user LIMIT 1" >/dev/null 2>&1; then
  [[ -f "$DUMP" ]] || { echo "✗ schema dump not found at $DUMP"; exit 1; }
  echo "→ loading schema from $(basename "$DUMP")"
  # The dump is a MySQL 8 export of a 5.7 server; a couple of its session
  # variables do not exist in MariaDB, so drop those lines rather than fail.
  grep -vE 'GTID_PURGED|SQL_LOG_BIN|@MYSQLDUMP_TEMP_LOG_BIN' "$DUMP" \
    | client -D "$DBNAME" --force 2>"$DB_HOME/schema.log" || true
  client -D "$DBNAME" < "$HERE/schema-extra.sql"
  COUNT=$(client -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DBNAME'")
  echo "✓ $COUNT tables"
fi

cat <<EOF

  ✓ local database ready

    host      127.0.0.1
    port      $PORT
    user      pulse
    password  pulse
    database  $DBNAME

  Put that in .env.local:

    MYSQL_HOST=127.0.0.1
    MYSQL_PORT=$PORT
    MYSQL_USER=pulse
    MYSQL_PASSWORD=pulse
    MYSQL_DATABASE=$DBNAME

  Then fill it with dummy data:

    npm run db:local:seed

EOF
