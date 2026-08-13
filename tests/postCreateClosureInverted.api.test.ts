/**
 * Server-side tests — POST /api/providers (create branch) strips inverted closedDates.
 *
 * Confirms that when the authenticated user has NO existing provider, the POST
 * create-or-update handler (existingProviders.length === 0):
 * 1. Inverted entry (to < from) mixed with valid entries → only valid entries passed to storage.
 * 2. All entries inverted → closedDates set to null before storage call.
 * 3. All entries valid (from <= to) → all kept unchanged.
 * 4. closedDates absent from body → storage called without closedDates interference.
 * 5. Unauthenticated request → 401.
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

// Valid closure — from is before to
const VALID_ENTRY = { from: "2099-07-01", to: "2099-07-14", reason: "Summer camp break" };
const VALID_ENTRY_2 = { from: "2099-12-24", to: "2099-12-31", reason: "Winter break" };

// Inverted closures — to is before from (invalid)
const INVERTED_ENTRY = { from: "2099-06-30", to: "2099-06-01", reason: "Bad date range" };
const INVERTED_ENTRY_2 = { from: "2099-11-15", to: "2099-11-01", reason: "Another bad range" };

// Minimum required body fields so insertProviderSchema.parse() does not 400
const REQUIRED_FIELDS = {
  name: "Rainbow Kids Center",
  address: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  monthlyPrice: 1000,
};

function makeCreatedProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 99,
    userId: "user_new",
    name: "Rainbow Kids Center",
    type: "daycare",
    borough: "",
    closedDates: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(storage.getProvidersByUserId).mockReset();
  vi.mocked(storage.createProvider).mockReset();
  vi.mocked(storage.addProviderLocation).mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/providers (create branch) — inverted closure filtering", () => {
  it("passes only valid entries to storage when body has mixed inverted and valid closedDates", async () => {
    // No existing provider → triggers create branch
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([] as any);
    vi.mocked(storage.createProvider).mockResolvedValue(
      makeCreatedProvider({ closedDates: [VALID_ENTRY, VALID_ENTRY_2] }) as any
    );

    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set("x-test-user", "user_new")
      .send({
        ...REQUIRED_FIELDS,
        closedDates: [INVERTED_ENTRY, VALID_ENTRY, INVERTED_ENTRY_2, VALID_ENTRY_2],
      });

    expect(res.status).toBe(201);

    // Capture the data passed to storage.createProvider
    const [createArg] = vi.mocked(storage.createProvider).mock.calls[0];
    expect(createArg.closedDates).toHaveLength(2);
    expect(createArg.closedDates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: VALID_ENTRY.to }),
        expect.objectContaining({ to: VALID_ENTRY_2.to }),
      ])
    );
    // Inverted entries must not reach storage
    expect(createArg.closedDates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ to: INVERTED_ENTRY.to })])
    );
    expect(createArg.closedDates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ to: INVERTED_ENTRY_2.to })])
    );
  });

  it("sets closedDates to null in the storage call when all entries are inverted", async () => {
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([] as any);
    vi.mocked(storage.createProvider).mockResolvedValue(
      makeCreatedProvider({ closedDates: null }) as any
    );

    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set("x-test-user", "user_new")
      .send({
        ...REQUIRED_FIELDS,
        closedDates: [INVERTED_ENTRY, INVERTED_ENTRY_2],
      });

    expect(res.status).toBe(201);

    const [createArg] = vi.mocked(storage.createProvider).mock.calls[0];
    expect(createArg.closedDates).toBeNull();
  });

  it("passes all entries unchanged to storage when all closedDates are valid", async () => {
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([] as any);
    vi.mocked(storage.createProvider).mockResolvedValue(
      makeCreatedProvider({ closedDates: [VALID_ENTRY, VALID_ENTRY_2] }) as any
    );

    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set("x-test-user", "user_new")
      .send({
        ...REQUIRED_FIELDS,
        closedDates: [VALID_ENTRY, VALID_ENTRY_2],
      });

    expect(res.status).toBe(201);

    const [createArg] = vi.mocked(storage.createProvider).mock.calls[0];
    expect(createArg.closedDates).toHaveLength(2);
    expect(createArg.closedDates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: VALID_ENTRY.to }),
        expect.objectContaining({ to: VALID_ENTRY_2.to }),
      ])
    );
  });

  it("accepts a same-day closure where from equals to (boundary: valid)", async () => {
    const SAME_DAY_ENTRY = { from: "2099-08-15", to: "2099-08-15", reason: "Staff training day" };
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([] as any);
    vi.mocked(storage.createProvider).mockResolvedValue(
      makeCreatedProvider({ closedDates: [SAME_DAY_ENTRY] }) as any
    );

    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set("x-test-user", "user_new")
      .send({ ...REQUIRED_FIELDS, closedDates: [SAME_DAY_ENTRY] });

    expect(res.status).toBe(201);

    const [createArg] = vi.mocked(storage.createProvider).mock.calls[0];
    expect(createArg.closedDates).toHaveLength(1);
    expect(createArg.closedDates[0].to).toBe(SAME_DAY_ENTRY.to);
  });

  it("does not alter the storage call when closedDates is absent from the body", async () => {
    vi.mocked(storage.getProvidersByUserId).mockResolvedValue([] as any);
    vi.mocked(storage.createProvider).mockResolvedValue(
      makeCreatedProvider() as any
    );

    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set("x-test-user", "user_new")
      .send({ ...REQUIRED_FIELDS });

    expect(res.status).toBe(201);

    const [createArg] = vi.mocked(storage.createProvider).mock.calls[0];
    // closedDates should not be present (undefined) — not forced to null
    expect(createArg.closedDates).toBeUndefined();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .send({ name: "Test" });

    expect(res.status).toBe(401);
    expect(storage.createProvider).not.toHaveBeenCalled();
  });
});
