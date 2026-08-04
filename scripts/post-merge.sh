#!/bin/bash
set -e

# Install dependencies
npm install --legacy-peer-deps

# Run database migrations (applies any new versioned migration files)
npx drizzle-kit migrate --config drizzle.config.ts 2>&1 || true

echo "Post-merge setup complete."
