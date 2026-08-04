---
name: API validation patterns
description: How strict input validation is structured across all POST/PATCH routes in this project
---

# API Validation Patterns

## Strict numeric validation in shared schema
**Rule:** insertProviderSchema (shared/schema.ts) uses helpers _strictOptInt, _strictReqInt, _strictOptDecStr for all numeric columns. These replace drizzle-zod defaults that silently coerce bad strings.

**Why:** parseInt("abc") || 0 = 0 — bad values reach the DB silently. Helpers reject "abc", "12abc", "1.5" for integer fields.

**How to apply:** When adding a new numeric column, always add an override in the .extend() block using the strict helpers.

## Client-safe update schemas
**Rule:** Every public mutation endpoint uses a dedicated schema omitting server-controlled fields:
- providerClientUpdateSchema — omits userId, ownerUserId, claim fields, analytics counters, visibility flags, import/provenance fields, profileCompleteness, onboardingStep
- familyProfileClientUpdateSchema — omits userId, isComplete, completedSteps
- reviewClientCreateSchema — omits isVerified
- inquiryClientCreateSchema — omits userId, status (status always forced to "pending" server-side)

**Why:** Using raw insert schemas lets clients forge trusted fields (ownership, verification status, etc.).

**How to apply:** Any new POST/PATCH route needs a XxxClientSchema omitting server-owned fields. Always enforce server-controlled values after parsing.

## strictPathInt helper
**Rule:** server/lib/pathParams.ts exports strictPathInt(param): number|null. Use instead of parseInt for all numeric route path params.

**Why:** parseInt("1junk") === 1, so isNaN check passes for malformed values. strictPathInt rejects any non-canonical integer string.

**How to apply:** const id = strictPathInt(req.params.id); if (!id) return res.status(400)...

## Claim IDs are UUIDs, not integers
**Rule:** claims.id is a UUID string. Use z.string().uuid().safeParse(req.params.id) for claim admin routes.

**Why:** parseInt/isNaN checks break UUID path params — UUID fails parseInt, always returns 400.
