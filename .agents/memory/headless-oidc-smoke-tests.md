---
name: Headless OIDC smoke tests
description: How to interpret Replit OIDC failures during containerized real-browser checks.
---

Containerized headless Chromium can follow the application's sign-in redirect
to Replit OIDC but receive a Cloudflare `403` before interactive authentication.
Record this as an environment limitation; it does not verify or disprove the
application's authenticated flow.

**Why:** The app's public pages and signed-out guards can pass in the same
browser session while Replit's external authorization page blocks the
container's network identity.

**How to apply:** Complete role-based staging acceptance from a normal browser
network with designated test accounts. Keep the alpha gate blocked until those
interactive flows and the recipient inbox are verified.