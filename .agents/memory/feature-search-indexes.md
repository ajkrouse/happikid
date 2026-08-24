---
name: Feature search indexes
description: PostgreSQL immutability requirement for trigram indexes over provider feature arrays
---

# Feature search indexes

**Rule:** When trigram-indexing provider feature text derived from a `text[]`, use the dedicated immutable database helper in both the index expression and the query predicate rather than calling `array_to_string` directly.

**Why:** PostgreSQL rejects a direct `array_to_string(...)` index expression because it is not declared immutable, even when the input is a text array and the separator is constant.

**How to apply:** Keep the helper migration-backed and use the same helper expression wherever feature text is searched with `ILIKE`; otherwise the planner cannot use the index.