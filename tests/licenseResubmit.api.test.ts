/**
 * Server-side tests — provider license resubmission after rejection.
 *
 * Confirms that:
 * 1. A provider with licenseStatus "rejected" can call POST /api/providers/confirm-license
 *    and have their status reset to "pending" with a fresh licenseSubmittedAt.
 * 2. A provider with licenseStatus "pending" (not yet reviewed) can also re-call the
 *    endpoint (idempotent resubmit).
 * 3. An already-confirmed provider is not affected by a spurious confirm-license call.
 * 4. Unauthenticated requests are rejected with 401.
 * 5. A provider account that has no provider record gets 404.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module-level mocks — vi.mock is hoisted above imports by Vitest
// ---------------------------------------------------------------------------

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, res: any, next: any) => {
    const user = req.headers["x-test-user"];
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.user = { claims: { sub: user } };
    next();
  }),
  setupAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/storage", () => ({
  storage: {
    getProvidersByCanonicalOwner: vi.fn(),
    updateProvider: vi.fn(),
    getProviders: vi.fn(),
    getProvider: vi.fn(),
    getAfterSchoolTaxonomy: vi.fn(),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
    getProviderImages: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../server/intelligentSearch", () => ({
  intelligentSearch: vi.fn(),
}));

vi.mock("../server/services/aiSummaries", () => ({
  generateSearchSummary: vi.fn(),
}));

vi.mock("../server/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { storage } from "../server/storage";
import { registerProviderRoutes } from "../server/routes/providers";

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  registerProviderRoutes(app);
  return app;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROVIDER_USER_ID = "user_provider_001";

function makeProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    userId: PROVIDER_USER_ID,
    name: "Sunshine Daycare",
    licenseStatus: "rejected",
    licenseSubmittedAt: new Date("2026-07-01T09:00:00Z").toISOString(),
    isProfileVisible: false,
    isVerified: false,
    isActive: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(storage.getProvidersByCanonicalOwner).mockReset();
  vi.mocked(storage.updateProvider).mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/providers/confirm-license — resubmission after rejection", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp()).post("/api/providers/confirm-license");
    expect(res.status).toBe(401);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 404 when the authenticated user has no provider record", async () => {
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([]);

    const res = await request(buildApp())
      .post("/api/providers/confirm-license")
      .set("x-test-user", PROVIDER_USER_ID);

    expect(res.status).toBe(404);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("resets a rejected provider to pending with a fresh licenseSubmittedAt", async () => {
    const rejectedProvider = makeProvider({ licenseStatus: "rejected" });
    const resubmittedProvider = {
      ...rejectedProvider,
      licenseStatus: "pending",
      licenseSubmittedAt: new Date().toISOString(),
      isProfileVisible: false,
    };

    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([rejectedProvider] as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(resubmittedProvider as any);

    const before = Date.now();
    const res = await request(buildApp())
      .post("/api/providers/confirm-license")
      .set("x-test-user", PROVIDER_USER_ID);

    expect(res.status).toBe(200);
    expect(res.body.isPending).toBe(true);
    expect(res.body.provider.licenseStatus).toBe("pending");

    // updateProvider must have been called with licenseStatus "pending"
    // and a licenseSubmittedAt that is a Date (the route constructs one server-side)
    expect(storage.updateProvider).toHaveBeenCalledOnce();
    const [calledId, calledPatch] = vi.mocked(storage.updateProvider).mock.calls[0];
    expect(calledId).toBe(rejectedProvider.id);
    expect(calledPatch).toMatchObject({
      licenseStatus: "pending",
      isProfileVisible: false,
    });
    // licenseSubmittedAt must be a Date object set on or after the start of this test
    expect(calledPatch.licenseSubmittedAt).toBeInstanceOf(Date);
    expect((calledPatch.licenseSubmittedAt as Date).getTime()).toBeGreaterThanOrEqual(before);
  });

  it("does not update a provider that is already confirmed (no-op path)", async () => {
    const confirmedProvider = makeProvider({
      licenseStatus: "confirmed",
      licenseSubmittedAt: new Date("2026-06-01T10:00:00Z").toISOString(),
      isProfileVisible: true,
      isVerified: true,
    });

    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([confirmedProvider] as any);

    const res = await request(buildApp())
      .post("/api/providers/confirm-license")
      .set("x-test-user", PROVIDER_USER_ID);

    expect(res.status).toBe(200);
    expect(res.body.isPending).toBe(false);
    // The confirmed guard must fire — no DB write should happen
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("allows a pending-but-unreviewed provider to resubmit (refreshes licenseSubmittedAt)", async () => {
    // A provider who submitted once and then updated their info before review
    const pendingProvider = makeProvider({
      licenseStatus: "pending",
      licenseSubmittedAt: new Date("2026-07-15T08:00:00Z").toISOString(),
    });
    const refreshedProvider = {
      ...pendingProvider,
      licenseSubmittedAt: new Date().toISOString(),
    };

    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([pendingProvider] as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(refreshedProvider as any);

    const res = await request(buildApp())
      .post("/api/providers/confirm-license")
      .set("x-test-user", PROVIDER_USER_ID);

    expect(res.status).toBe(200);
    expect(res.body.isPending).toBe(true);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      pendingProvider.id,
      expect.objectContaining({ licenseStatus: "pending" })
    );
  });
});
