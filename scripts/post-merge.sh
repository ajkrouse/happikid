#!/bin/bash
set -e

# Install dependencies
npm install --legacy-peer-deps

# Run database migrations (applies any new versioned migration files)
npx drizzle-kit migrate --config drizzle.config.ts

echo "Post-merge setup complete."
