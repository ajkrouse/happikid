# Safe Release Smoke Runbook

This runbook is for a **staging deployment only**. It creates a repeatable
release check without asking anyone to share a personal password, personal
session cookie, or mailbox.

## Account and inbox ownership

Create these resources in the staging environment through the normal
organization-approved account process:

| Resource | Required role | Ownership rule |
| --- | --- | --- |
| Parent smoke identity | `parent` | Dedicated staging-only identity; never a team member's everyday account |
| Provider smoke identity | `provider` | Dedicated staging-only identity; owns only the test provider fixture |
| Admin smoke identity | `admin` | Dedicated staging-only identity; limited to staging verification work |
| Test inbox | recipient mailbox | Shared or managed test inbox, not an individual's mailbox |

Assign one owner for access reviews and one backup owner. Review access monthly,
rotate sessions after any owner change, and delete or disable all three
identities and the inbox when the staging environment is retired. Keep the
provider fixture clearly marked as test data so it cannot be mistaken for a
real listing.

## Secret handling

Store only the following values in the Replit Secrets manager for the staging
environment. Do not put them in `.env`, shell history, source files, tickets,
screenshots, or chat:

- `RELEASE_SMOKE_ENV=staging` (a non-secret guard value)
- `RELEASE_SMOKE_BASE_URL=https://<staging-host>` (a staging URL, not production)
- `RELEASE_SMOKE_TEST_INBOX=<managed-test-inbox>`
- `RELEASE_SMOKE_PARENT_COOKIE=<parent-session-cookie>`
- `RELEASE_SMOKE_PROVIDER_COOKIE=<provider-session-cookie>`
- `RELEASE_SMOKE_ADMIN_COOKIE=<admin-session-cookie>`

The three session values are obtained only after signing into the dedicated
staging identities. Treat them as credentials: grant access to the smallest
possible release-testing group, never print them, and remove them when the
staging session is retired. The preflight checks only presence, distinctness,
and the role returned by the application; it does not print cookie values or
user responses.

## Establishing role sessions

1. Open the staging URL from a normal browser network. Do not use the
   containerized headless browser for the interactive OIDC step; Replit OIDC
   may return a Cloudflare `403` to that network even when the application is
   healthy.
2. Sign in with the dedicated parent identity and confirm the account is a
   parent. Repeat separately for the provider and admin identities.
3. Capture each staging session only through the approved secret-management
   process. Do not copy a personal session and do not paste a session into a
   command line.
4. Add the three session values to the staging Replit Secrets environment,
   then run:

   ```bash
   npm run release:smoke:preflight
   ```

   A successful result confirms the target is marked staging, all three
   sessions are distinct, and the application reports the expected role for
   each session. A failure is a release blocker; do not work around it by
   changing role values or bypassing authorization.

## Role-based acceptance

After preflight succeeds, use the same normal browser network and the
dedicated identities to verify:

1. Parent: open a provider profile, submit a review, submit an inquiry, and
   confirm the inquiry and provider reply appear in the parent dashboard.
2. Provider: open the inbound inquiry, reply, upload a clearly marked test
   image, and confirm the provider dashboard reflects the update.
3. Admin: review the test provider verification and complete the approval path.
4. Inbox: confirm the notification arrives in the designated test inbox, open
   its link, and verify it lands on the intended HappiKid page.
5. Cleanup: remove or reset the test inquiry, review, upload, approval fixture,
   and notification event according to the staging data-retention policy.

Record only non-sensitive evidence: run date, staging hostname, role outcome,
record IDs, email subject, destination path, and outbox delivery state. Never
record passwords, access tokens, cookies, or full email addresses.

## Optional bounded inbox load

The parent session secret can also enable the authenticated portion of the
bounded load harness without placing a cookie in the command. With
`RELEASE_SMOKE_PARENT_COOKIE` stored in the staging Secrets environment, run:

```bash
npm run alpha:load
```

The harness automatically uses `RELEASE_SMOKE_PARENT_COOKIE` when
`LOAD_TEST_COOKIE` is absent. An explicitly supplied `LOAD_TEST_COOKIE` still
takes precedence for a one-off approved test. Keep this optional load check
separate from the manual role-based browser acceptance.