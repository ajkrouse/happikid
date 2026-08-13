/**
 * Server-side tests — PATCH /api/providers/:id expired-closure cleanup.
 *
 * Confirms that the PATCH handler strips any closedDates entries whose `to`
 * date has already passed before calling storage.updateProvider, so expired
 * closures can never be re-persisted to the database.
 *
 * Covered scenarios:
 * 1. Mixed array (expired + future) → only future entries reach storage.
 * 2. All-expired array → closedDates is set to null (not []) before write.
 * 3. All-future array → entries pass through unchanged.
 * 4. closedDates absent from body → updateProvider is called without the field.
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
// Import after mocks
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
    closedDates: null,
    ...overrides,
  };
}

/** Returns an ISO date string offset by `days` from today (negative = past). */
function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function makeClosure(fromOffset: number, toOffset: number, reason = "Holiday") {
  return { from: isoDate(fromOffset), to: isoDate(toOffset), reason };
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

describe("PATCH /api/providers/:id — expired-closure cleanup", () => {
  it("strips expired entries and keeps only future entries before writing to storage", async () => {
    const stored = makeStoredProvider();
    const futureClosure = makeClosure(5, 10);
    const expiredClosure = makeClosure(-20, -5); // ended in the past

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({
      ...stored,
      closedDates: [futureClosure],
    } as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ closedDates: [expiredClosure, futureClosure] });

    expect(res.status).toBe(200);

    // storage.updateProvider must be called with only the future entry
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        closedDates: [futureClosure],
      })
    );

    // The expired entry must not appear in the stored payload
    const [[, updateArg]] = vi.mocked(storage.updateProvider).mock.calls;
    const stored_dates: any[] = updateArg.closedDates ?? [];
    expect(stored_dates).not.toContainEqual(expiredClosure);
  });

  it("sets closedDates to null (not an empty array) when every entry is expired", async () => {
    const stored = makeStoredProvider();
    const expiredA = makeClosure(-30, -20);
    const expiredB = makeClosure(-10, -1);

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({
      ...stored,
      closedDates: null,
    } as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ closedDates: [expiredA, expiredB] });

    expect(res.status).toBe(200);

    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ closedDates: null })
    );

    // Explicitly confirm it is null, not []
    const [[, updateArg]] = vi.mocked(storage.updateProvider).mock.calls;
    expect(updateArg.closedDates).toBeNull();
  });

  it("passes an all-future closedDates array through unchanged", async () => {
    const stored = makeStoredProvider();
    const futureA = makeClosure(1, 5);
    const futureB = makeClosure(10, 20);

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({
      ...stored,
      closedDates: [futureA, futureB],
    } as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ closedDates: [futureA, futureB] });

    expect(res.status).toBe(200);

    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ closedDates: [futureA, futureB] })
    );
  });

  it("does not include closedDates in the update payload when the field is absent from the request body", async () => {
    const stored = makeStoredProvider();
    const updated = { ...stored, name: "Renamed Provider" };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ name: "Renamed Provider" });

    expect(res.status).toBe(200);

    const [[, updateArg]] = vi.mocked(storage.updateProvider).mock.calls;
    // closedDates should not be present at all (not set to null by the handler)
    expect(updateArg).not.toHaveProperty("closedDates");
  });
});
