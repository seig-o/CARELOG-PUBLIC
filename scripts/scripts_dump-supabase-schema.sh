#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_HOST:?SUPABASE_DB_HOST is required}"
: "${SUPABASE_DB_NAME:?SUPABASE_DB_NAME is required}"
: "${SUPABASE_DB_USER:?SUPABASE_DB_USER is required}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD is required}"
: "${SUPABASE_DB_PORT:=5432}"

export PGPASSWORD="$SUPABASE_DB_PASSWORD"

mkdir -p supabase-snapshots
OUT="supabase-snapshots/schema-$(date -u +%Y%m%dT%H%M%SZ).sql"

echo "Dumping schema to $OUT ..."
pg_dump -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" \
  --schema-only --no-owner --no-privileges -f "$OUT"

# Update a "latest" copy for easy diffing
cp -f "$OUT" supabase-snapshots/schema-latest.sql

# If you want automatic commits from the workflow, these git commands will run there.
# They are no-ops locally unless the environment provides credentials.
git add "$OUT" supabase-snapshots/schema-latest.sql || true
git -c user.name="supabase-snapshot" -c user.email="snapshot@example.com" \
  commit -m "chore: supabase schema snapshot $(date -u +%Y-%m-%dT%H:%M:%SZ)" || true
git push || true

echo "Done: $OUT"