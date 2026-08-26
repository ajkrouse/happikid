#!/bin/bash
set -euo pipefail

# Reconcile dependencies without interactive audit/funding prompts.
npm install --legacy-peer-deps --no-audit --no-fund

# Do not replay migrations here. This project has a legacy database whose
# schema predates the Drizzle journal, and production schema changes are applied
# by Replit Publish rather than application or reconciliation startup.
npm run build

echo "Post-merge setup complete."
