/**
 * Server-side tests — admin license approval endpoint.
 *
 * Confirms that a single POST to the approve endpoint:
 * 1. Flips licenseStatus to "confirmed" and isProfileVisible to true.
 * 2. Queues a durable approval notification with the correct recipient email
 *    and providerId in the same storage operation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module-level mocks — hoisted above imports by Vitest
// ---------------------------------------------------------------------------

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, _res: any, next: any) => {
    const user = req.headers["x-test-user"];
    if (!user) return _res.status(401).json({ message: "Unauthorized" });
    req.user = { claims: { sub: user } };
    next();
  }),
  setupAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/storage", () => ({
  storage: {
    getUser: vi.fn(),
    getProvider: vi.fn(),
    completeLicenseVerificationWithNotification: vi.fn(),
    getPendingLicenseVerifications: vi.fn(),
  },
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

const ADMIN_USER_ID = "admin_user_123";
const PROVIDER_OWNER_ID = "provider_owner_456";
const CLAIMANT_OWNER_ID = "claimant_owner_789";

function makePendingProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    userId: PROVIDER_OWNER_ID,
    name: "Sunshine Daycare",
    licenseStatus: "pending",
    licenseSubmittedAt: new Date("2026-08-01T10:00:00Z"),
    isProfileVisible: false,
    isVerified: false,
    ...overrides,
  };
}

function makeAdminUser() {
  return {
    id: ADMIN_USER_ID,
    role: "admin",
    email: "admin@happikid.com",
    firstName: "Admin",
    lastName: "User",
  };
}

function makeOwnerUser() {
  return {
    id: PROVIDER_OWNER_ID,
    role: "provider",
    email: "owner@sunshine.com",
    firstName: "Jane",
    lastName: "Smith",
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(storage.getUser).mockReset();
  vi.mocked(storage.getProvider).mockReset();
  vi.mocked(storage.completeLicenseVerificationWithNotification).mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/admin/verifications/:providerId/approve", () => {
  it("sets licenseStatus to 'confirmed' and isProfileVisible to true in a single request", async () => {
    const pending = makePendingProvider();
    const updated = {
      ...pending,
      licenseStatus: "confirmed",
      licenseConfirmedAt: new Date(),
      isProfileVisible: true,
      isVerified: true,
    };

    vi.mocked(storage.getUser).mockImplementation(async (userId: string) => {
      if (userId === ADMIN_USER_ID) return makeAdminUser() as any;
      if (userId === PROVIDER_OWNER_ID) return makeOwnerUser() as any;
      return null;
    });
    vi.mocked(storage.getProvider).mockResolvedValue(pending as any);
    vi.mocked(storage.completeLicenseVerificationWithNotification).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .post(`/api/admin/verifications/${pending.id}/approve`)
      .set("x-test-user", ADMIN_USER_ID)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.provider.licenseStatus).toBe("confirmed");
    expect(res.body.provider.isProfileVisible).toBe(true);

    expect(storage.completeLicenseVerificationWithNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: pending.id,
        outcome: "approved",
      }),
    );
  });

  it("queues an approval notification with the owner's email and providerId", async () => {
    const pending = makePendingProvider();
    const owner = makeOwnerUser();
    const updated = {
      ...pending,
      licenseStatus: "confirmed",
      isProfileVisible: true,
      isVerified: true,
    };

    vi.mocked(storage.getUser).mockImplementation(async (userId: string) => {
      if (userId === ADMIN_USER_ID) return makeAdminUser() as any;
      if (userId === PROVIDER_OWNER_ID) return owner as any;
      return null;
    });
    vi.mocked(storage.getProvider).mockResolvedValue(pending as any);
    vi.mocked(storage.completeLicenseVerificationWithNotification).mockResolvedValue(updated as any);

    const res = await request(buildApp())
      .post(`/api/admin/verifications/${pending.id}/approve`)
      .set("x-test-user", ADMIN_USER_ID)
      .send();

    expect(res.status).toBe(200);
    expect(storage.completeLicenseVerificationWithNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: expect.objectContaining({
          eventType: "license_approved",
          payload: expect.objectContaining({ recipientEmail: owner.email, providerId: pending.id }),
        }),
      }),
    );
  });

  it("emails the claimant, not the former creator, for a claimed listing", async () => {
    const pending = makePendingProvider({
      userId: PROVIDER_OWNER_ID,
      ownerUserId: CLAIMANT_OWNER_ID,
    });
    const claimant = {
      id: CLAIMANT_OWNER_ID,
      role: "provider",
      email: "claimant@sunshine.com",
      firstName: "Current",
      lastName: "Owner",
    };
    vi.mocked(storage.getUser).mockImplementation(async (userId: string) => {
      if (userId === ADMIN_USER_ID) return makeAdminUser() as any;
      if (userId === CLAIMANT_OWNER_ID) return claimant as any;
      return null;
    });
    vi.mocked(storage.getProvider).mockResolvedValue(pending as any);
    vi.mocked(storage.completeLicenseVerificationWithNotification).mockResolvedValue({
      ...pending,
      licenseStatus: "confirmed",
      isProfileVisible: true,
      isVerified: true,
    } as any);

    const res = await request(buildApp())
      .post(`/api/admin/verifications/${pending.id}/approve`)
      .set("x-test-user", ADMIN_USER_ID)
      .send();

    expect(res.status).toBe(200);
    expect(storage.getUser).toHaveBeenCalledWith(CLAIMANT_OWNER_ID);
    expect(storage.getUser).not.toHaveBeenCalledWith(PROVIDER_OWNER_ID);
    expect(storage.completeLicenseVerificationWithNotification).toHaveBeenCalledWith(expect.objectContaining({
      notification: expect.objectContaining({
        payload: expect.objectContaining({ recipientEmail: claimant.email, providerId: pending.id }),
      }),
    }));
  });

  it("both the status update and the email happen in the same request (atomicity check)", async () => {
    const pending = makePendingProvider();
    const updated = {
      ...pending,
      licenseStatus: "confirmed",
      isProfileVisible: true,
      isVerified: true,
    };

    vi.mocked(storage.getUser).mockImplementation(async (userId: string) => {
      if (userId === ADMIN_USER_ID) return makeAdminUser() as any;
      if (userId === PROVIDER_OWNER_ID) return makeOwnerUser() as any;
      return null;
    });
    vi.mocked(storage.getProvider).mockResolvedValue(pending as any);
    vi.mocked(storage.completeLicenseVerificationWithNotification).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .post(`/api/admin/verifications/${pending.id}/approve`)
      .set("x-test-user", ADMIN_USER_ID)
      .send();

    expect(res.status).toBe(200);

    // One storage operation owns both the status write and the outbox enqueue.
    expect(storage.completeLicenseVerificationWithNotification).toHaveBeenCalledOnce();
    expect(storage.completeLicenseVerificationWithNotification).toHaveBeenCalledWith(
      expect.objectContaining({ notification: expect.any(Object) }),
    );
  });

  it("returns 409 when the provider is not in the pending-review queue", async () => {
    const notPending = makePendingProvider({
      licenseStatus: "confirmed",
      licenseSubmittedAt: new Date(),
    });

    vi.mocked(storage.getUser).mockImplementation(async (userId: string) => {
      if (userId === ADMIN_USER_ID) return makeAdminUser() as any;
      return null;
    });
    vi.mocked(storage.getProvider).mockResolvedValue(notPending as any);

    const app = buildApp();
    const res = await request(app)
      .post(`/api/admin/verifications/${notPending.id}/approve`)
      .set("x-test-user", ADMIN_USER_ID)
      .send();

    expect(res.status).toBe(409);
    expect(storage.completeLicenseVerificationWithNotification).not.toHaveBeenCalled();
  });

  it("returns 404 when the provider does not exist", async () => {
    vi.mocked(storage.getUser).mockImplementation(async (userId: string) => {
      if (userId === ADMIN_USER_ID) return makeAdminUser() as any;
      return null;
    });
    vi.mocked(storage.getProvider).mockResolvedValue(null as any);

    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/verifications/9999/approve")
      .set("x-test-user", ADMIN_USER_ID)
      .send();

    expect(res.status).toBe(404);
  });
});
