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

# Marketplace integrity migrations

**Rule:** Before adding a new database uniqueness/check/trigger invariant, the migration must run non-destructive preflight checks and stop with actionable remediation if legacy rows violate it.

**Why:** Existing production-like databases may predate the invariant. Letting an `ALTER TABLE ... ADD CONSTRAINT` discover conflicts can leave operators without a clear fix or, outside a transaction, a partially applied migration.

**How to apply:** Use a `DO` preflight block before structural DDL. Backfill only deterministic, non-destructive fields; otherwise abort. When a write metric is keyed by `CURRENT_DATE`, derive its insert date in PostgreSQL too—do not mix application UTC dates with database-local reporting.

# Sensitive fields in shared endpoints

**Rule:** New per-thread/per-provider fields intended for one party (e.g. AI draft replies) must be stripped from ALL endpoints the other party can hit — list endpoints included, not just the detail route. Redact in storage AND route (defense in depth), and add tests proving the leak path is closed.

**Rule:** `showExactPrice === false` means NO numeric price (fixed or min/max) may appear anywhere parent-visible — including AI prompt context sent to external models. Only a non-numeric cost level is public.
