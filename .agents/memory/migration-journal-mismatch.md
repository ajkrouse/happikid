---
name: Migration journal mismatch
description: Development database migration history does not fully describe its existing legacy schema.
---

The development database contains older tables that are not recorded in the Drizzle migration journal. A full migration replay fails when it reaches those already-existing tables, even though the database connection and current migrator configuration are valid.

**Why:** Treating that failure as a migration-code defect risks broad schema reconciliation or `db:push`, which can remove SQL-only indexes and makes the schema less trustworthy.

**How to apply:** Commit every new migration normally and validate it against a clean database or by safely applying only the new additive schema in development. Do not use `db:push` as a substitute for versioned migrations.

Production releases must run the committed migration set before starting the HTTP server, but the everyday development command intentionally does not replay migrations. Use the explicit release-mode development command only when testing that migration gate against an appropriate schema.

**Why:** The legacy development database cannot safely replay its incomplete journal, while allowing production to bypass migrations would serve application code against an unverified schema.

**How to apply:** Keep the production release bootstrap fail-closed. Do not “fix” a local migration failure by disabling the release migration gate or adding broad schema synchronization.