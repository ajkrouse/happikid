---
name: Public pricing policy
description: The marketplace's single visibility rule for exact tuition across discovery, UI, saved providers, and AI.
---

# Public pricing policy

**Rule:** Exact tuition may be used or shown to families only when the provider has opted in to public exact pricing and supplied a valid positive fixed amount or complete ordered range. Hidden, malformed, and absent values are unavailable for parent-facing filters, ranking, comparison scoring, saved-provider responses, and AI context.

**Why:** Redacting only the final response still allows private tuition to influence the order and filter results a family sees, and alternate public paths such as saved providers can bypass the response boundary.

**How to apply:** Treat the shared public pricing representation as the source for any new parent-facing feature. When no exact public value exists, use a clearly labeled non-provider estimate only for display; never use estimates or raw hidden amounts for price filters, sorts, or fit scores.