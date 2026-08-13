/**
 * Server-side tests — enrollment status PATCH round-trip.
 *
 * Confirms that:
 * 1. PATCH /api/providers/:id with enrollmentStatus "waitlist" persists and returns the value.
 * 2. PATCH /api/providers/:id with enrollmentStatus "full" persists and returns the value.
 * 3. A subsequent unrelated PATCH (e.g., updating name) does NOT overwrite a previously set
 *    enrollment status — the caller must send the field explicitly to change it.
 * 4. PATCH with an invalid enrollmentStatus value returns 400.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module-level mocks
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
    getProvider: vi.fn(),
    updateProvider: vi.fn(),
    getProviders: vi.fn(),
    getProvidersByUserId: vi.fn(),
    getProviderWithDetails: vi.fn(),
    trackProfileView: vi.fn().mockResolvedValue(undefined),
    getProviderStats: vi.fn(),
    getProviderImages: vi.fn(),
    addProviderImage: vi.fn(),
    getProviderScore: vi.fn(),
    updateProviderScore: vi.fn(),
    createProviderScore: vi.fn(),
    getSimilarProviderScores: vi.fn(),
    getProfileViewTrend: vi.fn(),
    getReviewsByProviderId: vi.fn(),
    getProviderReviews: vi.fn(),
    getProviderInquiries: vi.fn(),
    createProvider: vi.fn(),
    addProviderLocation: vi.fn(),
  },
}));

vi.mock("../server/intelligentSearch", () => ({
  intelligentSearch: {
    parseQuery: vi.fn(() => ({
      originalQuery: "",
      matchedTerms: [],
      confidence: 0,
      filters: {},
      suggestions: [],
    })),
    explainParsing: vi.fn(() => ""),
  },
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
// Helpers
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  registerProviderRoutes(app);
  return app;
}

function makeStoredProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 20,
    userId: "user_owner",
    name: "Enrollment Test Provider",
    closureNote: null,
    schedule: null,
    enrollmentStatus: "accepting",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(storage.getProvider).mockReset();
  vi.mocked(storage.updateProvider).mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PATCH /api/providers/:id — enrollmentStatus persistence", () => {
  it("persists enrollmentStatus 'waitlist' and returns it unchanged", async () => {
    const stored = makeStoredProvider({ enrollmentStatus: "accepting" });
    const updated = { ...stored, enrollmentStatus: "waitlist" };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/20")
      .set("x-test-user", "user_owner")
      .send({ enrollmentStatus: "waitlist" });

    expect(res.status).toBe(200);
    expect(res.body.enrollmentStatus).toBe("waitlist");
    expect(storage.updateProvider).toHaveBeenCalledWith(
      20,
      expect.objectContaining({ enrollmentStatus: "waitlist" })
    );
  });

  it("persists enrollmentStatus 'full' and returns it unchanged", async () => {
    const stored = makeStoredProvider({ enrollmentStatus: "accepting" });
    const updated = { ...stored, enrollmentStatus: "full" };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/20")
      .set("x-test-user", "user_owner")
      .send({ enrollmentStatus: "full" });

    expect(res.status).toBe(200);
    expect(res.body.enrollmentStatus).toBe("full");
    expect(storage.updateProvider).toHaveBeenCalledWith(
      20,
      expect.objectContaining({ enrollmentStatus: "full" })
    );
  });

  it("does not include enrollmentStatus in update when the field is not sent", async () => {
    // A PATCH that only changes the name must not send enrollmentStatus,
    // so the server-stored value is preserved via normal DB partial-update semantics.
    const stored = makeStoredProvider({ enrollmentStatus: "waitlist" });
    const updated = { ...stored, name: "Renamed Provider" };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/20")
      .set("x-test-user", "user_owner")
      .send({ name: "Renamed Provider" });

    expect(res.status).toBe(200);
    // The parsed payload must NOT contain enrollmentStatus because the client didn't send it
    const callArgs = vi.mocked(storage.updateProvider).mock.calls[0][1];
    expect(callArgs).not.toHaveProperty("enrollmentStatus");
  });

  it("returns 400 for an invalid enrollmentStatus value", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/20")
      .set("x-test-user", "user_owner")
      .send({ enrollmentStatus: "open_for_business" }); // not a valid enum value

    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });
});
