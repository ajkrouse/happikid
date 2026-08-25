---
name: AI chat ownership
description: Privacy rule for stored AI conversations and their safe legacy-data handling.
---

Every stored AI conversation and message access must be scoped to the authenticated account. Never rely on an opaque conversation ID alone for authorization.

**Why:** Conversation prompts and model responses may contain sensitive family, provider, or business information. A global ID lookup can expose another account's history or send it back to a model.

**How to apply:** Require an account owner for new conversations and include that owner in list, read, send, and delete predicates. Keep legacy rows without an owner inaccessible rather than guessing an owner or exposing them. Bound model calls with cancellation so a disconnected or timed-out client does not leave an upstream stream consuming tokens.