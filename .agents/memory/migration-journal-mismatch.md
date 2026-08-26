---
name: Migration journal mismatch
description: Development database migration history does not fully describe its existing legacy schema.
---

The development database contains older tables that are not recorded in the Drizzle migration journal. A full migration replay fails when it reaches those already-existing tables, even though the database connection and current migrator configuration are valid.

**Why:** Treating that failure as a migration-code defect risks broad schema reconciliation or `db:push`, which can remove SQL-only indexes and makes the schema less trustworthy.

**How to apply:** Commit every new migration normally and validate it against a clean database or by safely applying only the new additive schema in development. Do not use `db:push` as a substitute for versioned migrations.

Production schema changes must use Replit's Publish-time development→production schema diff. The application build and startup commands must not replay Drizzle migrations or perform any other DDL.

**Why:** Existing databases can contain the current schema without matching Drizzle journal entries. Replaying from the baseline at container startup can attempt to recreate existing enums/tables, crash the app, and fail the Autoscale health check even after Publish already confirmed there is no schema diff.

**How to apply:** Keep production build/start commands focused on compiling and serving the HTTP application. Diagnose schema issues with the read-only Publish diff, make schema-source changes in development, and re-publish; never add deploy-time or startup-time migration commands.