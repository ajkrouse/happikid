/**
 * Server-side tests — PUT /api/providers/:id strips expired closedDates.
 *
 * Confirms that:
 * 1. Mixed expired + future entries → only future entries passed to storage.
 * 2. All entries expired → closedDates set to null before storage call.
 * 3. All entries future → all kept unchanged.
 * 4. closedDates absent from body → storage called without closedDates key interference.
 * 5. Invalid provider ID → 400.
 * 6. Provider owned by another user → 403.
 * 7. Unauthenticated request → 401.
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

function makeExistingProvider(overrides: Record<string, unknown> = {}) {
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
  vi.mocked(storage.getProvider).mockReset();
  vi.mocked(storage.updateProvider).mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PUT /api/providers/:id — expired closure filtering", () => {
  it("passes only future entries to storage when body has mixed expired and future closedDates", async () => {
    const existing = makeExistingProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(existing as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({ ...existing, closedDates: [FUTURE_ENTRY, FUTURE_ENTRY_2] } as any);

    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/42")
      .set("x-test-user", "user_owner")
      .send({ name: "Sunny Days Daycare", closedDates: [EXPIRED_ENTRY, FUTURE_ENTRY, EXPIRED_ENTRY_2, FUTURE_ENTRY_2] });

    expect(res.status).toBe(200);

    // Capture the data passed to storage.updateProvider
    const [, updateArg] = vi.mocked(storage.updateProvider).mock.calls[0];
    expect(updateArg.closedDates).toHaveLength(2);
    expect(updateArg.closedDates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: FUTURE_ENTRY.to }),
        expect.objectContaining({ to: FUTURE_ENTRY_2.to }),
      ])
    );
    // Expired entries must not reach storage
    expect(updateArg.closedDates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ to: EXPIRED_ENTRY.to })])
    );
    expect(updateArg.closedDates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ to: EXPIRED_ENTRY_2.to })])
    );
  });

  it("sets closedDates to null in the storage call when all entries are expired", async () => {
    const existing = makeExistingProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(existing as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({ ...existing, closedDates: null } as any);

    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/42")
      .set("x-test-user", "user_owner")
      .send({ name: "Sunny Days Daycare", closedDates: [EXPIRED_ENTRY, EXPIRED_ENTRY_2] });

    expect(res.status).toBe(200);

    const [, updateArg] = vi.mocked(storage.updateProvider).mock.calls[0];
    expect(updateArg.closedDates).toBeNull();
  });

  it("passes all entries unchanged to storage when all closedDates are in the future", async () => {
    const existing = makeExistingProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(existing as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({ ...existing, closedDates: [FUTURE_ENTRY, FUTURE_ENTRY_2] } as any);

    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/42")
      .set("x-test-user", "user_owner")
      .send({ name: "Sunny Days Daycare", closedDates: [FUTURE_ENTRY, FUTURE_ENTRY_2] });

    expect(res.status).toBe(200);

    const [, updateArg] = vi.mocked(storage.updateProvider).mock.calls[0];
    expect(updateArg.closedDates).toHaveLength(2);
    expect(updateArg.closedDates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: FUTURE_ENTRY.to }),
        expect.objectContaining({ to: FUTURE_ENTRY_2.to }),
      ])
    );
  });

  it("does not alter the storage call when closedDates is absent from the body", async () => {
    const existing = makeExistingProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(existing as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({ ...existing, name: "Updated Name" } as any);

    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/42")
      .set("x-test-user", "user_owner")
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);

    const [, updateArg] = vi.mocked(storage.updateProvider).mock.calls[0];
    // closedDates should not be present (undefined) — not forced to null
    expect(updateArg.closedDates).toBeUndefined();
  });

  it("returns 400 for a non-numeric provider ID", async () => {
    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/not-a-number")
      .set("x-test-user", "user_owner")
      .send({ name: "Test" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider id/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 403 when the provider belongs to a different user", async () => {
    const existing = makeExistingProvider({ userId: "other_user" });
    vi.mocked(storage.getProvider).mockResolvedValue(existing as any);

    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/42")
      .set("x-test-user", "user_owner")
      .send({ name: "Hijack attempt", closedDates: [FUTURE_ENTRY] });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/access denied/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/42")
      .send({ name: "Test" });

    expect(res.status).toBe(401);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });
});
