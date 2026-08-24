/**
 * Sprint 0 public-provider access regression tests.
 *
 * These checks keep unpublished provider records private, make claim ownership
 * authoritative, and ensure a search storage failure fails closed.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, res: any, next: any) => {
    const userId = req.headers["x-test-user"];
    if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
    req.user = { claims: { sub: userId } };
    next();
  }),
  setupAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/storage", () => ({
  storage: {
    getProviders: vi.fn(),
    getProvider: vi.fn(),
    getProviderWithDetails: vi.fn(),
    updateProvider: vi.fn(),
    getProvidersByCanonicalOwner: vi.fn(),
    getProviderStats: vi.fn(),
    trackProfileView: vi.fn().mockResolvedValue(undefined),
    getProviderImages: vi.fn(),
    addProviderImage: vi.fn(),
    getProviderScore: vi.fn(),
    updateProviderScore: vi.fn(),
    createProviderScore: vi.fn(),
    getProviderReviews: vi.fn(),
    getReviewsByProviderId: vi.fn(),
    createReview: vi.fn(),
    getProviderInquiries: vi.fn(),
    createProvider: vi.fn(),
    addProviderLocation: vi.fn(),
    getProviderUpdates: vi.fn(),
    createProviderUpdate: vi.fn(),
    getProviderPhotos: vi.fn(),
    createProviderPhoto: vi.fn(),
    getOrCreateThread: vi.fn(),
    createThreadMessage: vi.fn(),
    getUser: vi.fn(),
    getThread: vi.fn(),
    getThreadMessages: vi.fn(),
    markThreadMessagesRead: vi.fn(),
    getThreadsForUser: vi.fn(),
    getThreadsByProviderId: vi.fn(),
    getProvidersByCanonicalOwner: vi.fn(),
    createTourRequest: vi.fn(),
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
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { storage } from "../server/storage";
import { registerProviderRoutes } from "../server/routes/providers";
import { registerReviewRoutes } from "../server/routes/reviews";
import { registerThreadRoutes } from "../server/routes/threads";
import { registerTourRequestRoutes } from "../server/routes/tourRequests";

function buildApp() {
  const app = express();
  app.use(express.json());
  registerProviderRoutes(app);
  registerReviewRoutes(app);
  registerThreadRoutes(app);
  registerTourRequestRoutes(app);
  return app;
}

function publicProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    name: "Safe Kids Center",
    userId: "former-owner",
    ownerUserId: "current-claimant",
    isActive: true,
    licenseStatus: "confirmed",
    isProfileVisible: true,
    isProfilePublic: true,
    showExactPrice: true,
    images: [],
    reviews: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(storage.trackProfileView).mockResolvedValue(undefined as any);
});

describe("public provider visibility", () => {
  it.each([
    ["inactive", { isActive: false }],
    ["pending", { licenseStatus: "pending" }],
    ["rejected", { licenseStatus: "rejected", isProfileVisible: false }],
    ["hidden", { isProfileVisible: false }],
    ["unpublished", { isProfilePublic: false }],
  ])("returns 404 to an unauthenticated visitor for an %s provider", async (_state, overrides) => {
    vi.mocked(storage.getProviderWithDetails).mockResolvedValue(
      publicProvider(overrides) as any,
    );

    const res = await request(buildApp()).get("/api/providers/7");

    expect(res.status).toBe(404);
    expect(storage.trackProfileView).not.toHaveBeenCalled();
  });

  it("blocks private providers from receiving messages or tour requests", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(
      publicProvider({ isProfileVisible: false }) as any,
    );
    vi.mocked(storage.getUser).mockResolvedValue({ id: "parent", role: "parent" } as any);
    const app = buildApp();

    const [message, tour] = await Promise.all([
      request(app)
        .post("/api/threads")
        .set("x-test-user", "parent")
        .send({ providerId: 7, body: "Is there availability?" }),
      request(app)
        .post("/api/providers/7/tour-requests")
        .set("x-test-user", "parent")
        .send({ providerId: 7, preferredDates: ["2026-09-10"], preferredTime: "morning" }),
    ]);

    expect(message.status).toBe(404);
    expect(tour.status).toBe(404);
    expect(storage.getOrCreateThread).not.toHaveBeenCalled();
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
    expect(storage.createTourRequest).not.toHaveBeenCalled();
  });

  it("blocks public review, update, and photo routes for a private provider", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(
      publicProvider({ isProfileVisible: false }) as any,
    );
    const app = buildApp();

    const [reviews, updates, photos, suggestUpdate, contributePhoto] = await Promise.all([
      request(app).get("/api/providers/7/reviews"),
      request(app).get("/api/providers/7/updates"),
      request(app).get("/api/providers/7/user-photos"),
      request(app).post("/api/providers/7/suggest-update").set("x-test-user", "parent").send({}),
      request(app).post("/api/providers/7/contribute-photo").set("x-test-user", "parent").send({}),
    ]);

    for (const response of [reviews, updates, photos, suggestUpdate, contributePhoto]) {
      expect(response.status).toBe(404);
    }
    expect(storage.getReviewsByProviderId).not.toHaveBeenCalled();
    expect(storage.getProviderUpdates).not.toHaveBeenCalled();
    expect(storage.getProviderPhotos).not.toHaveBeenCalled();
  });

  it("redacts contributor and moderation data from public reviews, updates, and photos", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(publicProvider() as any);
    vi.mocked(storage.getReviewsByProviderId).mockResolvedValue([{
      id: 1, userId: "reviewer-private-id", rating: 5, title: "Great", content: "Wonderful",
      isVerified: true, createdAt: new Date(), updatedAt: new Date(),
    }] as any);
    vi.mocked(storage.getProviderUpdates).mockResolvedValue([{
      id: 2, userId: "contributor-private-id", providerId: 7, updateType: "hours",
      field: "hoursOpen", oldValue: "9", newValue: "8", reason: "private note",
      status: "approved", moderatorId: "moderator-id", moderatorNotes: "private note",
      createdAt: new Date(),
    }, {
      id: 3, userId: "another-user", providerId: 7, updateType: "hours",
      field: "hoursOpen", newValue: "7", status: "pending", createdAt: new Date(),
    }] as any);
    vi.mocked(storage.getProviderPhotos).mockResolvedValue([{
      id: 4, userId: "contributor-private-id", providerId: 7, imageUrl: "https://example.com/photo.jpg",
      caption: "Playground", photoType: "playground", status: "approved",
      moderatorId: "moderator-id", moderatorNotes: "private note", createdAt: new Date(),
    }] as any);
    const app = buildApp();

    const [reviews, updates, photos] = await Promise.all([
      request(app).get("/api/providers/7/reviews"),
      request(app).get("/api/providers/7/updates"),
      request(app).get("/api/providers/7/user-photos"),
    ]);

    expect(reviews.body[0]).not.toHaveProperty("userId");
    expect(reviews.body[0]).not.toHaveProperty("isVerified");
    expect(updates.body).toHaveLength(1);
    expect(updates.body[0]).not.toHaveProperty("userId");
    expect(updates.body[0]).not.toHaveProperty("moderatorId");
    expect(updates.body[0]).not.toHaveProperty("moderatorNotes");
    expect(updates.body[0]).not.toHaveProperty("reason");
    expect(photos.body[0]).not.toHaveProperty("userId");
    expect(photos.body[0]).not.toHaveProperty("moderatorId");
    expect(photos.body[0]).not.toHaveProperty("moderatorNotes");
  });

  it("returns a whitelisted provider detail DTO rather than internal provider fields", async () => {
    vi.mocked(storage.getProviderWithDetails).mockResolvedValue(
      publicProvider({
        licenseNumber: "PRIVATE-LICENSE",
        verificationPayload: { governmentId: "do-not-leak" },
        internalNotes: "do-not-leak",
      }) as any,
    );

    const res = await request(buildApp()).get("/api/providers/7");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 7, name: "Safe Kids Center" });
    expect(res.body.isVerified).toBe(true);
    expect(res.body).not.toHaveProperty("userId");
    expect(res.body).not.toHaveProperty("ownerUserId");
    expect(res.body).not.toHaveProperty("licenseNumber");
    expect(res.body).not.toHaveProperty("licenseStatus");
    expect(res.body).not.toHaveProperty("verificationPayload");
    expect(res.body).not.toHaveProperty("internalNotes");
  });

  it("preserves the public verified badge on provider search results", async () => {
    vi.mocked(storage.getProviders).mockResolvedValue([
      publicProvider({ isVerified: true }),
    ] as any);

    const res = await request(buildApp()).get("/api/providers");

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ id: 7, isVerified: true });
    expect(res.body[0]).not.toHaveProperty("licenseStatus");
  });
});

describe("claimed provider ownership", () => {
  it("blocks the former creator from editing a claimed provider", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(publicProvider() as any);

    const res = await request(buildApp())
      .patch("/api/providers/7")
      .set("x-test-user", "former-owner")
      .send({ name: "Attempted takeover" });

    expect(res.status).toBe(403);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("allows the current claimant to edit their claimed provider", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(publicProvider() as any);
    vi.mocked(storage.updateProvider).mockResolvedValue(
      publicProvider({ name: "Updated by claimant" }) as any,
    );

    const res = await request(buildApp())
      .patch("/api/providers/7")
      .set("x-test-user", "current-claimant")
      .send({ name: "Updated by claimant" });

    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(7, expect.objectContaining({
      name: "Updated by claimant",
    }));
  });
});

describe("review integrity", () => {
  it("returns a conflict when a parent submits a second review for the same provider", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(publicProvider() as any);
    vi.mocked(storage.createReview).mockRejectedValue({ cause: { code: "23505" } });

    const res = await request(buildApp())
      .post("/api/providers/7/reviews")
      .set("x-test-user", "parent")
      .send({ rating: 5, title: "Great care", content: "My child had a great experience." });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      ok: false,
      message: expect.stringMatching(/already reviewed/i),
    });
  });

  it("rejects an out-of-range review rating before it reaches storage", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(publicProvider() as any);

    const res = await request(buildApp())
      .post("/api/providers/7/reviews")
      .set("x-test-user", "parent")
      .send({ rating: 0, title: "Invalid rating" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ ok: false, message: expect.stringMatching(/invalid review data/i) });
    expect(storage.createReview).not.toHaveBeenCalled();
  });

  it("maps a database review check violation to a stable client error", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(publicProvider() as any);
    vi.mocked(storage.createReview).mockRejectedValue({ cause: { code: "23514" } });

    const res = await request(buildApp())
      .post("/api/providers/7/reviews")
      .set("x-test-user", "parent")
      .send({ rating: 5, title: "Valid request, rejected by database" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ ok: false, message: expect.stringMatching(/invalid review data/i) });
  });
});

describe("public search failure handling", () => {
  it("fails closed instead of returning an unfiltered provider fallback", async () => {
    vi.mocked(storage.getProviders).mockRejectedValue(new Error("database query failed"));

    const res = await request(buildApp()).get("/api/providers?search=preschool");

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ ok: false });
    expect(res.body).not.toHaveProperty("providers");
  });
});