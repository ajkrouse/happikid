import { describe, expect, it, vi } from "vitest";
import {
  LIVE_TARGET_CONFIRMATION,
  runReleaseSmokePreflight,
  type ReleaseSmokeFetch,
} from "../scripts/release-smoke-preflight";
import { readAuthenticatedInboxCookie } from "../scripts/alpha-load-test";

const baseEnv = {
  RELEASE_SMOKE_ENV: "staging",
  RELEASE_SMOKE_BASE_URL: "https://staging.example.test",
  RELEASE_SMOKE_PRODUCTION_HOSTS: "happikid.com,happikid-ajkrouse.replit.app",
  RELEASE_SMOKE_TEST_INBOX: "happikid-staging@example.test",
  RELEASE_SMOKE_PARENT_COOKIE: "connect.sid=parent-session",
  RELEASE_SMOKE_PROVIDER_COOKIE: "connect.sid=provider-session",
  RELEASE_SMOKE_ADMIN_COOKIE: "connect.sid=admin-session",
};

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

function roleFetch(users: Record<string, string>): ReleaseSmokeFetch {
  return vi.fn(async (_input, init) => {
    const cookie = init?.headers?.Cookie;
    const role = Object.entries(baseEnv).find(
      ([key, value]) => key.endsWith("_COOKIE") && value === cookie,
    )?.[0]?.replace("RELEASE_SMOKE_", "").replace("_COOKIE", "").toLowerCase();
    return response({ role: users[role ?? ""] ?? role });
  });
}

describe("release smoke preflight", () => {
  it("checks all three distinct staging sessions and verifies their roles", async () => {
    const fetchImpl = roleFetch({
      parent: "parent",
      provider: "provider",
      admin: "admin",
    });

    await expect(runReleaseSmokePreflight(baseEnv, fetchImpl)).resolves.toMatchObject({
      baseUrl: "https://staging.example.test",
      testInboxConfigured: true,
      roles: { parent: "parent", provider: "provider", admin: "admin" },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("rejects non-staging targets before making network requests", async () => {
    const fetchImpl = vi.fn();
    await expect(
      runReleaseSmokePreflight({ ...baseEnv, RELEASE_SMOKE_ENV: "production" }, fetchImpl),
    ).rejects.toThrow('RELEASE_SMOKE_ENV must be exactly "staging"');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects non-HTTPS targets before making network requests", async () => {
    const fetchImpl = vi.fn();
    await expect(
      runReleaseSmokePreflight({ ...baseEnv, RELEASE_SMOKE_BASE_URL: "http://staging.example.test" }, fetchImpl),
    ).rejects.toThrow("must use HTTPS");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects the published production host before making network requests", async () => {
    const fetchImpl = vi.fn();
    await expect(
      runReleaseSmokePreflight({ ...baseEnv, RELEASE_SMOKE_BASE_URL: "https://happikid.com" }, fetchImpl),
    ).rejects.toThrow("must not target a production hostname in staging mode");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("allows the published host only in explicit live mode with exact confirmation", async () => {
    const fetchImpl = roleFetch({
      parent: "parent",
      provider: "provider",
      admin: "admin",
    });

    await expect(
      runReleaseSmokePreflight({
        ...baseEnv,
        RELEASE_SMOKE_ENV: "live",
        RELEASE_SMOKE_BASE_URL: "https://happikid-ajkrouse.replit.app",
        RELEASE_SMOKE_ALLOW_LIVE_TARGET: LIVE_TARGET_CONFIRMATION,
      }, fetchImpl),
    ).resolves.toMatchObject({
      baseUrl: "https://happikid-ajkrouse.replit.app",
      roles: { parent: "parent", provider: "provider", admin: "admin" },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("rejects live mode without the exact confirmation", async () => {
    const fetchImpl = vi.fn();
    await expect(
      runReleaseSmokePreflight({
        ...baseEnv,
        RELEASE_SMOKE_ENV: "live",
        RELEASE_SMOKE_BASE_URL: "https://happikid-ajkrouse.replit.app",
      }, fetchImpl),
    ).rejects.toThrow("requires RELEASE_SMOKE_ALLOW_LIVE_TARGET");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects live mode when pointed at a non-production hostname", async () => {
    const fetchImpl = vi.fn();
    await expect(
      runReleaseSmokePreflight({
        ...baseEnv,
        RELEASE_SMOKE_ENV: "live",
        RELEASE_SMOKE_ALLOW_LIVE_TARGET: LIVE_TARGET_CONFIRMATION,
      }, fetchImpl),
    ).rejects.toThrow("live mode requires RELEASE_SMOKE_BASE_URL to match a production hostname");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects missing role sessions without exposing their values", async () => {
    const fetchImpl = vi.fn();
    const { RELEASE_SMOKE_PROVIDER_COOKIE: _ignored, ...missingProvider } = baseEnv;
    await expect(runReleaseSmokePreflight(missingProvider, fetchImpl)).rejects.toThrow(
      "RELEASE_SMOKE_PROVIDER_COOKIE is required",
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a raw session value that is not a complete Cookie header value", async () => {
    const fetchImpl = vi.fn();
    await expect(
      runReleaseSmokePreflight({
        ...baseEnv,
        RELEASE_SMOKE_PARENT_COOKIE: "raw-session-without-cookie-name",
      }, fetchImpl),
    ).rejects.toThrow("must contain a complete cookie pair");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects reuse of one session across multiple roles", async () => {
    const fetchImpl = vi.fn();
    await expect(
      runReleaseSmokePreflight({
        ...baseEnv,
        RELEASE_SMOKE_ADMIN_COOKIE: baseEnv.RELEASE_SMOKE_PARENT_COOKIE,
      }, fetchImpl),
    ).rejects.toThrow("different staging session");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a session that resolves to the wrong role", async () => {
    const fetchImpl = roleFetch({ parent: "provider", provider: "provider", admin: "admin" });
    await expect(runReleaseSmokePreflight(baseEnv, fetchImpl)).rejects.toThrow(
      "parent staging session returned role provider",
    );
  });

  it("reports every rejected role in one run without returning cookie values", async () => {
    const fetchImpl: ReleaseSmokeFetch = vi.fn(async () => response({}, 401));
    const failure = runReleaseSmokePreflight(baseEnv, fetchImpl);
    await expect(failure).rejects.toThrow("parent staging session was rejected");
    await expect(failure).rejects.toThrow("provider staging session was rejected");
    await expect(failure).rejects.toThrow("admin staging session was rejected");
    await expect(failure).rejects.not.toThrow(baseEnv.RELEASE_SMOKE_PARENT_COOKIE);
  });

  it("uses the dedicated parent secret for the authenticated load when no override is supplied", () => {
    expect(readAuthenticatedInboxCookie({
      RELEASE_SMOKE_PARENT_COOKIE: "dedicated-parent-session",
    })).toBe("dedicated-parent-session");
  });

  it("keeps an explicit one-off load cookie as the higher-priority override", () => {
    expect(readAuthenticatedInboxCookie({
      LOAD_TEST_COOKIE: "approved-one-off-session",
      RELEASE_SMOKE_PARENT_COOKIE: "dedicated-parent-session",
    })).toBe("approved-one-off-session");
  });
});