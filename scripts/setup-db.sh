#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DC="docker compose -f $PROJECT_DIR/docker-compose.yml"

# ── 1. Wait for DB ────────────────────────────────────────────────────────────
echo "⏳ Waiting for Postgres..."
MAX=60; TRIES=0
until $DC exec -T db pg_isready -U supabase_admin -h localhost -q 2>/dev/null; do
  TRIES=$((TRIES+1))
  [ "$TRIES" -ge "$MAX" ] && { echo "❌ DB not ready. Check: docker compose logs db"; exit 1; }
  printf "."; sleep 2
done
echo -e "\n✅ Postgres ready"

# ── 2. Set passwords for internal users (supabase/postgres image leaves them blank) ──
echo "🔑 Setting passwords for internal roles..."
$DC exec -T db psql -U supabase_admin -d postgres <<'SQL'
ALTER USER supabase_auth_admin    WITH PASSWORD 'postgres';
ALTER USER supabase_storage_admin WITH PASSWORD 'postgres';
ALTER USER authenticator          WITH PASSWORD 'postgres';
SQL
echo "✅ Passwords set"

# ── 3. Restart dependent services now that passwords exist ────────────────────
echo "🔄 Restarting auth / rest / storage..."
$DC restart auth rest storage > /dev/null 2>&1
echo "✅ Services restarted"

# ── 4. Wait for GoTrue to finish its own migrations ───────────────────────────
echo "⏳ Waiting for GoTrue auth service..."
MAX=40; TRIES=0
until curl -sf "http://localhost:8000/auth/v1/health" > /dev/null 2>&1; do
  TRIES=$((TRIES+1))
  if [ "$TRIES" -ge "$MAX" ]; then
    echo "⚠️  Auth health timed out — continuing (check: docker compose logs auth)"
    break
  fi
  printf "."; sleep 2
done
echo -e "\n✅ Auth service ready"

# ── 5. Enable pg_cron (supabase/postgres image ships with it pre-installed) ───
echo "⏱  Enabling pg_cron..."
$DC exec -T db psql -U supabase_admin -d postgres <<'SQL'
CREATE EXTENSION IF NOT EXISTS pg_cron;
SQL
echo "✅ pg_cron enabled"

# ── 6. Apply migrations in order ─────────────────────────────────────────────
echo "📦 Applying schema + migrations..."
for sql_file in schema.sql migration_v2.sql migration_v3.sql migration_v4.sql; do
  echo "   → $sql_file"
  $DC exec -T db psql -U supabase_admin -d postgres \
    < "$PROJECT_DIR/supabase/$sql_file"
done
echo "✅ All migrations applied"

# ── 7. Create storage bucket (after storage migrations have run) ──────────────
echo "🗂  Creating storage bucket..."
$DC exec -T db psql -U supabase_admin -d postgres <<'SQL'
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-images', 'equipment-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
SQL
echo "✅ Bucket ready"

echo ""
echo "============================================"
echo " 🎉 Setup complete!"
echo "    API:    http://localhost:8000"
echo "    DB UI:  http://localhost:5555"
echo "    App:    npm run dev  →  http://localhost:3000"
echo "============================================"
