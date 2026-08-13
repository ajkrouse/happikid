/**
 * Server-side tests — GET /api/providers/mine strips expired closedDates.
 *
 * Confirms that:
 * 1. Mixed expired + future entries → only future entries returned.
 * 2. All entries expired → closedDates is an empty array.
 * 3. All entries future → all returned unchanged.
 * 4. closedDates: null → null preserved (not converted to []).
 * 5. No provider found → 404.
 * 6. Unauthenticated request → 401.
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

// Dates clearly in the past — expired regardless of when the test runs
const EXPIRED_ENTRY = { from: "2020-01-01", to: "2020-06-30", reason: "Old summer closure" };
const EXPIRED_ENTRY_2 = { from: "2019-12-01", to: "2019-12-31", reason: "Old holiday closure" };

// Dates clearly in the future — always future regardless of when the test runs
const FUTURE_ENTRY = { from: "2099-07-01", to: "2099-07-14", reason: "Summer camp break" };
const FUTURE_ENTRY_2 = { from: "2099-12-24", to: "2099-12-31", reason: "Winter break" };

function makeProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    userId: "user_owner",
    name: "Sunny Days Daycare",
    closedDates: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(storage.getProvidersByUserId).mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/providers/mine — expired closure filtering", () => {
  it("returns only future entries when the provider has both expired and future closedDates", async () => {
    const provider = makeProvider({
      closedDates: [EXPIRED_ENTRY, FUTURE_ENTRY, EXPIRED_ENTRY_2, FUTURE_ENTRY_2],
    });
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([provider] as any);

    const app = buildApp();
    const res = await request(app)
      .get("/api/providers/mine")
      .set("x-test-user", "user_owner");

    expect(res.status).toBe(200);
    expect(res.body.closedDates).toHaveLength(2);
    expect(res.body.closedDates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: FUTURE_ENTRY.to }),
        expect.objectContaining({ to: FUTURE_ENTRY_2.to }),
      ])
    );
    // Expired entries must not appear
    expect(res.body.closedDates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ to: EXPIRED_ENTRY.to })])
    );
    expect(res.body.closedDates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ to: EXPIRED_ENTRY_2.to })])
    );
  });

  it("returns an empty array when all closedDates entries are expired", async () => {
    const provider = makeProvider({ closedDates: [EXPIRED_ENTRY, EXPIRED_ENTRY_2] });
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([provider] as any);

    const app = buildApp();
    const res = await request(app)
      .get("/api/providers/mine")
      .set("x-test-user", "user_owner");

    expect(res.status).toBe(200);
    expect(res.body.closedDates).toEqual([]);
  });

  it("returns all entries unchanged when all closedDates entries are in the future", async () => {
    const provider = makeProvider({ closedDates: [FUTURE_ENTRY, FUTURE_ENTRY_2] });
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([provider] as any);

    const app = buildApp();
    const res = await request(app)
      .get("/api/providers/mine")
      .set("x-test-user", "user_owner");

    expect(res.status).toBe(200);
    expect(res.body.closedDates).toHaveLength(2);
    expect(res.body.closedDates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: FUTURE_ENTRY.to }),
        expect.objectContaining({ to: FUTURE_ENTRY_2.to }),
      ])
    );
  });

  it("preserves closedDates: null without converting it to an array", async () => {
    const provider = makeProvider({ closedDates: null });
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([provider] as any);

    const app = buildApp();
    const res = await request(app)
      .get("/api/providers/mine")
      .set("x-test-user", "user_owner");

    expect(res.status).toBe(200);
    expect(res.body.closedDates).toBeNull();
  });

  it("returns 404 when the authenticated user has no provider profile", async () => {
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([]);

    const app = buildApp();
    const res = await request(app)
      .get("/api/providers/mine")
      .set("x-test-user", "user_owner");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/no provider profile found/i) });
  });

  it("rejects unauthenticated requests with 401", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/providers/mine");

    expect(res.status).toBe(401);
    expect(storage.getProvidersByUserId).not.toHaveBeenCalled();
  });
});
