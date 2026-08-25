/**
 * Server-side tests — admin verification route access control.
 *
 * Confirms that:
 * 1. Unauthenticated requests to all admin verification endpoints return 401.
 * 2. Authenticated non-admin requests return 403.
 * 3. Authenticated admin requests succeed (approve / reject / list).
 * 4. Invalid provider IDs return 400.
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
    getUser: vi.fn(),
    getProvider: vi.fn(),
    updateProvider: vi.fn(),
    completeLicenseVerificationWithNotification: vi.fn(),
    getPendingLicenseVerifications: vi.fn(),
    createAuditLog: vi.fn(),
  },
}));

vi.mock("../server/services/email", () => ({
  sendLicenseApprovalEmail: vi.fn().mockResolvedValue(undefined),
  sendLicenseRejectionEmail: vi.fn().mockResolvedValue(undefined),
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
// Import after mocks
// ---------------------------------------------------------------------------

import { storage } from "../server/storage";
import { registerAdminRoutes } from "../server/routes/admin";

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  registerAdminRoutes(app);
  return app;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ADMIN_USER_ID = "user_admin";
const PROVIDER_USER_ID = "user_provider";
const PARENT_USER_ID = "user_parent";

function makeAdminUser() {
  return { id: ADMIN_USER_ID, role: "admin", email: "admin@example.com" };
}

function makeNonAdminUser(role = "provider") {
  return { id: PROVIDER_USER_ID, role, email: "provider@example.com" };
}

/** A provider in the pending-review queue. */
function makePendingProvider() {
  return {
    id: 1,
    name: "Sunshine Daycare",
    licenseStatus: "pending",
    licenseSubmittedAt: new Date().toISOString(),
    isProfileVisible: false,
    isVerified: false,
    userId: PROVIDER_USER_ID,
  };
}

// ---------------------------------------------------------------------------
// beforeEach — reset all mocks to a clean state
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(storage.getUser).mockReset();
  vi.mocked(storage.getProvider).mockReset();
  vi.mocked(storage.updateProvider).mockReset();
  vi.mocked(storage.completeLicenseVerificationWithNotification).mockReset();
  vi.mocked(storage.getPendingLicenseVerifications).mockReset();
  vi.mocked(storage.createAuditLog).mockReset();
});

// ===========================================================================
// GET /api/admin/verifications — list pending verifications
// ===========================================================================

describe("GET /api/admin/verifications — access control", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp()).get("/api/admin/verifications");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Unauthorized" });
  });

  it("returns 403 for an authenticated provider (non-admin)", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeNonAdminUser("provider") as any);

    const res = await request(buildApp())
      .get("/api/admin/verifications")
      .set("x-test-user", PROVIDER_USER_ID);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: /admin/i });
  });

  it("returns 403 for an authenticated parent (non-admin)", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeNonAdminUser("parent") as any);

    const res = await request(buildApp())
      .get("/api/admin/verifications")
      .set("x-test-user", PARENT_USER_ID);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: /admin/i });
  });

  it("returns 200 and the list for an authenticated admin", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeAdminUser() as any);
    vi.mocked(storage.getPendingLicenseVerifications).mockResolvedValue(
      [makePendingProvider()] as any
    );

    const res = await request(buildApp())
      .get("/api/admin/verifications")
      .set("x-test-user", ADMIN_USER_ID);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(storage.getPendingLicenseVerifications).toHaveBeenCalledOnce();
  });
});

// ===========================================================================
// POST /api/admin/verifications/:providerId/approve
// ===========================================================================

describe("POST /api/admin/verifications/:providerId/approve — access control", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp()).post("/api/admin/verifications/1/approve");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Unauthorized" });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 403 for an authenticated provider (non-admin)", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeNonAdminUser("provider") as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/approve")
      .set("x-test-user", PROVIDER_USER_ID);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: /admin/i });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 403 for an authenticated parent (non-admin)", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeNonAdminUser("parent") as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/approve")
      .set("x-test-user", PARENT_USER_ID);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: /admin/i });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-integer provider ID", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeAdminUser() as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/not-a-number/approve")
      .set("x-test-user", ADMIN_USER_ID);
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 404 when the provider does not exist", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeAdminUser() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/approve")
      .set("x-test-user", ADMIN_USER_ID);
    expect(res.status).toBe(404);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 200 and approves the license for an authenticated admin", async () => {
    const provider = makePendingProvider();
    const approved = {
      ...provider,
      licenseStatus: "confirmed",
      isProfileVisible: true,
      isVerified: true,
    };

    vi.mocked(storage.getUser).mockImplementation(async (id: string) => {
      if (id === ADMIN_USER_ID) return makeAdminUser() as any;
      // provider owner lookup for email notification
      return makeNonAdminUser() as any;
    });
    vi.mocked(storage.getProvider).mockResolvedValue(provider as any);
    vi.mocked(storage.completeLicenseVerificationWithNotification).mockResolvedValue(approved as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/approve")
      .set("x-test-user", ADMIN_USER_ID);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: /approved/i });
    expect(storage.completeLicenseVerificationWithNotification).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 1, outcome: "approved", actorUserId: ADMIN_USER_ID })
    );
  });
});

// ===========================================================================
// POST /api/admin/verifications/:providerId/reject
// ===========================================================================

describe("POST /api/admin/verifications/:providerId/reject — access control", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp())
      .post("/api/admin/verifications/1/reject")
      .send({ reason: "Missing documentation." });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Unauthorized" });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 403 for an authenticated provider (non-admin)", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeNonAdminUser("provider") as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/reject")
      .set("x-test-user", PROVIDER_USER_ID)
      .send({ reason: "Missing documentation." });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: /admin/i });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 403 for an authenticated parent (non-admin)", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeNonAdminUser("parent") as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/reject")
      .set("x-test-user", PARENT_USER_ID)
      .send({ reason: "Missing documentation." });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: /admin/i });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-integer provider ID", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeAdminUser() as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/not-a-number/reject")
      .set("x-test-user", ADMIN_USER_ID)
      .send({ reason: "Missing documentation." });
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 400 when the rejection reason is missing", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeAdminUser() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makePendingProvider() as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/reject")
      .set("x-test-user", ADMIN_USER_ID)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: /reason/i });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 400 when the rejection reason is an empty string", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeAdminUser() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makePendingProvider() as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/reject")
      .set("x-test-user", ADMIN_USER_ID)
      .send({ reason: "   " });
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 404 when the provider does not exist", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(makeAdminUser() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/reject")
      .set("x-test-user", ADMIN_USER_ID)
      .send({ reason: "Missing documentation." });
    expect(res.status).toBe(404);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 200 and rejects the license for an authenticated admin", async () => {
    const provider = makePendingProvider();
    const rejected = { ...provider, licenseStatus: "rejected", isProfileVisible: false };

    vi.mocked(storage.getUser).mockImplementation(async (id: string) => {
      if (id === ADMIN_USER_ID) return makeAdminUser() as any;
      return makeNonAdminUser() as any;
    });
    vi.mocked(storage.getProvider).mockResolvedValue(provider as any);
    vi.mocked(storage.completeLicenseVerificationWithNotification).mockResolvedValue(rejected as any);

    const res = await request(buildApp())
      .post("/api/admin/verifications/1/reject")
      .set("x-test-user", ADMIN_USER_ID)
      .send({ reason: "License number could not be verified." });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: /rejected/i });
    expect(storage.completeLicenseVerificationWithNotification).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 1, outcome: "rejected", actorUserId: ADMIN_USER_ID })
    );
  });
});
