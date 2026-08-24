/**
 * Server-side tests — closure note PATCH round-trip.
 *
 * Confirms that:
 * 1. PATCH /api/providers/:id with a closureNote value calls storage.updateProvider
 *    with that value and returns it in the response.
 * 2. PATCH with closureNote: null passes null through correctly.
 * 3. The endpoint rejects unauthenticated requests (401).
 * 4. The endpoint rejects a non-integer provider ID (400).
 * 5. The endpoint rejects access by a different user (403).
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
    getProvider: vi.fn(),
    updateProvider: vi.fn(),
    // Stubs for routes used elsewhere (not exercised here)
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
// Import after mocks so they are applied before module evaluation
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

function makeStoredProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    userId: "user_owner",
    name: "Test Provider",
    closureNote: null,
    schedule: null,
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

describe("PATCH /api/providers/:id — closure note persistence", () => {
  it("persists a closureNote string and returns it in the response", async () => {
    const stored = makeStoredProvider();
    const updated = { ...stored, closureNote: "Closed Dec 24–Jan 1 for winter break." };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ closureNote: "Closed Dec 24–Jan 1 for winter break." });

    expect(res.status).toBe(200);
    expect(res.body.closureNote).toBe("Closed Dec 24–Jan 1 for winter break.");

    // Confirm storage was called with the closure note
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ closureNote: "Closed Dec 24–Jan 1 for winter break." })
    );
  });

  it("persists closureNote: null (clearing an existing note)", async () => {
    const stored = makeStoredProvider({ closureNote: "Old closure note." });
    const updated = { ...stored, closureNote: null };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ closureNote: null });

    expect(res.status).toBe(200);
    expect(res.body.closureNote).toBeNull();

    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ closureNote: null })
    );
  });

  it("rejects unauthenticated requests with 401", async () => {
    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .send({ closureNote: "Some note" });
    // No x-test-user header → middleware returns 401
    expect(res.status).toBe(401);
  });

  it("rejects a non-integer provider ID with 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/not-a-number")
      .set("x-test-user", "user_owner")
      .send({ closureNote: "Some note" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider id/i) });
  });

  it("returns 403 when the authenticated user does not own the provider", async () => {
    const stored = makeStoredProvider({ userId: "user_owner" });
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_intruder") // different user
      .send({ closureNote: "Malicious note" });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/access denied/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("does not call updateProvider when the provider is not found", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(undefined as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ closureNote: "Note" });

    // provider not found → userId check fails (undefined !== userId) → 403
    expect(res.status).toBe(403);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects a closureNote exceeding 500 characters with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const overlong = "x".repeat(501);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ closureNote: overlong });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("accepts a closureNote of exactly 500 characters", async () => {
    const stored = makeStoredProvider();
    const note500 = "a".repeat(500);
    const updated = { ...stored, closureNote: note500 };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ closureNote: note500 });

    expect(res.status).toBe(200);
    expect(res.body.closureNote).toBe(note500);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ closureNote: note500 })
    );
  });
});

// ---------------------------------------------------------------------------
// Closed-dates reason length validation
// ---------------------------------------------------------------------------

describe("PATCH /api/providers/:id — closedDates reason length", () => {
  it("rejects overlapping closedDates ranges before they reach storage", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(makeStoredProvider() as any);

    const res = await request(buildApp())
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({
        closedDates: [
          { from: "2026-12-20", to: "2026-12-24" },
          { from: "2026-12-24", to: "2026-12-27" },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("accepts adjacent, non-overlapping closedDates ranges", async () => {
    const stored = makeStoredProvider();
    const closedDates = [
      { from: "2026-12-20", to: "2026-12-24" },
      { from: "2026-12-25", to: "2026-12-27" },
    ];
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({ ...stored, closedDates } as any);

    const res = await request(buildApp())
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ closedDates });

    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ closedDates }),
    );
  });

  it("rejects a closedDates entry whose reason exceeds 200 characters with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const overlongReason = "r".repeat(201);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({
        closedDates: [
          { from: "2026-12-24", to: "2026-12-26", reason: overlongReason },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("accepts a closedDates entry whose reason is exactly 200 characters", async () => {
    const stored = makeStoredProvider();
    const reason200 = "r".repeat(200);
    const updated = {
      ...stored,
      closedDates: [{ from: "2026-12-24", to: "2026-12-26", reason: reason200 }],
    };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({
        closedDates: [
          { from: "2026-12-24", to: "2026-12-26", reason: reason200 },
        ],
      });

    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        closedDates: expect.arrayContaining([
          expect.objectContaining({ reason: reason200 }),
        ]),
      })
    );
  });

  it("rejects when any one entry in closedDates has an overlong reason", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({
        closedDates: [
          { from: "2026-12-20", to: "2026-12-21", reason: "Short reason" },
          { from: "2026-12-24", to: "2026-12-26", reason: "z".repeat(201) },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("accepts closedDates entries with no reason field", async () => {
    const stored = makeStoredProvider();
    const updated = {
      ...stored,
      closedDates: [{ from: "2026-12-24", to: "2026-12-26" }],
    };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({
        closedDates: [{ from: "2026-12-24", to: "2026-12-26" }],
      });

    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// PUT /api/providers/:id — closedDates reason length validation
// ---------------------------------------------------------------------------

describe("PUT /api/providers/:id — closedDates reason length", () => {
  it("rejects a closedDates entry whose reason exceeds 200 characters with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const overlongReason = "r".repeat(201);

    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({
        closedDates: [
          { from: "2026-12-24", to: "2026-12-26", reason: overlongReason },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("accepts a closedDates entry whose reason is exactly 200 characters via PUT", async () => {
    const stored = makeStoredProvider();
    const reason200 = "r".repeat(200);
    const updated = {
      ...stored,
      closedDates: [{ from: "2026-12-24", to: "2026-12-26", reason: reason200 }],
    };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({
        closedDates: [
          { from: "2026-12-24", to: "2026-12-26", reason: reason200 },
        ],
      });

    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        closedDates: expect.arrayContaining([
          expect.objectContaining({ reason: reason200 }),
        ]),
      })
    );
  });
});
