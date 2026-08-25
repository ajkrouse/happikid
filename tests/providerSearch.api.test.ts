import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((_req: any, _res: any, next: any) => next()),
}));

vi.mock("../server/storage", () => ({
  storage: {
    getProviders: vi.fn(),
    getProviderImages: vi.fn().mockResolvedValue([]),
    getProviderStats: vi.fn(),
  },
}));

vi.mock("../server/intelligentSearch", () => ({
  intelligentSearch: {
    parseQuery: vi.fn((search: string) => ({
      originalQuery: search,
      matchedTerms: [],
      confidence: 0,
      filters: { search },
      suggestions: [],
    })),
    explainParsing: vi.fn(() => ""),
  },
}));

vi.mock("../server/services/aiSummaries", () => ({
  generateSearchSummary: vi.fn(),
}));

vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));

import { storage } from "../server/storage";
import { registerProviderRoutes } from "../server/routes/providers";

function app() {
  const instance = express();
  instance.use(express.json());
  registerProviderRoutes(instance);
  return instance;
}

beforeEach(() => {
  vi.mocked(storage.getProviders).mockReset();
  vi.mocked(storage.getProviders).mockResolvedValue({
    providers: [],
    total: 0,
    verifiedPricingCount: 0,
  } as any);
});

describe("GET /api/providers search contract", () => {
  it("passes every visible filter, location, pagination and sort as typed values", async () => {
    const response = await request(app()).get("/api/providers").query({
      type: "daycare",
      borough: "Brooklyn",
      city: "Brooklyn",
      ageRange: "toddlers",
      features: "Yoga,Healthy meals",
      category: "arts",
      subcategory: "dance",
      priceRange: "1000-2000",
      acceptsSubsidies: "true",
      verifiedPricing: "true",
      enrollmentStatus: "accepting",
      openOn: "2026-09-01",
      lat: "40.6782",
      lng: "-73.9442",
      radius: "5",
      sortBy: "nearest",
      limit: "50",
      offset: "100",
    });

    expect(response.status).toBe(200);
    expect(storage.getProviders).toHaveBeenCalledWith(expect.objectContaining({
      type: "daycare",
      borough: "Brooklyn",
      city: "Brooklyn",
      ageRangeMin: 12,
      ageRangeMax: 36,
      features: ["Yoga", "Healthy meals"],
      category: "arts",
      subcategory: "dance",
      priceRange: "1000-2000",
      acceptsSubsidies: true,
      verifiedPricing: true,
      enrollmentStatus: "accepting",
      openOn: "2026-09-01",
      lat: 40.6782,
      lng: -73.9442,
      radius: 5,
      sortBy: "nearest",
      limit: 50,
      offset: 100,
      returnTotal: true,
    }));
  });

  it("keeps legacy cost links working by converting cost to a price range", async () => {
    const response = await request(app()).get("/api/providers").query({ cost: "3" });

    expect(response.status).toBe(200);
    expect(storage.getProviders).toHaveBeenCalledWith(expect.objectContaining({
      priceRange: "2000-3000",
      sortBy: "best-match",
    }));
  });

  it.each([
    { priceRange: "free" },
    { enrollmentStatus: "open" },
    { ageRangeMin: "12months" },
    { lat: "40.7" },
    { radius: "5" },
    { sortBy: "nearest" },
    { openOn: "2026-02-30" },
    { category: "arts" },
    { sortBy: "random" },
    { unexpected: "value" },
    { features: Array.from({ length: 51 }, (_, index) => `Feature ${index + 1}`).join(",") },
  ])("rejects malformed query %# with a controlled 400", async (query) => {
    const response = await request(app()).get("/api/providers").query(query);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ ok: false, message: "Invalid provider search parameters" });
    expect(storage.getProviders).not.toHaveBeenCalled();
  });

  it("returns a controlled error without a provider fallback when storage fails", async () => {
    vi.mocked(storage.getProviders).mockRejectedValueOnce(new Error("query failed"));

    const response = await request(app()).get("/api/providers").query({ sortBy: "newest" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ ok: false, message: "Failed to fetch providers" });
  });
});