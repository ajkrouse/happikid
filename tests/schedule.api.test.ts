/**
 * Server-side tests — schedule field PATCH round-trip.
 *
 * Confirms that:
 * 1. PATCH /api/providers/:id with a valid schedule payload calls
 *    storage.updateProvider with the full schedule and returns it unchanged.
 * 2. PATCH with every day set to isOpen: false is stored without error.
 * 3. PATCH with an unexpected field inside a day entry returns 400.
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

const VALID_SCHEDULE = {
  monday:    { isOpen: true,  open: "07:00", close: "18:00" },
  tuesday:   { isOpen: true,  open: "07:30", close: "17:30" },
  wednesday: { isOpen: true,  open: "07:00", close: "18:00" },
  thursday:  { isOpen: true,  open: "07:00", close: "18:00" },
  friday:    { isOpen: true,  open: "07:00", close: "17:00" },
  saturday:  { isOpen: false, open: "09:00", close: "13:00" },
  sunday:    { isOpen: false, open: "09:00", close: "13:00" },
};

const ALL_CLOSED_SCHEDULE = Object.fromEntries(
  Object.keys(VALID_SCHEDULE).map((day) => [
    day,
    { isOpen: false, open: "07:00", close: "18:00" },
  ])
);

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

describe("PATCH /api/providers/:id — schedule field persistence", () => {
  it("persists a valid schedule and returns the full schedule unchanged", async () => {
    const stored = makeStoredProvider();
    const updated = { ...stored, schedule: VALID_SCHEDULE };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ schedule: VALID_SCHEDULE });

    expect(res.status).toBe(200);
    // The full schedule object must survive the round-trip without field loss
    expect(res.body.schedule).toEqual(VALID_SCHEDULE);

    // storage.updateProvider must receive the complete schedule payload
    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ schedule: VALID_SCHEDULE })
    );
  });

  it("persists a schedule where every day is set to isOpen: false without error", async () => {
    const stored = makeStoredProvider({ schedule: VALID_SCHEDULE });
    const updated = { ...stored, schedule: ALL_CLOSED_SCHEDULE };

    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(updated as any);

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ schedule: ALL_CLOSED_SCHEDULE });

    expect(res.status).toBe(200);
    // Every day must still be present and flagged as closed
    for (const day of Object.keys(ALL_CLOSED_SCHEDULE)) {
      expect(res.body.schedule[day].isOpen).toBe(false);
    }

    expect(storage.updateProvider).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ schedule: ALL_CLOSED_SCHEDULE })
    );
  });

  it("returns 400 when a day entry contains an unexpected field", async () => {
    const stored = makeStoredProvider();
    vi.mocked(storage.getProvider).mockResolvedValue(stored as any);

    const scheduleWithExtra = {
      ...VALID_SCHEDULE,
      monday: { isOpen: true, open: "07:00", close: "18:00", notes: "surprise" },
    };

    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/10")
      .set("x-test-user", "user_owner")
      .send({ schedule: scheduleWithExtra });

    expect(res.status).toBe(400);
    // storage must not be called when validation fails
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });
});
