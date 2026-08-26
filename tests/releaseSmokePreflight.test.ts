import { describe, expect, it, vi } from "vitest";
import {
  runReleaseSmokePreflight,
  type ReleaseSmokeFetch,
} from "../scripts/release-smoke-preflight";
import { readAuthenticatedInboxCookie } from "../scripts/alpha-load-test";

const baseEnv = {
  RELEASE_SMOKE_ENV: "staging",
  RELEASE_SMOKE_BASE_URL: "https://staging.example.test",
  RELEASE_SMOKE_TEST_INBOX: "happikid-staging@example.test",
  RELEASE_SMOKE_PARENT_COOKIE: "parent-session",
  RELEASE_SMOKE_PROVIDER_COOKIE: "provider-session",
  RELEASE_SMOKE_ADMIN_COOKIE: "admin-session",
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

  it("rejects missing role sessions without exposing their values", async () => {
    const fetchImpl = vi.fn();
    const { RELEASE_SMOKE_PROVIDER_COOKIE: _ignored, ...missingProvider } = baseEnv;
    await expect(runReleaseSmokePreflight(missingProvider, fetchImpl)).rejects.toThrow(
      "RELEASE_SMOKE_PROVIDER_COOKIE is required",
    );
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