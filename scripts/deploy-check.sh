#!/usr/bin/env bash

set -euo pipefail

echo "==> Production deploy safety check"

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -f ".env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found."
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required but was not found."
  exit 1
fi

missing_env=0

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Missing DATABASE_URL"
  missing_env=1
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "Missing DIRECT_URL"
  missing_env=1
fi

if [ "$missing_env" -ne 0 ]; then
  echo
  echo "Load the production environment before running this check."
  echo "Example: export DATABASE_URL=... and DIRECT_URL=..."
  exit 1
fi

echo
echo "==> Checking Prisma migration state"
npx prisma migrate status

echo
echo "==> Building the app"
npm run build

echo
echo "==> Deploy safety check passed"
echo "Next recommended steps:"
echo "1. Apply production migrations: npx prisma migrate deploy"
echo "2. Redeploy the app"
echo "3. Smoke test key routes: /dashboard, /customers, /vehicles, /bookings"
