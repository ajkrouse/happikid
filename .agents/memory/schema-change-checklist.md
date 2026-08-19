---
name: Schema change checklist
description: What every new DB column/table needs beyond db:push to pass review and deploy
---

# Schema change checklist

**Rule:** `npm run db:push` alone is not deployable. Every schema change must also commit a versioned migration: run `npx drizzle-kit generate --name <slug>` so the SQL file, snapshot, and `migrations/meta/_journal.json` entry are created — the post-merge workflow runs `drizzle-kit migrate` against existing deployments.

**Why:** A task was rejected in review because new columns existed only via db:push; production would have failed on the missing columns.

**How to apply:** After editing shared/schema.ts, run generate, verify the new SQL file and journal entry, and commit them with the code.

# Provider ownership in routes

**Rule:** Any route resolving "my listing" must use `getProvidersByCanonicalOwner` (ownerUserId wins; userId only when ownerUserId IS NULL), not `getProvidersByUserId`. `/api/providers/mine` now does this.

**Why:** Claimed listings have a different canonical owner than the original creator; using userId either locks out the claimant or lets a stale creator manage the listing.

# Sensitive fields in shared endpoints

**Rule:** New per-thread/per-provider fields intended for one party (e.g. AI draft replies) must be stripped from ALL endpoints the other party can hit — list endpoints included, not just the detail route. Redact in storage AND route (defense in depth), and add tests proving the leak path is closed.

**Rule:** `showExactPrice === false` means NO numeric price (fixed or min/max) may appear anywhere parent-visible — including AI prompt context sent to external models. Only a non-numeric cost level is public.
