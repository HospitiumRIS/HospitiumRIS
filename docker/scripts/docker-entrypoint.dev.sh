#!/bin/sh
set -e

echo "==> HospitiumRIS development container startup"

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

wait_for_db

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Seeding account types..."
node prisma/seed-account-types.js || true

if [ -n "$GLOBAL_ADMIN_EMAIL" ] && [ -n "$GLOBAL_ADMIN_NAME" ] && [ -n "$GLOBAL_ADMIN_PASSWORD" ]; then
  echo "==> Ensuring Global Admin account exists..."
  node scripts/create-global-admin.js \
    --email "$GLOBAL_ADMIN_EMAIL" \
    --name "$GLOBAL_ADMIN_NAME" \
    --password "$GLOBAL_ADMIN_PASSWORD" \
    || true
fi

mkdir -p uploads/proposals uploads/ethics uploads/training/materials uploads/training/certificates logs

echo "==> Starting development server..."
exec "$@"
