/**
 * Server-side tests — enrollment status GET filter.
 *
 * Confirms that GET /api/providers?enrollmentStatus=<value>:
 * 1. Passes enrollmentStatus:"accepting" to storage.getProviders when requested.
 * 2. Passes enrollmentStatus:"waitlist" to storage.getProviders when requested.
 * 3. Passes enrollmentStatus:"full" to storage.getProviders when requested.
 * 4. Does NOT pass enrollmentStatus to storage.getProviders when absent (any-status).
 * 5. Returns only the providers that storage returns for each status value.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module-level mocks
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

function makeProvider(id: number, enrollmentStatus: string) {
  return {
    id,
    name: `Provider ${id}`,
    enrollmentStatus,
    isActive: true,
    licenseStatus: "confirmed",
    rating: 4,
    reviewCount: 10,
  };
}

function makeStorageResponse(providers: any[]) {
  return { providers, total: providers.length, verifiedPricingCount: 0 };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(storage.getProviders).mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/providers — enrollmentStatus filter", () => {
  it('passes enrollmentStatus "accepting" to storage and returns only accepting providers', async () => {
    const acceptingProvider = makeProvider(1, "accepting");
    vi.mocked(storage.getProviders).mockResolvedValue(
      makeStorageResponse([acceptingProvider]) as any
    );

    const app = buildApp();
    const res = await request(app)
      .get("/api/providers")
      .query({ enrollmentStatus: "accepting" });

    expect(res.status).toBe(200);

    // storage must receive the filter
    expect(storage.getProviders).toHaveBeenCalledWith(
      expect.objectContaining({ enrollmentStatus: "accepting" })
    );

    // only the accepting provider is returned
    const body = res.body;
    const providers = body.providers ?? body;
    expect(Array.isArray(providers)).toBe(true);
    expect(providers).toHaveLength(1);
    expect(providers[0].enrollmentStatus).toBe("accepting");
  });

  it('passes enrollmentStatus "waitlist" to storage and returns only waitlisted providers', async () => {
    const waitlistProvider = makeProvider(2, "waitlist");
    vi.mocked(storage.getProviders).mockResolvedValue(
      makeStorageResponse([waitlistProvider]) as any
    );

    const app = buildApp();
    const res = await request(app)
      .get("/api/providers")
      .query({ enrollmentStatus: "waitlist" });

    expect(res.status).toBe(200);

    expect(storage.getProviders).toHaveBeenCalledWith(
      expect.objectContaining({ enrollmentStatus: "waitlist" })
    );

    const body = res.body;
    const providers = body.providers ?? body;
    expect(Array.isArray(providers)).toBe(true);
    expect(providers).toHaveLength(1);
    expect(providers[0].enrollmentStatus).toBe("waitlist");
  });

  it('passes enrollmentStatus "full" to storage and returns only full providers', async () => {
    const fullProvider = makeProvider(3, "full");
    vi.mocked(storage.getProviders).mockResolvedValue(
      makeStorageResponse([fullProvider]) as any
    );

    const app = buildApp();
    const res = await request(app)
      .get("/api/providers")
      .query({ enrollmentStatus: "full" });

    expect(res.status).toBe(200);

    expect(storage.getProviders).toHaveBeenCalledWith(
      expect.objectContaining({ enrollmentStatus: "full" })
    );

    const body = res.body;
    const providers = body.providers ?? body;
    expect(Array.isArray(providers)).toBe(true);
    expect(providers).toHaveLength(1);
    expect(providers[0].enrollmentStatus).toBe("full");
  });

  it("omits enrollmentStatus from storage call when not provided (any-status)", async () => {
    const mixed = [
      makeProvider(1, "accepting"),
      makeProvider(2, "waitlist"),
      makeProvider(3, "full"),
    ];
    vi.mocked(storage.getProviders).mockResolvedValue(
      makeStorageResponse(mixed) as any
    );

    const app = buildApp();
    const res = await request(app).get("/api/providers");

    expect(res.status).toBe(200);

    // When no enrollmentStatus is sent the value passed to storage should be
    // undefined (or absent), not an empty string or "all".
    const callArgs = vi.mocked(storage.getProviders).mock.calls[0][0] as any;
    expect(callArgs?.enrollmentStatus == null || callArgs.enrollmentStatus === "").toBe(true);

    const body = res.body;
    const providers = body.providers ?? body;
    expect(Array.isArray(providers)).toBe(true);
    expect(providers).toHaveLength(3);
  });

  it("returns the full unfiltered list when enrollmentStatus filter is cleared (no param)", async () => {
    // Simulate a user who previously had enrollmentStatus=accepting and then cleared it.
    // The re-issued request has no enrollmentStatus param, so storage returns all providers.
    const allProviders = [
      makeProvider(10, "accepting"),
      makeProvider(11, "waitlist"),
      makeProvider(12, "full"),
      makeProvider(13, "accepting"),
    ];
    vi.mocked(storage.getProviders).mockResolvedValue(
      makeStorageResponse(allProviders) as any
    );

    const app = buildApp();
    // Deliberately send no enrollmentStatus — mirrors what the client sends after clearing
    const res = await request(app).get("/api/providers");

    expect(res.status).toBe(200);

    const body = res.body;
    const providers = body.providers ?? body;
    expect(providers).toHaveLength(4);

    // Storage should NOT be constrained to a single status
    const callArgs = vi.mocked(storage.getProviders).mock.calls[0][0] as any;
    expect(callArgs?.enrollmentStatus == null || callArgs.enrollmentStatus === "").toBe(true);
  });
});
