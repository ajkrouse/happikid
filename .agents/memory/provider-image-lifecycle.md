---
name: Provider image lifecycle
description: Durable rules for staging, publishing, and cleaning provider-owned image objects.
---

Provider-image uploads must use a short-lived staging namespace distinct from
the permanent image namespace. Validate and promote the staged object before
persisting the permanent path. Only staging files may be swept for expiry.

**Why:** Sweeping a shared upload/final namespace silently removed successful
provider photos. Storage deletes are also fallible, so best-effort logging
alone can permanently orphan private objects.

**How to apply:** Any later media type should preserve the same boundary:
provider-bound temporary upload intent, validation before promotion,
visibility-checked public delivery, and a durable cleanup record before
deleting a database reference or compensating for a failed finalization.