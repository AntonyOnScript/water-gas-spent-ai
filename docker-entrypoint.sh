#!/bin/sh
set -e

# wait database to be ready (first run)

until npx prisma db push; do
  >&2 echo "db unavailable - sleeping"
  sleep 2
done

# continue docker command
exec "$@"
