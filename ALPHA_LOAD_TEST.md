# Alpha Load and Stress Simulation

Verified: August 26, 2026

This is a lightweight, bounded concurrency check for HappiKid's highest-frequency
alpha paths. It is intended for development or staging, not production traffic.

## What is covered

### Live HTTP harness

`scripts/alpha-load-test.ts` exercises realistic provider searches concurrently:

- city and age filters
- borough and price filters
- text-query intelligent search
- enrollment and verified-pricing filters
- distance sorting with latitude, longitude, and radius

When `LOAD_TEST_COOKIE` is set, it also fetches these authenticated messaging
views concurrently:

- `/api/threads`
- `/api/threads/provider/list`

The cookie is read from the environment and is never printed. Do not commit a
session cookie or paste it into source files.

### Deterministic pressure tests

`tests/loadSimulation.test.ts` safely induces conditions that should not be
created against a real database:

- 32 concurrent provider searches while storage fails
- 25 concurrent AI-summary requests against the 20-request limiter
- 40 concurrent inbox reads
- 40 outbox jobs claimed by six competing workers

## Running the live harness

Against the running Replit development workflow:

```bash
npm run alpha:load
```

Against staging with an authenticated session:

```bash
LOAD_TEST_BASE_URL=https://your-staging-host \
LOAD_TEST_COOKIE='your-session-cookie' \
npm run alpha:load
```

The cookie should be supplied through a secure environment variable or secret,
not saved in shell history or committed to the repository.

To probe the AI-summary limiter explicitly:

```bash
LOAD_TEST_AI_PROBE=true npm run alpha:load
```

The AI probe is opt-in because up to 20 accepted requests may invoke the
configured AI service. The deterministic test verifies the same limiter without
external API usage.

## Configuration

| Variable | Default | Purpose |
| --- | ---: | --- |
| `LOAD_TEST_BASE_URL` | Replit dev domain or local port | Target application |
| `LOAD_TEST_ITERATIONS` | `10` | Repetitions of each scenario |
| `LOAD_TEST_CONCURRENCY` | `24` | Concurrent search workers |
| `LOAD_TEST_INBOX_CONCURRENCY` | `8` | Concurrent inbox workers |
| `LOAD_TEST_TIMEOUT_MS` | `5000` | Per-request timeout |
| `LOAD_TEST_P95_MS` | `1500` | Maximum accepted p95 latency |
| `LOAD_TEST_COOKIE` | unset | Enables authenticated inbox checks |
| `LOAD_TEST_AI_PROBE` | `false` | Enables the live rate-limit probe |

The default search run sends 50 requests with up to 24 in flight. The configured
database pool defaults to 20 connections, so the run exercises bounded queueing
above the pool size without creating an unbounded stress test.

## Passing criteria

Provider search and authenticated inbox checks pass when:

- every request receives the expected `200` response
- no connection, timeout, or fetch errors occur
- p95 latency stays at or below the configured budget

Safety simulations pass when:

- a failed search never returns provider data
- excess AI-summary requests receive `429`
- concurrent inbox responses redact provider-only AI draft fields
- competing outbox workers deliver and complete each claimed event once

## Latest results

### Merged parent and notification journey verification

Verified August 26, 2026 after Tasks #220, #221, and #222 were merged:

- merged server journey/security/notification checks: **171 tests passed**
- merged client review/dashboard/smoke checks: **48 tests passed**
- parent review submission is covered from provider profile through successful
  refresh, validation, duplicate handling, and parent-only access
- parent inquiry history and provider replies are covered through the dashboard
  query and ownership-safe API journey
- missing SMTP configuration remains retryable in the outbox
- temporary SMTP failures retry with bounded backoff
- timed-out sends are retried without completion
- exhausted events remain permanently failed for diagnosis

### Live provider search

Run against the active Replit development workflow with 24 concurrent workers:

- requests: **50**
- responses: **50 × 200**
- network/timeouts: **0**
- p50: **171 ms**
- p95: **498 ms**
- maximum: **554 ms**
- budget: **1,500 ms p95**

The run exceeded the default 20-connection pool's size without surfacing a
connection timeout or server error. This is a black-box verification that pool
queueing held under this bounded load; the application does not currently
export live pool wait-count or saturation metrics.

### Production startup smoke check

The production bundle was started with `npm start` after the merged changes.
The server served on port 5000 and returned **HTTP 200** for `/`. No startup
migration or database DDL was executed. The normal development workflow was
restored successfully afterward.

### Messaging and safeguards

- concurrent inbox simulation: **40 × 200**
- inbox AI-draft leaks: **0**
- concurrent failed searches: **32 × fail-closed 500**
- fail-closed responses containing provider data: **0**
- concurrent AI-summary probe: **20 accepted, 5 rate-limited**
- outbox contention: **40 jobs completed once across 6 workers**

The live authenticated inbox portion was not run because no staging session
cookie was configured. The script is ready to run it when a staging test
account is available; concurrent inbox route behavior is covered
deterministically in the automated suite. The production smoke check validates
startup and the public root only; it does not replace a real browser flow
through OIDC, object storage, SMTP delivery, or admin approval.

## Database pool configuration reviewed

The server creates one shared Neon pool with:

- maximum connections: `DB_POOL_MAX`, default **20**
- idle timeout: `DB_IDLE_TIMEOUT_MS`, default **30 seconds**
- connection timeout: `DB_CONNECTION_TIMEOUT_MS`, default **2 seconds**

Invalid values fail during startup configuration validation. The load harness
treats any timeout, network error, or unexpected HTTP response as a failure and
exits non-zero.

## Full validation

Run the normal alpha gate after changing the harness or server:

```bash
npm run alpha:check
```