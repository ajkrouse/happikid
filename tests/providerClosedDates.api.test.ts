/**
 * Server-side tests — expired closedDates filtering on the public provider endpoint.
 *
 * Confirms that GET /api/providers/:id:
 * 1. Strips expired closure entries (where `to` is before today) from the response.
 * 2. Returns future closure entries unchanged.
 * 3. Returns a mix of expired + future entries with only the future ones present.
 * 4. Returns an empty array (not null/undefined) when every entry is expired.
 * 5. Returns the provider unchanged when closedDates is null/absent.
 * 6. Returns 404 when the provider does not exist.
 * 7. Returns 400 for a non-integer provider ID.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by Vitest above imports)
// ---------------------------------------------------------------------------

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((_req: any, _res: any, next: any) => next()),
  setupAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/storage", () => ({
  storage: {
    getProvider: vi.fn(),
    getProviderWithDetails: vi.fn(),
    updateProvider: vi.fn(),
    getProviders: vi.fn(),
    getProvidersByUserId: vi.fn(),
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
// Imports (after mocks)
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

/** ISO date string offset from today by `days` (negative = past, positive = future). */
function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    userId: "user_owner",
    name: "Happy Kids Daycare",
    closedDates: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(storage.getProviderWithDetails).mockReset();
  vi.mocked(storage.trackProfileView).mockResolvedValue(undefined as any);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/providers/:id — expired closedDates filtering", () => {
  it("strips an expired closure entry and returns an empty closedDates array", async () => {
    const expiredEntry = { from: isoOffset(-30), to: isoOffset(-1), reason: "Past holiday" };
    vi.mocked(storage.getProviderWithDetails).mockResolvedValue(
      makeProvider({ closedDates: [expiredEntry] }) as any
    );

    const res = await request(buildApp()).get("/api/providers/42");

    expect(res.status).toBe(200);
    expect(res.body.closedDates).toEqual([]);
  });

  it("keeps a future closure entry in the response", async () => {
    const futureEntry = { from: isoOffset(10), to: isoOffset(20), reason: "Summer break" };
    vi.mocked(storage.getProviderWithDetails).mockResolvedValue(
      makeProvider({ closedDates: [futureEntry] }) as any
    );

    const res = await request(buildApp()).get("/api/providers/42");

    expect(res.status).toBe(200);
    expect(res.body.closedDates).toEqual([futureEntry]);
  });

  it("returns only future entries when mixed expired and future entries are present", async () => {
    const expiredEntry = { from: isoOffset(-60), to: isoOffset(-5), reason: "Last month closure" };
    const futureEntry  = { from: isoOffset(5),   to: isoOffset(15),  reason: "Upcoming break" };

    vi.mocked(storage.getProviderWithDetails).mockResolvedValue(
      makeProvider({ closedDates: [expiredEntry, futureEntry] }) as any
    );

    const res = await request(buildApp()).get("/api/providers/42");

    expect(res.status).toBe(200);
    expect(res.body.closedDates).toHaveLength(1);
    expect(res.body.closedDates[0]).toEqual(futureEntry);
  });

  it("returns an empty array when every closure entry is expired", async () => {
    const expired1 = { from: isoOffset(-90), to: isoOffset(-30), reason: "Old break 1" };
    const expired2 = { from: isoOffset(-20), to: isoOffset(-2),  reason: "Old break 2" };

    vi.mocked(storage.getProviderWithDetails).mockResolvedValue(
      makeProvider({ closedDates: [expired1, expired2] }) as any
    );

    const res = await request(buildApp()).get("/api/providers/42");

    expect(res.status).toBe(200);
    expect(res.body.closedDates).toEqual([]);
  });

  it("treats a closure whose `to` date is today as non-expired (still shown)", async () => {
    const today = isoOffset(0); // exactly today
    const todayEntry = { from: today, to: today, reason: "Closing today" };

    vi.mocked(storage.getProviderWithDetails).mockResolvedValue(
      makeProvider({ closedDates: [todayEntry] }) as any
    );

    const res = await request(buildApp()).get("/api/providers/42");

    expect(res.status).toBe(200);
    // today >= todayIso → must NOT be stripped
    expect(res.body.closedDates).toEqual([todayEntry]);
  });

  it("returns closedDates as null when the stored value is null", async () => {
    vi.mocked(storage.getProviderWithDetails).mockResolvedValue(
      makeProvider({ closedDates: null }) as any
    );

    const res = await request(buildApp()).get("/api/providers/42");

    expect(res.status).toBe(200);
    expect(res.body.closedDates).toBeNull();
  });

  it("returns 404 when the provider does not exist", async () => {
    vi.mocked(storage.getProviderWithDetails).mockResolvedValue(undefined as any);

    const res = await request(buildApp()).get("/api/providers/99");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/not found/i) });
  });

  it("returns 400 for a non-integer provider ID", async () => {
    const res = await request(buildApp()).get("/api/providers/not-a-number");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider id/i) });
  });
});
