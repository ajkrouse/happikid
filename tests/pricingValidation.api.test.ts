/**
 * Server-side tests — pricing validation on PATCH /api/providers/:id.
 *
 * Confirms that the endpoint rejects invalid pricing payloads with a 400 response:
 * 1. Negative price value
 * 2. monthlyPriceMax less than monthlyPriceMin (inverted range)
 * 3. Non-numeric string price value
 * 4. Incomplete price range (only one of min/max supplied)
 *
 * Also confirms valid payloads are accepted and persisted correctly.
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
    getWeeklyViewSummary: vi.fn(),
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
    monthlyPrice: "500",
    monthlyPriceMin: null,
    monthlyPriceMax: null,
    showExactPrice: true,
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

describe("PATCH /api/providers/:id — pricing validation", () => {
  // ── Negative price ────────────────────────────────────────────────────────

  it("rejects a negative monthlyPrice with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPrice: -100 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects a negative monthlyPriceMin with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: -50, monthlyPriceMax: 800 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects a negative monthlyPriceMax with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: 200, monthlyPriceMax: -10 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  // ── Max < min (inverted range) ─────────────────────────────────────────────

  it("rejects monthlyPriceMax less than monthlyPriceMin with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: 1000, monthlyPriceMax: 500 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects monthlyPriceMax equal to zero when monthlyPriceMin is positive with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: 100, monthlyPriceMax: 0 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  // ── Non-numeric string ────────────────────────────────────────────────────

  it("rejects a non-numeric string monthlyPrice with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPrice: "not-a-number" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric string monthlyPriceMin with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: "free", monthlyPriceMax: 1000 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric string monthlyPriceMax with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: 500, monthlyPriceMax: "varies" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  // ── Incomplete price range (only one of min/max supplied) ─────────────────

  it("rejects monthlyPriceMin (numeric) without monthlyPriceMax with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: 500 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects monthlyPriceMax (numeric) without monthlyPriceMin with 400", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMax: 1000 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects monthlyPriceMin: null alone (would orphan the existing max) with 400", async () => {
    // A provider with an existing range: stored min=300, max=900.
    // Sending only { monthlyPriceMin: null } must be rejected — it would clear
    // min while leaving max intact, producing an incomplete range in the DB.
    const stored = makeStoredProvider({ monthlyPriceMin: "300", monthlyPriceMax: "900" });
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: null });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects monthlyPriceMax: null alone (would orphan the existing min) with 400", async () => {
    const stored = makeStoredProvider({ monthlyPriceMin: "300", monthlyPriceMax: "900" });
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMax: null });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects { monthlyPriceMin: null, monthlyPriceMax: 900 } — mixed null/numeric — with 400", async () => {
    const stored = makeStoredProvider({ monthlyPriceMin: "300", monthlyPriceMax: "900" });
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: null, monthlyPriceMax: 900 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects { monthlyPriceMin: 300, monthlyPriceMax: null } — mixed numeric/null — with 400", async () => {
    const stored = makeStoredProvider({ monthlyPriceMin: "300", monthlyPriceMax: "900" });
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: 300, monthlyPriceMax: null });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.stringMatching(/invalid provider data/i) });
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  // ── Valid payloads accepted ────────────────────────────────────────────────

  it("accepts a valid exact price (numeric)", async () => {
    const stored = makeStoredProvider();
    const updated = { ...stored, monthlyPrice: "750" };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPrice: 750 });

    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ monthlyPrice: "750" })
    );
  });

  it("accepts a valid exact price (numeric string)", async () => {
    const stored = makeStoredProvider();
    const updated = { ...stored, monthlyPrice: "750.50" };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPrice: "750.50" });

    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ monthlyPrice: "750.50" })
    );
  });

  it("accepts a valid price range where max equals min", async () => {
    const stored = makeStoredProvider();
    const updated = { ...stored, monthlyPriceMin: "500", monthlyPriceMax: "500" };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: 500, monthlyPriceMax: 500 });

    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ monthlyPriceMin: "500", monthlyPriceMax: "500" })
    );
  });

  it("accepts a valid price range where max is greater than min", async () => {
    const stored = makeStoredProvider();
    const updated = { ...stored, monthlyPriceMin: "300", monthlyPriceMax: "900" };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: 300, monthlyPriceMax: 900 });

    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ monthlyPriceMin: "300", monthlyPriceMax: "900" })
    );
  });

  it("accepts clearing price range by sending both as null", async () => {
    const stored = makeStoredProvider({ monthlyPriceMin: "300", monthlyPriceMax: "900" });
    const updated = { ...stored, monthlyPriceMin: null, monthlyPriceMax: null };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ monthlyPriceMin: null, monthlyPriceMax: null });

    expect(res.status).toBe(200);
  });
});
