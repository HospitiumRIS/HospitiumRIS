#!/bin/sh
set -e

echo "==> HospitiumRIS container startup"

wait_for_db() {
  echo "==> Waiting for PostgreSQL..."
  retries=30
  until node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT 1\`.then(() => process.exit(0)).catch(() => process.exit(1));
  " 2>/dev/null; do
    retries=$((retries - 1))
    if [ "$retries" -le 0 ]; then
      echo "ERROR: Database not reachable after 30 attempts"
      exit 1
    fi
    sleep 2
  done
  echo "==> PostgreSQL is ready"
}

run_migrations() {
  echo "==> Running database migrations..."
  prisma migrate deploy
}

seed_account_types() {
  echo "==> Seeding account types..."
  node prisma/seed-account-types.js || true
}

ensure_global_admin() {
  if [ -n "$GLOBAL_ADMIN_EMAIL" ] && [ -n "$GLOBAL_ADMIN_NAME" ] && [ -n "$GLOBAL_ADMIN_PASSWORD" ]; then
    echo "==> Ensuring Global Admin account exists..."
    node scripts/create-global-admin.js \
      --email "$GLOBAL_ADMIN_EMAIL" \
      --name "$GLOBAL_ADMIN_NAME" \
      --password "$GLOBAL_ADMIN_PASSWORD" \
      || true
  fi
}

wait_for_db
run_migrations
seed_account_types
ensure_global_admin

echo "==> Starting application..."
exec "$@"
