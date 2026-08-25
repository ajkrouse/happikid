/**
 * HTTP-level validation tests — bad form submissions must be rejected (400)
 * before they reach the database; valid submissions must succeed (2xx).
 *
 * Routes covered:
 *
 * Providers
 *   POST   /api/providers              (create / update provider)
 *   PATCH  /api/providers/:id          (partial update)
 *   PUT    /api/providers/:id          (full replace)
 *   POST   /api/providers/:id/images
 *   POST   /api/providers/:id/suggest-update
 *   POST   /api/providers/:id/contribute-photo
 *
 * Claims
 *   POST   /api/claims
 *
 * Reviews & votes
 *   POST   /api/providers/:id/reviews
 *   POST   /api/reviews/:id/vote
 *
 * Inquiries
 *   POST   /api/inquiries
 *   POST   /api/inquiries/:id/reply
 *   PATCH  /api/inquiries/:id/status
 *
 * Threads (messaging)
 *   POST   /api/threads
 *   PATCH  /api/threads/:id
 *   POST   /api/threads/:id/messages
 *
 * Tour requests
 *   POST   /api/providers/:id/tour-requests
 *   PATCH  /api/tour-requests/:id
 *
 * Family profile
 *   POST   /api/family-profile
 *   PATCH  /api/family-profile
 *
 * Auth / preferences
 *   PATCH  /api/user/role
 *   POST   /api/user/preferences
 *
 * Admin (verification)
 *   POST   /api/admin/verifications/:providerId/reject
 *
 * Meta
 *   POST   /api/contact
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module-level mocks — hoisted before imports
// ---------------------------------------------------------------------------

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, res: any, next: any) => {
    const userId = req.headers["x-test-user"];
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    req.user = { claims: { sub: userId } };
    next();
  }),
  setupAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/storage", () => ({
  storage: {
    // providers
    getProvider: vi.fn(),
    getProviders: vi.fn(),
    getProvidersByUserId: vi.fn(),
    getProvidersByCanonicalOwner: vi.fn(),
    getProviderWithDetails: vi.fn(),
    createProvider: vi.fn(),
    updateProvider: vi.fn(),
    searchProviders: vi.fn(),
    getProviderStats: vi.fn(),
    trackProfileView: vi.fn().mockResolvedValue(undefined),
    createProviderUpdate: vi.fn(),
    getProviderUpdates: vi.fn(),
    createProviderPhoto: vi.fn(),
    getProviderPhotos: vi.fn(),
    // images
    getProviderImages: vi.fn(),
    addProviderImage: vi.fn(),
    // scores
    getProviderScore: vi.fn(),
    updateProviderScore: vi.fn(),
    createProviderScore: vi.fn(),
    getSimilarProviderScores: vi.fn(),
    getProfileViewTrend: vi.fn(),
    getWeeklyViewSummary: vi.fn(),
    // reviews
    getReviewsByProviderId: vi.fn(),
    getProviderReviews: vi.fn(),
    createReview: vi.fn(),
    createReviewVote: vi.fn(),
    getReviewVotes: vi.fn(),
    getUserReviewVote: vi.fn(),
    // inquiries
    getProviderInquiries: vi.fn(),
    createInquiry: vi.fn(),
    getInquiriesByProviderId: vi.fn(),
    getInquiriesByUserId: vi.fn(),
    getInquiry: vi.fn(),
    updateInquiryStatus: vi.fn(),
    replyToInquiry: vi.fn(),
    // claims
    createClaim: vi.fn(),
    getClaimsByUserId: vi.fn(),
    getAllClaims: vi.fn(),
    approveClaim: vi.fn(),
    rejectClaim: vi.fn(),
    // locations
    addProviderLocation: vi.fn(),
    // users
    getUser: vi.fn(),
    updateUserRole: vi.fn(),
    // family profile
    getFamilyProfile: vi.fn(),
    upsertFamilyProfile: vi.fn(),
    updateFamilyProfile: vi.fn(),
    // threads
    getOrCreateThread: vi.fn(),
    createThreadMessage: vi.fn(),
    getThread: vi.fn(),
    updateThreadStatus: vi.fn(),
    getThreadsByProviderId: vi.fn(),
    getThreadsForUser: vi.fn(),
    getThreadMessages: vi.fn(),
    markThreadMessagesRead: vi.fn(),
    // tour requests
    createTourRequest: vi.fn(),
    getTourRequest: vi.fn(),
    updateTourRequestStatus: vi.fn(),
    getTourRequestsByProviderId: vi.fn(),
    getTourRequestsByParentId: vi.fn(),
    // admin
    getPendingLicenseVerifications: vi.fn(),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
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
    expandSynonyms: vi.fn(() => []),
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

vi.mock("../server/middleware/rateLimiter", () => ({
  inquiryLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
  aiLimiter: (_req: any, _res: any, next: any) => next(),
  aiSummaryLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../server/services/email", () => ({
  sendNewMessageNotification: vi.fn().mockResolvedValue(undefined),
  sendTourRequestNotification: vi.fn().mockResolvedValue(undefined),
  sendTourStatusEmail: vi.fn().mockResolvedValue(undefined),
  sendLicenseRejectionEmail: vi.fn().mockResolvedValue(undefined),
  sendLicenseApprovalEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/objectStorage", () => ({
  ObjectStorageService: vi.fn().mockImplementation(() => ({
    trySetObjectEntityAclPolicy: vi.fn().mockResolvedValue(undefined),
  })),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { storage } from "../server/storage";
import { registerProviderRoutes } from "../server/routes/providers";
import { registerClaimRoutes } from "../server/routes/claims";
import { registerReviewRoutes } from "../server/routes/reviews";
import { registerInquiryRoutes } from "../server/routes/inquiries";
import { registerFamilyRoutes } from "../server/routes/family";
import { registerAuthRoutes } from "../server/routes/auth";
import { registerMetaRoutes } from "../server/routes/meta";
import { registerThreadRoutes } from "../server/routes/threads";
import { registerAdminRoutes } from "../server/routes/admin";
import { registerTourRequestRoutes } from "../server/routes/tourRequests";

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  registerProviderRoutes(app);
  registerClaimRoutes(app);
  registerReviewRoutes(app);
  registerInquiryRoutes(app);
  registerFamilyRoutes(app);
  registerAuthRoutes(app);
  registerMetaRoutes(app);
  registerThreadRoutes(app);
  registerAdminRoutes(app);
  registerTourRequestRoutes(app);
  return app;
}

// Common auth headers
const AUTH = { "x-test-user": "user_owner" };
const ADMIN_AUTH = { "x-test-user": "user_admin" };

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const storedProvider = {
  id: 1,
  userId: "user_owner",
  ownerUserId: "user_owner",
  name: "Sunshine Daycare",
  type: "daycare",
  isActive: true,
  licenseStatus: "confirmed",
  isProfileVisible: true,
  isProfilePublic: true,
  borough: "Brooklyn",
  city: "New York",
  state: "NY",
  zipCode: "11201",
  address: "1 Main St",
  enrollmentStatus: "accepting",
  claimStatus: "unclaimed",
  closedDates: null,
  schedule: null,
  licenseStatus: "confirmed",
  licenseSubmittedAt: new Date(),
};

const storedThread = {
  id: 10,
  parentUserId: "user_owner",
  providerId: 1,
  status: "open",
};

const storedInquiry = {
  id: 5,
  providerId: 1,
  userId: "user_sender",
  parentName: "Jane",
  parentEmail: "jane@example.com",
  status: "pending",
};

const storedTourRequest = {
  id: 7,
  parentUserId: "user_owner",
  providerId: 1,
  preferredDates: ["2026-09-01"],
  preferredTime: "morning",
  status: "pending",
};

// ============================================================================
// POST /api/providers
// ============================================================================

describe("POST /api/providers — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getProvidersByCanonicalOwner).mockReset();
    vi.mocked(storage.createProvider).mockReset();
    vi.mocked(storage.updateProvider).mockReset();
    vi.mocked(storage.addProviderLocation).mockReset();
  });

  it("rejects an invalid location payload (non-integer capacity) → 400", async () => {
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([]);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set(AUTH)
      .send({
        name: "Test Daycare",
        locations: [{ address: "123 Main St", capacity: "not-a-number", isPrimary: true }],
      });
    expect(res.status).toBe(400);
    expect(storage.createProvider).not.toHaveBeenCalled();
  });

  it("rejects an invalid enrollmentStatus value on the create path → 400", async () => {
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([]);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set(AUTH)
      .send({ name: "Test Daycare", enrollmentStatus: "wide_open" });
    expect(res.status).toBe(400);
    expect(storage.createProvider).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric monthlyPrice → 400", async () => {
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([]);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set(AUTH)
      .send({ name: "Test Daycare", monthlyPrice: "expensive" });
    expect(res.status).toBe(400);
    expect(storage.createProvider).not.toHaveBeenCalled();
  });

  it("accepts a valid create payload → 201", async () => {
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([]);
    vi.mocked(storage.createProvider).mockResolvedValue({ ...storedProvider, id: 99 } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set(AUTH)
      .send({
        name: "Sunny Kids",
        type: "daycare",
        borough: "Queens",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "11101",
        monthlyPrice: 1200,
      });
    expect(res.status).toBe(201);
    expect(storage.createProvider).toHaveBeenCalled();
  });

  it("accepts a valid update payload (existing provider) → 200", async () => {
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([storedProvider as any]);
    vi.mocked(storage.updateProvider).mockResolvedValue({ ...storedProvider, name: "Updated Name" } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers")
      .set(AUTH)
      .send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalled();
  });

  it("returns 401 without authentication", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/providers").send({ name: "Test" });
    expect(res.status).toBe(401);
  });
});

// ============================================================================
// PATCH /api/providers/:id
// ============================================================================

describe("PATCH /api/providers/:id — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.updateProvider).mockReset();
  });

  it("rejects an invalid enrollmentStatus enum → 400", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, licenseStatus: "pending" } as any);
    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/1")
      .set(AUTH)
      .send({ enrollmentStatus: "open_for_everyone" });
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric monthlyPriceMin → 400", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, licenseStatus: "pending" } as any);
    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/1")
      .set(AUTH)
      .send({ monthlyPriceMin: "cheap" });
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects a schedule entry with extra unexpected fields → 400", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/1")
      .set(AUTH)
      .send({
        schedule: { monday: { isOpen: true, open: "08:00", close: "18:00", surprise: "extra" } },
      });
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("accepts a valid PATCH with a single field → 200", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({ ...storedProvider, enrollmentStatus: "waitlist" } as any);
    const app = buildApp();
    const res = await request(app)
      .patch("/api/providers/1")
      .set(AUTH)
      .send({ enrollmentStatus: "waitlist" });
    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(1, expect.objectContaining({ enrollmentStatus: "waitlist" }));
  });

  it("returns 400 for a non-integer provider ID in the path", async () => {
    const app = buildApp();
    const res = await request(app).patch("/api/providers/abc").set(AUTH).send({ name: "Updated" });
    expect(res.status).toBe(400);
  });

  it("returns 403 when the authenticated user does not own the provider", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, userId: "someone_else", ownerUserId: "someone_else" } as any);
    const app = buildApp();
    const res = await request(app).patch("/api/providers/1").set(AUTH).send({ name: "Hack" });
    expect(res.status).toBe(403);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });
});

// ============================================================================
// PUT /api/providers/:id
// ============================================================================

describe("PUT /api/providers/:id — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.updateProvider).mockReset();
  });

  it("rejects an invalid enrollmentStatus enum → 400", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/1")
      .set(AUTH)
      .send({ enrollmentStatus: "permanently_closed" });
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects an invalid monthlyPrice value → 400", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/1")
      .set(AUTH)
      .send({ monthlyPrice: "free" });
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("accepts a valid PUT payload → 200", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({ ...storedProvider, name: "Updated Name" } as any);
    const app = buildApp();
    const res = await request(app)
      .put("/api/providers/1")
      .set(AUTH)
      .send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalled();
  });

  it("returns 403 when the caller does not own the provider", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, userId: "someone_else", ownerUserId: "someone_else" } as any);
    const app = buildApp();
    const res = await request(app).put("/api/providers/1").set(AUTH).send({ name: "Hack" });
    expect(res.status).toBe(403);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-integer provider ID", async () => {
    const app = buildApp();
    const res = await request(app).put("/api/providers/xyz").set(AUTH).send({ name: "Test" });
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// POST /api/providers/:id/images
// ============================================================================

describe("POST /api/providers/:id/images — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.addProviderImage).mockReset();
  });

  it("rejects a payload missing the required imageUrl → 400", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/images")
      .set(AUTH)
      .send({ caption: "Playground" });
    expect(res.status).toBe(400);
    expect(storage.addProviderImage).not.toHaveBeenCalled();
  });

  it("rejects a non-string (numeric) imageUrl → 400", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/images")
      .set(AUTH)
      .send({ imageUrl: 12345 });
    expect(res.status).toBe(400);
    expect(storage.addProviderImage).not.toHaveBeenCalled();
  });

  it("accepts a valid image payload → 201", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    vi.mocked(storage.addProviderImage).mockResolvedValue({
      id: 1, providerId: 1, imageUrl: "https://cdn.example.com/photo.jpg", caption: "Playground", isPrimary: false,
    } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/images")
      .set(AUTH)
      .send({ imageUrl: "https://cdn.example.com/photo.jpg", caption: "Playground" });
    expect(res.status).toBe(201);
    expect(storage.addProviderImage).toHaveBeenCalled();
  });

  it("returns 403 when the authenticated user does not own the provider", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, userId: "someone_else", ownerUserId: "someone_else" } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/images")
      .set(AUTH)
      .send({ imageUrl: "https://cdn.example.com/photo.jpg" });
    expect(res.status).toBe(403);
  });
});

// ============================================================================
// POST /api/providers/:id/suggest-update
// ============================================================================

describe("POST /api/providers/:id/suggest-update — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.createProviderUpdate).mockReset();
  });

  it("rejects a payload missing required updateType → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/suggest-update")
      .set(AUTH)
      .send({ field: "phone", newValue: "555-1234" });
    expect(res.status).toBe(400);
    expect(storage.createProviderUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid updateType enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/suggest-update")
      .set(AUTH)
      .send({ updateType: "wifi_password", field: "phone", newValue: "555-1234" });
    expect(res.status).toBe(400);
    expect(storage.createProviderUpdate).not.toHaveBeenCalled();
  });

  it("rejects a payload missing required field → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/suggest-update")
      .set(AUTH)
      .send({ updateType: "contact_info", newValue: "555-1234" }); // missing field
    expect(res.status).toBe(400);
    expect(storage.createProviderUpdate).not.toHaveBeenCalled();
  });

  it("accepts a valid suggest-update payload → 201", async () => {
    vi.mocked(storage.createProviderUpdate).mockResolvedValue({
      id: 1, providerId: 1, userId: "user_owner", updateType: "contact_info",
      field: "phone", newValue: "555-9999", status: "pending",
    } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/suggest-update")
      .set(AUTH)
      .send({ updateType: "contact_info", field: "phone", newValue: "555-9999" });
    expect(res.status).toBe(201);
    expect(storage.createProviderUpdate).toHaveBeenCalled();
  });

  it("returns 400 for a non-integer provider ID in the path", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/abc/suggest-update")
      .set(AUTH)
      .send({ updateType: "contact_info", field: "phone", newValue: "555-9999" });
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// POST /api/providers/:id/contribute-photo
// ============================================================================

describe("POST /api/providers/:id/contribute-photo — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.createProviderPhoto).mockReset();
  });

  it("rejects a payload missing required imageUrl → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/contribute-photo")
      .set(AUTH)
      .send({ caption: "Outside view" });
    expect(res.status).toBe(400);
    expect(storage.createProviderPhoto).not.toHaveBeenCalled();
  });

  it("rejects an invalid photoType enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/contribute-photo")
      .set(AUTH)
      .send({ imageUrl: "https://cdn.example.com/photo.jpg", photoType: "selfie" });
    expect(res.status).toBe(400);
    expect(storage.createProviderPhoto).not.toHaveBeenCalled();
  });

  it("accepts a valid contribute-photo payload → 201", async () => {
    vi.mocked(storage.createProviderPhoto).mockResolvedValue({
      id: 1, providerId: 1, userId: "user_owner",
      imageUrl: "https://cdn.example.com/photo.jpg", photoType: "exterior", status: "pending",
    } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/contribute-photo")
      .set(AUTH)
      .send({ imageUrl: "https://cdn.example.com/photo.jpg", photoType: "exterior" });
    expect(res.status).toBe(201);
    expect(storage.createProviderPhoto).toHaveBeenCalled();
  });

  it("returns 400 for a non-integer provider ID in the path", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/abc/contribute-photo")
      .set(AUTH)
      .send({ imageUrl: "https://cdn.example.com/photo.jpg" });
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// POST /api/claims
// ============================================================================

describe("POST /api/claims — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.getClaimsByUserId).mockReset();
    vi.mocked(storage.createClaim).mockReset();
  });

  it("rejects a payload missing providerId → 400", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/claims").set(AUTH).send({ verificationMethod: "email_domain" });
    expect(res.status).toBe(400);
    expect(storage.createClaim).not.toHaveBeenCalled();
  });

  it("rejects a non-integer providerId → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/claims")
      .set(AUTH)
      .send({ providerId: "abc", verificationMethod: "email_domain" });
    expect(res.status).toBe(400);
    expect(storage.createClaim).not.toHaveBeenCalled();
  });

  it("rejects an invalid verificationMethod enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/claims")
      .set(AUTH)
      .send({ providerId: 1, verificationMethod: "phone_call" });
    expect(res.status).toBe(400);
    expect(storage.createClaim).not.toHaveBeenCalled();
  });

  it("rejects a payload missing verificationMethod → 400", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/claims").set(AUTH).send({ providerId: 1 });
    expect(res.status).toBe(400);
    expect(storage.createClaim).not.toHaveBeenCalled();
  });

  it("accepts a valid claim payload → 200", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, claimStatus: "unclaimed" } as any);
    vi.mocked(storage.getClaimsByUserId).mockResolvedValue([]);
    vi.mocked(storage.createClaim).mockResolvedValue({ id: "uuid-1", providerId: 1 } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/claims")
      .set(AUTH)
      .send({ providerId: 1, verificationMethod: "email_domain" });
    expect(res.status).toBe(200);
    expect(storage.createClaim).toHaveBeenCalled();
  });
});

// ============================================================================
// POST /api/providers/:id/reviews
// ============================================================================

describe("POST /api/providers/:id/reviews — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.createReview).mockReset();
  });

  it("rejects a payload missing the required rating field → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/reviews")
      .set(AUTH)
      .send({ content: "Great place but no rating supplied" });
    expect(res.status).toBe(400);
    expect(storage.createReview).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric rating value → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/reviews")
      .set(AUTH)
      .send({ rating: "five stars", content: "Excellent" });
    expect(res.status).toBe(400);
    expect(storage.createReview).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-integer provider ID in the path", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/abc/reviews")
      .set(AUTH)
      .send({ rating: 4 });
    expect(res.status).toBe(400);
    expect(storage.createReview).not.toHaveBeenCalled();
  });

  it("accepts a valid review payload → 201", async () => {
    vi.mocked(storage.createReview).mockResolvedValue({
      id: 10, providerId: 1, userId: "user_owner", rating: 4, title: "Great", content: "Loved it.",
    } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/reviews")
      .set(AUTH)
      .send({ rating: 4, title: "Great place", content: "Really loved it." });
    expect(res.status).toBe(201);
    expect(storage.createReview).toHaveBeenCalled();
  });
});

// ============================================================================
// POST /api/reviews/:id/vote
// ============================================================================

describe("POST /api/reviews/:id/vote — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.createReviewVote).mockReset();
  });

  it("rejects a missing voteType → 400", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/reviews/10/vote").set(AUTH).send({});
    expect(res.status).toBe(400);
    expect(storage.createReviewVote).not.toHaveBeenCalled();
  });

  it("rejects an invalid voteType enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/reviews/10/vote")
      .set(AUTH)
      .send({ voteType: "maybe" });
    expect(res.status).toBe(400);
    expect(storage.createReviewVote).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-integer review ID in the path", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/reviews/abc/vote")
      .set(AUTH)
      .send({ voteType: "helpful" });
    expect(res.status).toBe(400);
    expect(storage.createReviewVote).not.toHaveBeenCalled();
  });

  it("accepts a valid 'helpful' vote → 201", async () => {
    vi.mocked(storage.createReviewVote).mockResolvedValue({
      userId: "user_owner", reviewId: 10, voteType: "helpful",
    } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/reviews/10/vote")
      .set(AUTH)
      .send({ voteType: "helpful" });
    expect(res.status).toBe(201);
    expect(storage.createReviewVote).toHaveBeenCalledWith(
      expect.objectContaining({ voteType: "helpful", reviewId: 10 }),
    );
  });

  it("accepts a valid 'not_helpful' vote → 201", async () => {
    vi.mocked(storage.createReviewVote).mockResolvedValue({
      userId: "user_owner", reviewId: 10, voteType: "not_helpful",
    } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/reviews/10/vote")
      .set(AUTH)
      .send({ voteType: "not_helpful" });
    expect(res.status).toBe(201);
  });
});

// ============================================================================
// POST /api/inquiries
// ============================================================================

describe("POST /api/inquiries — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.createInquiry).mockReset();
  });

  it("rejects a payload missing parentEmail → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/inquiries")
      .set(AUTH)
      .send({ parentName: "Jane", providerId: 1, message: "Is there availability?" });
    expect(res.status).toBe(400);
    expect(storage.createInquiry).not.toHaveBeenCalled();
  });

  it("rejects a payload missing parentName → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/inquiries")
      .set(AUTH)
      .send({ parentEmail: "jane@example.com", providerId: 1, message: "Is there availability?" });
    expect(res.status).toBe(400);
    expect(storage.createInquiry).not.toHaveBeenCalled();
  });

  it("rejects a non-string parentEmail value → 400", async () => {
    // The schema maps parentEmail from a notNull varchar → z.string()
    // so a non-string (number) must be rejected.
    const app = buildApp();
    const res = await request(app)
      .post("/api/inquiries")
      .set(AUTH)
      .send({ parentName: "Jane", parentEmail: 12345, providerId: 1, message: "Hello" });
    expect(res.status).toBe(400);
    expect(storage.createInquiry).not.toHaveBeenCalled();
  });

  it("rejects a missing providerId → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/inquiries")
      .set(AUTH)
      .send({ parentName: "Jane", parentEmail: "jane@example.com", message: "Hello" });
    expect(res.status).toBe(400);
    expect(storage.createInquiry).not.toHaveBeenCalled();
  });

  it("accepts a valid inquiry payload → 201", async () => {
    vi.mocked(storage.createInquiry).mockResolvedValue({ ...storedInquiry } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/inquiries")
      .set(AUTH)
      .send({
        parentName: "Jane Smith",
        parentEmail: "jane@example.com",
        providerId: 1,
        message: "Is there availability for my 2-year-old?",
      });
    expect(res.status).toBe(201);
    expect(storage.createInquiry).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_owner", status: "pending" }),
    );
  });
});

// ============================================================================
// POST /api/inquiries/:id/reply
// ============================================================================

describe("POST /api/inquiries/:id/reply — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getInquiry).mockReset();
    vi.mocked(storage.getProvidersByUserId).mockReset();
    vi.mocked(storage.replyToInquiry).mockReset();
  });

  it("rejects an empty reply body → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/inquiries/5/reply")
      .set(AUTH)
      .send({ reply: "" });
    expect(res.status).toBe(400);
    expect(storage.replyToInquiry).not.toHaveBeenCalled();
  });

  it("rejects a missing reply field → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/inquiries/5/reply")
      .set(AUTH)
      .send({});
    expect(res.status).toBe(400);
    expect(storage.replyToInquiry).not.toHaveBeenCalled();
  });

  it("rejects a reply exceeding 2000 characters → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/inquiries/5/reply")
      .set(AUTH)
      .send({ reply: "x".repeat(2001) });
    expect(res.status).toBe(400);
    expect(storage.replyToInquiry).not.toHaveBeenCalled();
  });

  it("accepts a valid reply → 200", async () => {
    vi.mocked(storage.getInquiry).mockResolvedValue(storedInquiry as any);
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([storedProvider as any]);
    vi.mocked(storage.replyToInquiry).mockResolvedValue({ ...storedInquiry, providerReply: "Thanks!" } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/inquiries/5/reply")
      .set(AUTH)
      .send({ reply: "Thanks for reaching out!" });
    expect(res.status).toBe(200);
    expect(storage.replyToInquiry).toHaveBeenCalledWith(5, "Thanks for reaching out!");
  });
});

// ============================================================================
// PATCH /api/inquiries/:id/status
// ============================================================================

describe("PATCH /api/inquiries/:id/status — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getInquiry).mockReset();
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.updateInquiryStatus).mockReset();
  });

  it("rejects a missing status field → 400", async () => {
    const app = buildApp();
    const res = await request(app).patch("/api/inquiries/5/status").set(AUTH).send({});
    expect(res.status).toBe(400);
    expect(storage.updateInquiryStatus).not.toHaveBeenCalled();
  });

  it("rejects an invalid status enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app).patch("/api/inquiries/5/status").set(AUTH).send({ status: "archived" });
    expect(res.status).toBe(400);
    expect(storage.updateInquiryStatus).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-integer inquiry ID in the path", async () => {
    const app = buildApp();
    const res = await request(app)
      .patch("/api/inquiries/abc/status")
      .set(AUTH)
      .send({ status: "responded" });
    expect(res.status).toBe(400);
    expect(storage.updateInquiryStatus).not.toHaveBeenCalled();
  });

  it("accepts a valid 'responded' status transition → 200", async () => {
    vi.mocked(storage.getInquiry).mockResolvedValue(storedInquiry as any);
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, licenseStatus: "pending" } as any);
    vi.mocked(storage.updateInquiryStatus).mockResolvedValue({ ...storedInquiry, status: "responded" } as any);
    const app = buildApp();
    const res = await request(app).patch("/api/inquiries/5/status").set(AUTH).send({ status: "responded" });
    expect(res.status).toBe(200);
    expect(storage.updateInquiryStatus).toHaveBeenCalledWith(5, "responded");
  });

  it("accepts a valid 'closed' status transition → 200", async () => {
    vi.mocked(storage.getInquiry).mockResolvedValue(storedInquiry as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    vi.mocked(storage.updateInquiryStatus).mockResolvedValue({ ...storedInquiry, status: "closed" } as any);
    const app = buildApp();
    const res = await request(app).patch("/api/inquiries/5/status").set(AUTH).send({ status: "closed" });
    expect(res.status).toBe(200);
    expect(storage.updateInquiryStatus).toHaveBeenCalledWith(5, "closed");
  });

  it("returns 403 when the authenticated user does not own the provider", async () => {
    vi.mocked(storage.getInquiry).mockResolvedValue(storedInquiry as any);
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, userId: "someone_else", ownerUserId: "someone_else" } as any);
    const app = buildApp();
    const res = await request(app).patch("/api/inquiries/5/status").set(AUTH).send({ status: "responded" });
    expect(res.status).toBe(403);
    expect(storage.updateInquiryStatus).not.toHaveBeenCalled();
  });
});

// ============================================================================
// POST /api/threads
// ============================================================================

describe("POST /api/threads — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.getOrCreateThread).mockReset();
    vi.mocked(storage.createThreadMessage).mockReset();
    vi.mocked(storage.getUser).mockReset();
  });

  it("rejects a payload missing providerId → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/threads")
      .set(AUTH)
      .send({ body: "Hello, is there availability?" });
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("rejects a non-integer providerId → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/threads")
      .set(AUTH)
      .send({ providerId: "abc", body: "Hello" });
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("rejects a missing body → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/threads")
      .set(AUTH)
      .send({ providerId: 1 });
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("rejects an empty body string → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/threads")
      .set(AUTH)
      .send({ providerId: 1, body: "" });
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("rejects a body exceeding 5000 characters → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/threads")
      .set(AUTH)
      .send({ providerId: 1, body: "x".repeat(5001) });
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("accepts a valid thread payload → 201", async () => {
    // Provider owned by a different user so the sender (user_owner) is the parent
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, userId: "provider_user", ownerUserId: "provider_user" } as any);
    vi.mocked(storage.getOrCreateThread).mockResolvedValue(storedThread as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue({ id: 1, threadId: 10, body: "Hello", senderUserId: "user_owner" } as any);
    vi.mocked(storage.getUser).mockResolvedValue(null as any); // fire-and-forget; no email in test
    const app = buildApp();
    const res = await request(app)
      .post("/api/threads")
      .set(AUTH)
      .send({ providerId: 1, body: "Is there availability?" });
    expect(res.status).toBe(201);
    expect(storage.createThreadMessage).toHaveBeenCalled();
  });
});

// ============================================================================
// PATCH /api/threads/:id
// ============================================================================

describe("PATCH /api/threads/:id — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getThread).mockReset();
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.updateThreadStatus).mockReset();
  });

  it("rejects a missing status → 400", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(storedThread as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app).patch("/api/threads/10").set(AUTH).send({});
    expect(res.status).toBe(400);
    expect(storage.updateThreadStatus).not.toHaveBeenCalled();
  });

  it("rejects an invalid status enum value → 400", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(storedThread as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app).patch("/api/threads/10").set(AUTH).send({ status: "archived" });
    expect(res.status).toBe(400);
    expect(storage.updateThreadStatus).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-integer thread ID in the path", async () => {
    const app = buildApp();
    const res = await request(app).patch("/api/threads/abc").set(AUTH).send({ status: "enrolled" });
    expect(res.status).toBe(400);
  });

  it("accepts a valid status → 200", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(storedThread as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    vi.mocked(storage.updateThreadStatus).mockResolvedValue({ ...storedThread, status: "enrolled" } as any);
    const app = buildApp();
    const res = await request(app).patch("/api/threads/10").set(AUTH).send({ status: "enrolled" });
    expect(res.status).toBe(200);
    expect(storage.updateThreadStatus).toHaveBeenCalledWith(10, "enrolled");
  });
});

// ============================================================================
// POST /api/threads/:id/messages
// ============================================================================

describe("POST /api/threads/:id/messages — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getThread).mockReset();
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.createThreadMessage).mockReset();
    vi.mocked(storage.getUser).mockReset();
  });

  const threadWithParentUser = { ...storedThread, parentUserId: "user_owner" };

  it("rejects an empty body string → 400", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(threadWithParentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app).post("/api/threads/10/messages").set(AUTH).send({ body: "" });
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("rejects a missing body field → 400", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(threadWithParentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app).post("/api/threads/10/messages").set(AUTH).send({});
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("rejects a body exceeding 5000 characters → 400", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(threadWithParentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/threads/10/messages")
      .set(AUTH)
      .send({ body: "x".repeat(5001) });
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("accepts a valid message → 201", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(threadWithParentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue({
      id: 100, threadId: 10, senderUserId: "user_owner", body: "Hello",
    } as any);
    vi.mocked(storage.getUser).mockResolvedValue(null as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/threads/10/messages")
      .set(AUTH)
      .send({ body: "Hello, looking forward to a tour!" });
    expect(res.status).toBe(201);
    expect(storage.createThreadMessage).toHaveBeenCalled();
  });

  it("returns 400 for a non-integer thread ID in the path", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/threads/abc/messages").set(AUTH).send({ body: "Hello" });
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// POST /api/providers/:id/tour-requests
// ============================================================================

describe("POST /api/providers/:id/tour-requests — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getUser).mockReset();
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.createTourRequest).mockReset();
  });

  const parentUser = { id: "user_owner", role: "parent", email: "parent@example.com" };

  it("rejects a payload missing preferredDates → 400", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(parentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/tour-requests")
      .set(AUTH)
      .send({ preferredTime: "morning" });
    expect(res.status).toBe(400);
    expect(storage.createTourRequest).not.toHaveBeenCalled();
  });

  it("rejects an invalid date format in preferredDates → 400", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(parentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/tour-requests")
      .set(AUTH)
      .send({ preferredDates: ["not-a-date"], preferredTime: "morning" });
    expect(res.status).toBe(400);
    expect(storage.createTourRequest).not.toHaveBeenCalled();
  });

  it("rejects an invalid preferredTime enum value → 400", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(parentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/tour-requests")
      .set(AUTH)
      .send({ preferredDates: ["2026-09-10"], preferredTime: "lunchtime" });
    expect(res.status).toBe(400);
    expect(storage.createTourRequest).not.toHaveBeenCalled();
  });

  it("rejects a note exceeding 1000 characters → 400", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(parentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/tour-requests")
      .set(AUTH)
      .send({ preferredDates: ["2026-09-10"], preferredTime: "morning", note: "x".repeat(1001) });
    expect(res.status).toBe(400);
    expect(storage.createTourRequest).not.toHaveBeenCalled();
  });

  it("accepts a valid tour request payload → 201", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(parentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    vi.mocked(storage.createTourRequest).mockResolvedValue({ ...storedTourRequest } as any);
    const app = buildApp();
    // providerId must be included in the body because the drizzle-generated schema marks it
    // notNull; the route also enforces it server-side from the URL param.
    const res = await request(app)
      .post("/api/providers/1/tour-requests")
      .set(AUTH)
      .send({ providerId: 1, preferredDates: ["2026-09-10", "2026-09-12"], preferredTime: "morning" });
    expect(res.status).toBe(201);
    expect(storage.createTourRequest).toHaveBeenCalled();
  });

  it("returns 403 when the caller is not a parent-role user", async () => {
    vi.mocked(storage.getUser).mockResolvedValue({ ...parentUser, role: "provider" } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/providers/1/tour-requests")
      .set(AUTH)
      .send({ preferredDates: ["2026-09-10"], preferredTime: "morning" });
    expect(res.status).toBe(403);
    expect(storage.createTourRequest).not.toHaveBeenCalled();
  });

  it("does not allow a parent to request a tour from a private provider", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(parentUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue({
      ...storedProvider,
      isProfileVisible: false,
    } as any);

    const res = await request(buildApp())
      .post("/api/providers/1/tour-requests")
      .set(AUTH)
      .send({ preferredDates: ["2026-09-10"], preferredTime: "morning" });

    expect(res.status).toBe(404);
    expect(storage.createTourRequest).not.toHaveBeenCalled();
  });
});

// ============================================================================
// PATCH /api/tour-requests/:id
// ============================================================================

describe("PATCH /api/tour-requests/:id — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getTourRequest).mockReset();
    vi.mocked(storage.getProvidersByCanonicalOwner).mockReset();
    vi.mocked(storage.updateTourRequestStatus).mockReset();
    vi.mocked(storage.getUser).mockReset();
  });

  it("rejects a missing status field → 400", async () => {
    const app = buildApp();
    const res = await request(app).patch("/api/tour-requests/7").set(AUTH).send({});
    expect(res.status).toBe(400);
    expect(storage.updateTourRequestStatus).not.toHaveBeenCalled();
  });

  it("rejects an invalid status enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app).patch("/api/tour-requests/7").set(AUTH).send({ status: "confirmed" });
    expect(res.status).toBe(400);
    expect(storage.updateTourRequestStatus).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-integer tour request ID in the path", async () => {
    const app = buildApp();
    const res = await request(app).patch("/api/tour-requests/abc").set(AUTH).send({ status: "scheduled" });
    expect(res.status).toBe(400);
  });

  it("accepts provider scheduling a tour → 200", async () => {
    vi.mocked(storage.getTourRequest).mockResolvedValue(storedTourRequest as any);
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([storedProvider as any]);
    vi.mocked(storage.updateTourRequestStatus).mockResolvedValue({ ...storedTourRequest, status: "scheduled" } as any);
    vi.mocked(storage.getUser).mockResolvedValue(null as any);
    const app = buildApp();
    const res = await request(app).patch("/api/tour-requests/7").set(AUTH).send({ status: "scheduled" });
    expect(res.status).toBe(200);
    expect(storage.updateTourRequestStatus).toHaveBeenCalledWith(7, "scheduled");
  });

  it("accepts parent cancelling their own pending request → 200", async () => {
    // user_owner is the parentUserId; provider is owned by someone else
    vi.mocked(storage.getTourRequest).mockResolvedValue({ ...storedTourRequest, parentUserId: "user_owner" } as any);
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([]); // not the provider owner
    vi.mocked(storage.updateTourRequestStatus).mockResolvedValue({ ...storedTourRequest, status: "cancelled" } as any);
    const app = buildApp();
    const res = await request(app).patch("/api/tour-requests/7").set(AUTH).send({ status: "cancelled" });
    expect(res.status).toBe(200);
    expect(storage.updateTourRequestStatus).toHaveBeenCalledWith(7, "cancelled");
  });
});

// ============================================================================
// POST /api/family-profile
// ============================================================================

describe("POST /api/family-profile — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.upsertFamilyProfile).mockReset();
  });

  it("rejects an invalid scheduleType enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/family-profile")
      .set(AUTH)
      .send({ scheduleType: "whenever" });
    expect(res.status).toBe(400);
    expect(storage.upsertFamilyProfile).not.toHaveBeenCalled();
  });

  it("accepts a valid empty payload → 200", async () => {
    vi.mocked(storage.upsertFamilyProfile).mockResolvedValue({
      id: 1, userId: "user_owner", scheduleType: null,
    } as any);
    const app = buildApp();
    const res = await request(app).post("/api/family-profile").set(AUTH).send({});
    expect(res.status).toBe(200);
    expect(storage.upsertFamilyProfile).toHaveBeenCalled();
  });

  it("accepts a valid payload with optional fields → 200", async () => {
    vi.mocked(storage.upsertFamilyProfile).mockResolvedValue({
      id: 1, userId: "user_owner", scheduleType: "full_time", preferredBorough: "Brooklyn",
    } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/family-profile")
      .set(AUTH)
      .send({ scheduleType: "full_time", preferredBorough: "Brooklyn" });
    expect(res.status).toBe(200);
    expect(storage.upsertFamilyProfile).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_owner", scheduleType: "full_time" }),
    );
  });
});

// ============================================================================
// PATCH /api/family-profile
// ============================================================================

describe("PATCH /api/family-profile — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.updateFamilyProfile).mockReset();
  });

  it("rejects an invalid scheduleType enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .patch("/api/family-profile")
      .set(AUTH)
      .send({ scheduleType: "on_demand" });
    expect(res.status).toBe(400);
    expect(storage.updateFamilyProfile).not.toHaveBeenCalled();
  });

  it("accepts a valid partial update → 200", async () => {
    vi.mocked(storage.updateFamilyProfile).mockResolvedValue({
      id: 1, userId: "user_owner", scheduleType: "part_time",
    } as any);
    const app = buildApp();
    const res = await request(app)
      .patch("/api/family-profile")
      .set(AUTH)
      .send({ scheduleType: "part_time" });
    expect(res.status).toBe(200);
    expect(storage.updateFamilyProfile).toHaveBeenCalledWith(
      "user_owner",
      expect.objectContaining({ scheduleType: "part_time" }),
    );
  });

  it("accepts an empty PATCH body (no-op) → 200", async () => {
    vi.mocked(storage.updateFamilyProfile).mockResolvedValue({ id: 1, userId: "user_owner" } as any);
    const app = buildApp();
    const res = await request(app).patch("/api/family-profile").set(AUTH).send({});
    expect(res.status).toBe(200);
  });
});

// ============================================================================
// PATCH /api/user/role
// ============================================================================

describe("PATCH /api/user/role — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.updateUserRole).mockReset();
  });

  it("rejects a missing role field → 400", async () => {
    const app = buildApp();
    const res = await request(app).patch("/api/user/role").set(AUTH).send({});
    expect(res.status).toBe(400);
    expect(storage.updateUserRole).not.toHaveBeenCalled();
  });

  it("rejects an invalid role enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app).patch("/api/user/role").set(AUTH).send({ role: "superadmin" });
    expect(res.status).toBe(400);
    expect(storage.updateUserRole).not.toHaveBeenCalled();
  });

  it("accepts a valid 'parent' role → 200", async () => {
    vi.mocked(storage.updateUserRole).mockResolvedValue({ id: "user_owner", role: "parent" } as any);
    const app = buildApp();
    const res = await request(app).patch("/api/user/role").set(AUTH).send({ role: "parent" });
    expect(res.status).toBe(200);
    expect(storage.updateUserRole).toHaveBeenCalledWith("user_owner", "parent");
  });

  it("accepts a valid 'provider' role → 200", async () => {
    vi.mocked(storage.updateUserRole).mockResolvedValue({ id: "user_owner", role: "provider" } as any);
    const app = buildApp();
    const res = await request(app).patch("/api/user/role").set(AUTH).send({ role: "provider" });
    expect(res.status).toBe(200);
    expect(storage.updateUserRole).toHaveBeenCalledWith("user_owner", "provider");
  });
});

// ============================================================================
// POST /api/user/preferences
// ============================================================================

describe("POST /api/user/preferences — validation", () => {
  it("rejects an invalid careType enum value → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/user/preferences")
      .set(AUTH)
      .send({ careType: "boarding_school" });
    expect(res.status).toBe(400);
  });

  it("accepts a valid preferences payload → 200", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/user/preferences")
      .set(AUTH)
      .send({ careType: "daycare", zipCode: "11201" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });

  it("accepts an empty preferences payload → 200 (all fields optional)", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/user/preferences").set(AUTH).send({});
    expect(res.status).toBe(200);
  });
});

// ============================================================================
// POST /api/admin/verifications/:providerId/reject
// ============================================================================

describe("POST /api/admin/verifications/:providerId/reject — validation", () => {
  beforeEach(() => {
    vi.mocked(storage.getUser).mockReset();
    vi.mocked(storage.getProvider).mockReset();
    vi.mocked(storage.updateProvider).mockReset();
    vi.mocked(storage.createAuditLog).mockReset();
  });

  const adminUser = { id: "user_admin", role: "admin", email: "admin@example.com" };

  it("rejects a missing reason → 400", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(adminUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/verifications/1/reject")
      .set(ADMIN_AUTH)
      .send({});
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only reason → 400", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(adminUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue(storedProvider as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/verifications/1/reject")
      .set(ADMIN_AUTH)
      .send({ reason: "   " });
    expect(res.status).toBe(400);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("returns 403 when caller is not an admin", async () => {
    vi.mocked(storage.getUser).mockResolvedValue({ ...adminUser, role: "parent" } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/verifications/1/reject")
      .set(ADMIN_AUTH)
      .send({ reason: "License expired" });
    expect(res.status).toBe(403);
    expect(storage.updateProvider).not.toHaveBeenCalled();
  });

  it("accepts a valid rejection with a non-empty reason → 200", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(adminUser as any);
    vi.mocked(storage.getProvider).mockResolvedValue({ ...storedProvider, licenseStatus: "pending" } as any);
    vi.mocked(storage.updateProvider).mockResolvedValue({ ...storedProvider, licenseStatus: "rejected" } as any);
    vi.mocked(storage.createAuditLog).mockResolvedValue(undefined as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/verifications/1/reject")
      .set(ADMIN_AUTH)
      .send({ reason: "License document is expired." });
    expect(res.status).toBe(200);
    expect(storage.updateProvider).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ licenseStatus: "rejected" }),
    );
  });

  it("returns 400 for a non-integer provider ID in the path", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(adminUser as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/verifications/abc/reject")
      .set(ADMIN_AUTH)
      .send({ reason: "Bad license" });
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// POST /api/admin/claims/:id/approve  &  POST /api/admin/claims/:id/reject
// ============================================================================

describe("POST /api/admin/claims/:id/approve — authorization", () => {
  const VALID_CLAIM_ID = "00000000-0000-0000-0000-000000000001";
  const adminUser = { id: "user_admin", role: "admin", email: "admin@example.com" };
  const regularUser = { id: "user_owner", role: "parent", email: "user@example.com" };

  beforeEach(() => {
    vi.mocked(storage.getUser).mockReset();
    vi.mocked(storage.approveClaim).mockReset();
  });

  it("returns 403 when a regular (non-admin) user calls approve", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(regularUser as any);
    const app = buildApp();
    const res = await request(app)
      .post(`/api/admin/claims/${VALID_CLAIM_ID}/approve`)
      .set(AUTH)
      .send({});
    expect(res.status).toBe(403);
    expect(storage.approveClaim).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid (non-UUID) claim ID", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(adminUser as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/claims/not-a-uuid/approve")
      .set(ADMIN_AUTH)
      .send({});
    expect(res.status).toBe(400);
    expect(storage.approveClaim).not.toHaveBeenCalled();
  });

  it("returns 200 when a valid admin approves a claim", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(adminUser as any);
    vi.mocked(storage.approveClaim).mockResolvedValue({ id: VALID_CLAIM_ID, status: "approved" } as any);
    const app = buildApp();
    const res = await request(app)
      .post(`/api/admin/claims/${VALID_CLAIM_ID}/approve`)
      .set(ADMIN_AUTH)
      .send({});
    expect(res.status).toBe(200);
    expect(storage.approveClaim).toHaveBeenCalled();
  });
});

describe("POST /api/admin/claims/:id/reject — authorization", () => {
  const VALID_CLAIM_ID = "00000000-0000-0000-0000-000000000002";
  const adminUser = { id: "user_admin", role: "admin", email: "admin@example.com" };
  const regularUser = { id: "user_owner", role: "parent", email: "user@example.com" };

  beforeEach(() => {
    vi.mocked(storage.getUser).mockReset();
    vi.mocked(storage.rejectClaim).mockReset();
  });

  it("returns 403 when a regular (non-admin) user calls reject", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(regularUser as any);
    const app = buildApp();
    const res = await request(app)
      .post(`/api/admin/claims/${VALID_CLAIM_ID}/reject`)
      .set(AUTH)
      .send({ rejectionReason: "Insufficient documentation" });
    expect(res.status).toBe(403);
    expect(storage.rejectClaim).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing rejectionReason when admin calls reject", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(adminUser as any);
    const app = buildApp();
    const res = await request(app)
      .post(`/api/admin/claims/${VALID_CLAIM_ID}/reject`)
      .set(ADMIN_AUTH)
      .send({});
    expect(res.status).toBe(400);
    expect(storage.rejectClaim).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid (non-UUID) claim ID", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(adminUser as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/claims/not-a-uuid/reject")
      .set(ADMIN_AUTH)
      .send({ rejectionReason: "Bad ID" });
    expect(res.status).toBe(400);
    expect(storage.rejectClaim).not.toHaveBeenCalled();
  });

  it("returns 200 when a valid admin rejects a claim with a reason", async () => {
    vi.mocked(storage.getUser).mockResolvedValue(adminUser as any);
    vi.mocked(storage.rejectClaim).mockResolvedValue({ id: VALID_CLAIM_ID, status: "rejected" } as any);
    const app = buildApp();
    const res = await request(app)
      .post(`/api/admin/claims/${VALID_CLAIM_ID}/reject`)
      .set(ADMIN_AUTH)
      .send({ rejectionReason: "Insufficient documentation" });
    expect(res.status).toBe(200);
    expect(storage.rejectClaim).toHaveBeenCalled();
  });
});

// ============================================================================
// POST /api/contact
// ============================================================================

describe("POST /api/contact — validation", () => {
  it("rejects a missing name → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/contact")
      .send({ email: "alice@example.com", message: "Hello" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid email address → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alice", email: "not-an-email", message: "Hello" });
    expect(res.status).toBe(400);
  });

  it("rejects an empty message → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alice", email: "alice@example.com", message: "" });
    expect(res.status).toBe(400);
  });

  it("rejects a name exceeding 100 characters → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "A".repeat(101), email: "alice@example.com", message: "Hello" });
    expect(res.status).toBe(400);
  });

  it("rejects a message exceeding 2000 characters → 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alice", email: "alice@example.com", message: "x".repeat(2001) });
    expect(res.status).toBe(400);
  });

  it("accepts a valid contact form payload → 200", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alice", email: "alice@example.com", message: "I have a question." });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });

  it("accepts an optional subject field → 200", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alice", email: "alice@example.com", subject: "Partnership", message: "Hello." });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });
});
