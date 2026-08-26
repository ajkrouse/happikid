# Alpha Access Matrix

Verified: August 26, 2026

This document records the staging-like authorization review for the HappiKid
alpha. The review uses the real Express route modules, rendered React
navigation, and stateful in-memory test fixtures. It does not depend on a
developer database or external email/object-storage services.

## Alpha authorization rules

1. **The API is authoritative.** Hidden navigation links are not a security
   boundary. A user who enters a protected URL directly must still receive
   `401`, `403`, or an ownership-safe `404` from the API.
2. **Provider control follows canonical ownership.**
   - A direct/unclaimed listing is controlled by `userId` only while
     `ownerUserId` is empty.
   - After a claim is approved, `ownerUserId` is authoritative.
   - The former creator in `userId` cannot continue editing a claimed listing.
3. **Admin privileges require `role === "admin"` on the server.** Being
   authenticated, owning a provider, or knowing an admin URL does not grant
   review access.
4. **Family-visible providers must be active, license-confirmed, visible, and
   public.** Draft, rejected, hidden, inactive, and unpublished listings fail
   closed.
5. **Public DTOs are allowlists.** Public provider responses do not serialize
   raw provider rows.
6. **Self-scoped records stay self-scoped.** Favorites, family profiles,
   inquiries, tours, and parent threads use the authenticated account ID.
   Provider inboxes, analytics, images, and edits use canonical provider
   ownership.

## Role matrix

Legend: **Allow** means the role can use the path when it also satisfies the
listed ownership/state conditions. **Deny** means the API must reject or hide
the resource even if the user knows its URL or ID.

| Capability | Non-Admin Parent | Direct/Unclaimed Provider | Claimed Provider | Admin Reviewer |
| --- | --- | --- | --- | --- |
| Search and view public providers | **Allow**, public DTO only | **Allow**, public DTO only | **Allow**, public DTO only | **Allow**, public DTO only |
| View hidden, draft, rejected, or unpublished provider publicly | **Deny / 404** | **Deny / 404** through public routes | **Deny / 404** through public routes | **Deny / 404** through public routes; use admin review APIs |
| Manage own favorites and favorite groups | **Allow**, account-scoped | Authenticated self-scoped endpoints are available, but do not grant provider control | Same | Same |
| Submit an inquiry | **Allow** for a public provider | Authenticated self-scoped endpoint is available | Same | Same |
| Submit a tour request | **Allow** for a public provider | **Deny / 403** because the account is not a parent | **Deny / 403** because the account is not a parent | **Deny / 403** because the account is not a parent |
| Read parent inquiries, tours, and threads | **Allow**, own records only | **Deny** unless the account is the canonical owner of the destination provider | Same | No implicit access to another account's records |
| Manage a direct/unclaimed listing | **Deny** unless it is actually the canonical owner | **Allow** only when `ownerUserId` is empty and `userId` matches | Not applicable after transfer | No implicit provider-management privilege |
| Manage a claimed listing | **Deny** | **Deny** when another user is in `ownerUserId`, including the former creator | **Allow** only when `ownerUserId` matches | No implicit provider-management privilege |
| Edit provider profile, pricing, schedule, enrollment, or images | **Deny / 403** for non-owner | **Allow** for own canonical listing | **Allow** for own canonical listing | **Deny** unless separately the canonical owner |
| Read provider inbox, tours, threads, and analytics | **Deny** for non-owner | **Allow** for own canonical listing | **Allow** for own canonical listing | No implicit access |
| Generate or view provider AI reply drafts | **Deny / 403**; drafts are removed from parent DTOs | **Allow** for own canonical listing when AI consent/settings permit | Same | No implicit access |
| Submit a listing claim | Authenticated accounts may submit a valid claim | **Allow** for an unclaimed listing | **Deny** for an already claimed/pending listing | May review claims rather than claim as admin |
| List, approve, or reject claims | **Deny / 403** | **Deny / 403** | **Deny / 403** | **Allow** |
| List, approve, or reject license verifications | **Deny / 403** | **Deny / 403** | **Deny / 403** | **Allow** |

## Navigation verification

The shared navigation is role-aware on desktop and mobile. Direct URL access is
still protected by page/API guards.

| Role | Visible authenticated navigation | Hidden permission links |
| --- | --- | --- |
| Non-Admin Parent | Messages, About, Contact; mobile also shows Find Programs | Provider Dashboard, Verifications |
| Direct/Unclaimed Provider | Provider Dashboard, Messages, About, Contact; mobile also shows Find Programs | Verifications |
| Claimed Provider | Same provider navigation as a direct provider; ownership differences are enforced by the API | Verifications |
| Admin Reviewer | Verifications, Messages, About, Contact; mobile also shows Find Programs | Provider Dashboard |

Additional routing notes:

- `/admin/claims` has its own client role guard and server admin guard, although
  it is not currently linked from the shared navigation.
- `/admin/verifications` relies on the server's admin response as the
  authoritative guard and renders an access/error state for unauthorized
  callers.
- `/provider/dashboard`, `/parent/dashboard`, and `/messages` are registered
  client routes. Their private data comes only from protected APIs, so entering
  the URL directly cannot bypass server authorization.
- Provider navigation is based on the account role. Whether a particular
  listing is direct or claimed is decided by canonical ownership on every API
  operation.

## DTO and private-attribute checks

### Public provider responses

Search, provider detail, public images, favorites, and public provider data in
threads use public DTO shaping. Unauthorized callers do not receive:

- `userId` or `ownerUserId`
- license numbers or internal license status
- claim status, verification method, or verification payload
- internal notes or moderation metadata
- provider analytics counters
- raw private object-storage paths
- hidden exact tuition

The public DTO may expose the derived family-facing `isVerified` badge after
license confirmation. This is not the internal verification record.

### Messaging responses

- A parent receives only the public provider DTO in thread detail.
- Provider AI draft fields are set to `null` for the parent.
- Only the parent on the thread or the provider's canonical owner can load or
  write messages.
- Only the canonical provider owner can update provider-side thread status or
  generate/discard AI drafts.

### Provider-owner responses

`/api/providers/mine`, image management, provider inboxes, and analytics may
return editor/internal fields needed to manage the listing, but only after
canonical ownership succeeds.

### Admin responses

Claim and license-review DTOs may include claimant, owner, license, and review
metadata needed for the review decision. These routes first enforce the admin
role on the server.

### Client-supplied write DTOs

Client-safe schemas remove or overwrite server-controlled values such as:

- account and provider ownership IDs
- claim and verification state
- admin/system flags
- analytics counters
- inquiry/tour initial status
- AI conversation ownership

## Automated verification evidence

| Area | Evidence |
| --- | --- |
| Stateful parent/provider/admin journeys | `tests/marketplaceJourneys.integration.test.ts` |
| Public visibility and provider DTO redaction | `tests/publicProviderSecurity.api.test.ts` |
| Canonical claimed-listing ownership | `tests/publicProviderSecurity.api.test.ts`, `tests/mineClosureFilter.api.test.ts` |
| Provider image ownership and safe public URLs | `tests/providerImages.api.test.ts` |
| Parent/provider thread access | `tests/threads.access.test.ts` |
| Provider-only AI drafts and parent redaction | `tests/aiDraft.api.test.ts` |
| Admin license-review access | `tests/admin.verifications.access.test.ts` |
| Admin claim access and validation | `tests/route-validation.test.ts` |
| Favorite/favorite-group public DTOs | `tests/favorites.api.test.ts`, `tests/favoriteGroups.api.test.ts` |
| Desktop and mobile role navigation | `client/src/__tests__/Navigation.roles.test.tsx` |

## Staging smoke checklist

Use four separate staging accounts and a public/incognito window. Do not reuse
sessions between roles. The checked items below represent the automated
staging-like verification in this repository; repeat the same checklist with
live staging accounts before launch if authentication, session, or deployment
configuration changes.

### Non-Admin Parent

- [x] Can search and view only public providers.
- [x] Can favorite, inquire, message, and request a tour using own account data.
- [x] Cannot edit a provider or access provider analytics/images.
- [x] Cannot access claim-review or license-review APIs.
- [x] Does not see Provider Dashboard or Verifications navigation.
- [x] Does not receive provider ownership, license, claim, moderation, analytics,
      AI-draft, hidden-pricing, or raw object-path fields.

### Direct/Unclaimed Provider

- [x] Can manage the listing where `ownerUserId` is empty and `userId` matches.
- [x] Can access only that listing's inbox, tours, images, and analytics.
- [x] Cannot edit another direct provider or a listing transferred to a claimant.
- [x] Cannot submit a parent-only tour request.
- [x] Cannot access admin review APIs or Verifications navigation.
- [x] Sees Provider Dashboard navigation.

### Claimed Provider

- [x] Can manage the listing assigned through `ownerUserId`.
- [x] Can access only that listing's inbox, tours, images, analytics, and AI
      drafts.
- [x] The former `userId` creator cannot edit or manage the claimed listing.
- [x] Cannot access admin review APIs or Verifications navigation.
- [x] Sees the same Provider Dashboard navigation as a direct provider.

### Admin Reviewer

- [x] Can list and decide claims and license verifications.
- [x] Non-admin callers receive `403` from those same routes.
- [x] Admin review data is available only behind the server role check.
- [x] Does not receive implicit provider-owner access.
- [x] Sees Verifications navigation and does not see Provider Dashboard.

## Release command

Run the complete alpha gate before promotion:

```bash
npm run alpha:check
```

Passing criteria:

- all server tests pass
- all client tests pass
- TypeScript reports no errors
- the production build succeeds

Latest result on August 26, 2026:

- server: **528 passed**
- client: **249 passed**
- TypeScript: **passed**
- production build: **passed**