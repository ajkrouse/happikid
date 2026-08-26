/**
 * Stateful route-level journeys for the two marketplace sides.
 *
 * These tests intentionally register the real route modules together and keep
 * a small in-memory storage implementation behind the storage interface. This
 * exercises the hand-offs between discovery, engagement, provider management,
 * and administrative review without requiring a database connection.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const state = vi.hoisted(() => {
  const provider = {
    id: 7,
    userId: "legacy-creator",
    ownerUserId: null as string | null,
    name: "Sunshine Center",
    type: "daycare",
    city: "Brooklyn",
    borough: "Brooklyn",
    state: "NY",
    isActive: true,
    licenseStatus: "confirmed",
    claimStatus: "unclaimed",
    isProfileVisible: true,
    isProfilePublic: true,
    enrollmentStatus: "accepting",
    monthlyPriceMin: "1200",
    monthlyPriceMax: "1800",
    profileViews: 0,
    profileClicks: 0,
    comparisonAdds: 0,
    favoriteAdds: 0,
    rating: "4.5",
  };

  const users: Record<string, any> = {
    parent: { id: "parent", role: "parent", firstName: "Pat", lastName: "Parent", email: "parent@example.test" },
    provider: { id: "provider", role: "provider", firstName: "Penny", lastName: "Provider", email: "provider@example.test" },
    legacy: { id: "legacy-creator", role: "provider", email: "legacy@example.test" },
    admin: { id: "admin", role: "admin", email: "admin@example.test" },
    intruder: { id: "intruder", role: "provider", email: "intruder@example.test" },
  };

  const reset = () => {
    Object.assign(provider, {
      ownerUserId: null,
      claimStatus: "unclaimed",
      licenseStatus: "confirmed",
      isProfileVisible: true,
      isProfilePublic: true,
      name: "Sunshine Center",
      profileViews: 0,
      favoriteAdds: 0,
    });
    favorites.length = 0;
    inquiries.length = 0;
    tourRequests.length = 0;
    claims.length = 0;
    images.length = 0;
    threads.length = 0;
    nextIds.favorite = 1;
    nextIds.inquiry = 1;
    nextIds.tour = 1;
    nextIds.claim = 1;
    nextIds.image = 1;
    nextIds.thread = 1;
    nextIds.message = 1;
  };

  const favorites: any[] = [];
  const inquiries: any[] = [];
  const tourRequests: any[] = [];
  const claims: any[] = [];
  const images: any[] = [];
  const threads: any[] = [];
  const nextIds = { favorite: 1, inquiry: 1, tour: 1, claim: 1, image: 1, thread: 1, message: 1 };

  return { provider, users, favorites, inquiries, tourRequests, claims, images, threads, nextIds, reset };
});

const storageMock = vi.hoisted(() => ({
  getProviders: vi.fn(),
  getProvider: vi.fn(),
  getProviderWithDetails: vi.fn(),
  getProviderImages: vi.fn(),
  getProviderImage: vi.fn(),
  trackProfileView: vi.fn(),
  getProvidersByCanonicalOwner: vi.fn(),
  updateProvider: vi.fn(),
  searchProviders: vi.fn(),
  getProviderStats: vi.fn(),
  getReviewsByProviderId: vi.fn(),
  getProviderInquiries: vi.fn(),
  getWeeklyViewSummary: vi.fn(),
  getProfileViewTrend: vi.fn(),
  getSimilarProviderScores: vi.fn(),
  getProviderScore: vi.fn(),
  addProviderImage: vi.fn(),
  getInquiriesByProviderId: vi.fn(),
  getInquiriesByUserId: vi.fn(),
  createInquiry: vi.fn(),
  getInquiry: vi.fn(),
  replyToInquiry: vi.fn(),
  updateInquiryStatus: vi.fn(),
  getUser: vi.fn(),
  createTourRequestWithNotification: vi.fn(),
  getTourRequestsByProviderId: vi.fn(),
  getTourRequestsByParentId: vi.fn(),
  getTourRequest: vi.fn(),
  updateTourRequestStatusWithNotification: vi.fn(),
  addFavorite: vi.fn(),
  getFavoritesByUserId: vi.fn(),
  getOrCreateThread: vi.fn(),
  createThreadMessageWithNotification: vi.fn(),
  getThreadsForUser: vi.fn(),
  getThreadsByProviderId: vi.fn(),
  getThread: vi.fn(),
  getThreadMessages: vi.fn(),
  markThreadMessagesRead: vi.fn(),
  getClaimsByUserId: vi.fn(),
  createClaim: vi.fn(),
  getAllClaims: vi.fn(),
  approveClaim: vi.fn(),
  getPendingLicenseVerifications: vi.fn(),
}));

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, res: any, next: any) => {
    const userId = req.headers["x-test-user"];
    if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
    req.user = { claims: { sub: userId } };
    next();
  }),
}));

vi.mock("../server/storage", () => ({ storage: storageMock }));

const objectStorageMocks = vi.hoisted(() => ({
  getProviderImageUploadURL: vi.fn(),
  validateProviderImageObject: vi.fn(),
  promoteProviderImageObject: vi.fn(),
  trySetObjectEntityAclPolicy: vi.fn(),
}));

vi.mock("../server/objectStorage", () => ({
  ObjectStorageService: class {
    getProviderImageUploadURL = objectStorageMocks.getProviderImageUploadURL;
    validateProviderImageObject = objectStorageMocks.validateProviderImageObject;
    promoteProviderImageObject = objectStorageMocks.promoteProviderImageObject;
    trySetObjectEntityAclPolicy = objectStorageMocks.trySetObjectEntityAclPolicy;
  },
}));

vi.mock("../server/intelligentSearch", () => ({
  intelligentSearch: {
    parseQuery: vi.fn((search: string) => ({
      originalQuery: search,
      matchedTerms: [],
      confidence: 1,
      filters: { search },
      suggestions: [],
    })),
    explainParsing: vi.fn(() => ""),
  },
}));

vi.mock("../server/services/aiSummaries", () => ({ generateSearchSummary: vi.fn() }));
vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { storage } from "../server/storage";
import { registerProviderRoutes } from "../server/routes/providers";
import { registerFavoriteRoutes } from "../server/routes/favorites";
import { registerInquiryRoutes } from "../server/routes/inquiries";
import { registerTourRequestRoutes } from "../server/routes/tourRequests";
import { registerThreadRoutes } from "../server/routes/threads";
import { registerUploadRoutes } from "../server/routes/uploads";
import { registerClaimRoutes } from "../server/routes/claims";
import { registerAdminRoutes } from "../server/routes/admin";

const stagedObjectPath = "/objects/uploads/provider-image-staging/11111111-1111-4111-8111-111111111111";
const permanentObjectPath = "/objects/uploads/provider-images/22222222-2222-4222-8222-222222222222";

function ownedBy(userId: string) {
  return state.provider.ownerUserId === userId ||
    (!state.provider.ownerUserId && state.provider.userId === userId)
    ? [state.provider]
    : [];
}

function buildApp() {
  const app = express();
  app.use(express.json());
  registerProviderRoutes(app);
  registerFavoriteRoutes(app);
  registerInquiryRoutes(app);
  registerTourRequestRoutes(app);
  registerThreadRoutes(app);
  registerUploadRoutes(app);
  registerClaimRoutes(app);
  registerAdminRoutes(app);
  return app;
}

beforeEach(() => {
  state.reset();
  vi.clearAllMocks();

  storageMock.getProviders.mockImplementation(async () => ({
    providers: [state.provider],
    total: 1,
    verifiedPricingCount: 1,
  }));
  storageMock.getProvider.mockImplementation(async (id: number) => id === state.provider.id ? state.provider : undefined);
  storageMock.getProviderWithDetails.mockImplementation(async (id: number) =>
    id === state.provider.id ? { ...state.provider, images: state.images, reviews: [] } : undefined);
  storageMock.getProviderImages.mockImplementation(async (id: number) =>
    state.images.filter((image) => image.providerId === id));
  storageMock.trackProfileView.mockResolvedValue(undefined);
  storageMock.getProvidersByCanonicalOwner.mockImplementation(async (userId: string) => ownedBy(userId));
  storageMock.updateProvider.mockImplementation(async (_id: number, patch: any) => {
    Object.assign(state.provider, patch);
    return state.provider;
  });
  storageMock.getProviderStats.mockResolvedValue({});
  storageMock.getReviewsByProviderId.mockResolvedValue([]);
  storageMock.getProviderInquiries.mockImplementation(async (id: number) =>
    state.inquiries.filter((inquiry) => inquiry.providerId === id));
  storageMock.getWeeklyViewSummary.mockResolvedValue({ viewsThisWeek: 3, viewsLastWeek: 2 });
  storageMock.getProfileViewTrend.mockResolvedValue([]);
  storageMock.getSimilarProviderScores.mockResolvedValue([]);
  storageMock.getProviderScore.mockResolvedValue(null);
  storageMock.getUser.mockImplementation(async (id: string) => state.users[id]);

  storageMock.addProviderImage.mockImplementation(async (image: any) => {
    const saved = { ...image, id: state.nextIds.image++, createdAt: new Date() };
    state.images.push(saved);
    return saved;
  });

  storageMock.getInquiriesByProviderId.mockImplementation(async (id: number) =>
    state.inquiries.filter((inquiry) => inquiry.providerId === id));
  storageMock.getInquiriesByUserId.mockImplementation(async (userId: string) =>
    state.inquiries.filter((inquiry) => inquiry.userId === userId));
  storageMock.createInquiry.mockImplementation(async (data: any) => {
    const inquiry = { ...data, id: state.nextIds.inquiry++, createdAt: new Date() };
    state.inquiries.push(inquiry);
    return inquiry;
  });
  storageMock.getInquiry.mockImplementation(async (id: number) =>
    state.inquiries.find((inquiry) => inquiry.id === id));
  storageMock.replyToInquiry.mockImplementation(async (id: number, reply: string) => {
    const inquiry = state.inquiries.find((item) => item.id === id);
    Object.assign(inquiry, { reply, status: "responded" });
    return inquiry;
  });
  storageMock.updateInquiryStatus.mockImplementation(async (id: number, status: string) => {
    const inquiry = state.inquiries.find((item) => item.id === id);
    inquiry.status = status;
    return inquiry;
  });

  storageMock.createTourRequestWithNotification.mockImplementation(async (data: any) => {
    const tour = { ...data, id: state.nextIds.tour++, createdAt: new Date() };
    state.tourRequests.push(tour);
    return tour;
  });
  storageMock.getTourRequestsByProviderId.mockImplementation(async (id: number) =>
    state.tourRequests.filter((tour) => tour.providerId === id));
  storageMock.getTourRequestsByParentId.mockImplementation(async (userId: string) =>
    state.tourRequests.filter((tour) => tour.parentUserId === userId));
  storageMock.getTourRequest.mockImplementation(async (id: number) =>
    state.tourRequests.find((tour) => tour.id === id));
  storageMock.updateTourRequestStatusWithNotification.mockImplementation(async (id: number, status: string) => {
    const tour = state.tourRequests.find((item) => item.id === id);
    tour.status = status;
    return tour;
  });

  storageMock.addFavorite.mockImplementation(async (userId: string, providerId: number) => {
    const existing = state.favorites.find((favorite) =>
      favorite.userId === userId && favorite.providerId === providerId);
    if (existing) return { favorite: existing, created: false };
    const favorite = { id: state.nextIds.favorite++, userId, providerId, provider: state.provider };
    state.favorites.push(favorite);
    state.provider.favoriteAdds += 1;
    return { favorite, created: true };
  });
  storageMock.getFavoritesByUserId.mockImplementation(async (userId: string) =>
    state.favorites.filter((favorite) => favorite.userId === userId));

  storageMock.getOrCreateThread.mockImplementation(async (parentUserId: string, providerId: number) => {
    let thread = state.threads.find((item) => item.parentUserId === parentUserId && item.providerId === providerId);
    if (!thread) {
      thread = { id: state.nextIds.thread++, parentUserId, providerId, status: "open" };
      state.threads.push(thread);
    }
    return thread;
  });
  storageMock.createThreadMessageWithNotification.mockImplementation(async (
    threadId: number, senderUserId: string, body: string,
  ) => {
    const message = { id: state.nextIds.message++, threadId, senderUserId, body, createdAt: new Date() };
    const thread = state.threads.find((item) => item.id === threadId);
    thread.messages = [...(thread.messages ?? []), message];
    return message;
  });
  storageMock.getThreadsForUser.mockImplementation(async (userId: string) =>
    state.threads.filter((thread) => thread.parentUserId === userId));
  storageMock.getThreadsByProviderId.mockImplementation(async (providerId: number) =>
    state.threads.filter((thread) => thread.providerId === providerId));
  storageMock.getThread.mockImplementation(async (id: number) =>
    state.threads.find((thread) => thread.id === id));
  storageMock.getThreadMessages.mockImplementation(async (id: number) =>
    state.threads.find((thread) => thread.id === id)?.messages ?? []);
  storageMock.markThreadMessagesRead.mockResolvedValue(undefined);

  storageMock.getClaimsByUserId.mockImplementation(async (userId: string) =>
    state.claims.filter((claim) => claim.userId === userId));
  storageMock.createClaim.mockImplementation(async (data: any) => {
    const claim = { ...data, id: "11111111-1111-4111-8111-111111111111", createdAt: new Date() };
    state.claims.push(claim);
    return claim;
  });
  storageMock.getAllClaims.mockImplementation(async () => state.claims);
  storageMock.approveClaim.mockImplementation(async (id: string) => {
    const claim = state.claims.find((item) => item.id === id);
    claim.status = "approved";
    state.provider.claimStatus = "claimed";
    state.provider.ownerUserId = claim.userId;
    return claim;
  });
  storageMock.getPendingLicenseVerifications.mockResolvedValue([]);

  objectStorageMocks.getProviderImageUploadURL.mockResolvedValue({
    uploadURL: "https://storage.example.test/signed-upload",
    objectPath: stagedObjectPath,
  });
  objectStorageMocks.validateProviderImageObject.mockResolvedValue(undefined);
  objectStorageMocks.promoteProviderImageObject.mockResolvedValue(permanentObjectPath);
  objectStorageMocks.trySetObjectEntityAclPolicy.mockResolvedValue(undefined);
});

describe("parent discovery and engagement journey", () => {
  it("searches, views, favorites, inquires, requests a tour, and reads the parent dashboard", async () => {
    const app = buildApp();

    const search = await request(app).get("/api/providers").query({
      city: "Brooklyn",
      enrollmentStatus: "accepting",
      ageRange: "toddlers",
    });
    expect(search.status).toBe(200);
    expect(search.body.providers).toHaveLength(1);
    expect(storage.getProviders).toHaveBeenCalledWith(expect.objectContaining({
      city: "Brooklyn",
      enrollmentStatus: "accepting",
      ageRangeMin: 12,
      ageRangeMax: 36,
    }));

    const detail = await request(app).get("/api/providers/7");
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ id: 7, name: "Sunshine Center" });

    const favorite = await request(app)
      .post("/api/favorites/7")
      .set("x-test-user", "parent");
    expect(favorite.status).toBe(201);
    const favorites = await request(app)
      .get("/api/favorites")
      .set("x-test-user", "parent");
    expect(favorites.status).toBe(200);
    expect(favorites.body).toHaveLength(1);

    const inquiry = await request(app)
      .post("/api/inquiries")
      .set("x-test-user", "parent")
      .send({
        providerId: 7,
        parentName: "Pat Parent",
        parentEmail: "parent@example.test",
        message: "Do you have a fall opening?",
        inquiryType: "enrollment",
      });
    expect(inquiry.status).toBe(201);
    expect(inquiry.body).toMatchObject({ userId: "parent", providerId: 7, status: "pending" });

    const tour = await request(app)
      .post("/api/providers/7/tour-requests")
      .set("x-test-user", "parent")
      .send({
        providerId: 7,
        preferredDates: ["2026-09-03"],
        preferredTime: "afternoon",
        note: "We would love to visit.",
      });
    expect(tour.status).toBe(201);
    expect(tour.body).toMatchObject({ parentUserId: "parent", providerId: 7, status: "pending" });

    const [parentInquiries, parentTours, parentThreads] = await Promise.all([
      request(app).get("/api/inquiries/user").set("x-test-user", "parent"),
      request(app).get("/api/tour-requests").set("x-test-user", "parent"),
      request(app).get("/api/threads").set("x-test-user", "parent"),
    ]);
    expect(parentInquiries.body).toHaveLength(1);
    expect(parentTours.body).toHaveLength(1);
    expect(parentThreads.body).toEqual([]);
  });
});

describe("provider management journey", () => {
  it("claims a listing, transfers canonical ownership, edits it, uploads an image, and manages inbound contact", async () => {
    const app = buildApp();
    const claim = await request(app)
      .post("/api/claims")
      .set("x-test-user", "provider")
      .send({ providerId: 7, verificationMethod: "doc_upload", verificationPayload: { document: "license.pdf" } });
    expect(claim.status).toBe(200);

    const adminClaims = await request(app)
      .get("/api/admin/claims")
      .set("x-test-user", "admin");
    expect(adminClaims.status).toBe(200);
    expect(adminClaims.body).toHaveLength(1);

    const approved = await request(app)
      .post("/api/admin/claims/11111111-1111-4111-8111-111111111111/approve")
      .set("x-test-user", "admin");
    expect(approved.status).toBe(200);
    expect(state.provider.ownerUserId).toBe("provider");

    const formerCreatorEdit = await request(app)
      .patch("/api/providers/7")
      .set("x-test-user", "legacy-creator")
      .send({ name: "Should not change" });
    expect(formerCreatorEdit.status).toBe(403);

    const edit = await request(app)
      .patch("/api/providers/7")
      .set("x-test-user", "provider")
      .send({ name: "Sunshine Center Updated", enrollmentStatus: "waitlist" });
    expect(edit.status).toBe(200);
    expect(state.provider.name).toBe("Sunshine Center Updated");
    expect(state.provider.enrollmentStatus).toBe("waitlist");

    const prepareUpload = await request(app)
      .post("/api/provider-images/upload")
      .set("x-test-user", "provider")
      .send({ providerId: 7 });
    expect(prepareUpload.status).toBe(200);

    const finalize = await request(app)
      .post("/api/providers/7/images")
      .set("x-test-user", "provider")
      .send({
        objectPath: stagedObjectPath,
        uploadToken: prepareUpload.body.uploadToken,
        caption: "Play space",
        isPrimary: true,
      });
    expect(finalize.status).toBe(201);
    expect(finalize.body).toMatchObject({ providerId: 7, imageUrl: permanentObjectPath });

    const incomingInquiry = await request(app)
      .get("/api/inquiries/provider")
      .set("x-test-user", "provider");
    expect(incomingInquiry.status).toBe(200);

    const thread = await request(app)
      .post("/api/threads")
      .set("x-test-user", "parent")
      .send({ providerId: 7, body: "Can we learn more?" });
    expect(thread.status).toBe(201);

    const providerThreads = await request(app)
      .get("/api/threads/provider/list")
      .set("x-test-user", "provider");
    expect(providerThreads.status).toBe(200);
    expect(providerThreads.body).toHaveLength(1);

    const providerReply = await request(app)
      .post(`/api/threads/${thread.body.thread.id}/messages`)
      .set("x-test-user", "provider")
      .send({ body: "Absolutely — happy to help." });
    expect(providerReply.status).toBe(201);
  });
});

describe("provider analytics and access boundaries", () => {
  it("returns provider analytics only to the canonical owner", async () => {
    const app = buildApp();
    state.provider.ownerUserId = "provider";
    state.inquiries.push({ id: 1, providerId: 7, userId: "parent", status: "pending" });

    const denied = await request(app)
      .get("/api/providers/analytics")
      .set("x-test-user", "intruder");
    expect(denied.status).toBe(404);
    expect(storage.getReviewsByProviderId).not.toHaveBeenCalled();

    const analytics = await request(app)
      .get("/api/providers/analytics")
      .set("x-test-user", "provider");
    expect(analytics.status).toBe(200);
    expect(analytics.body).toMatchObject({
      profileViews: 0,
      inquiryCount: 1,
      pendingInquiries: 1,
      responseRate: 0,
      viewsThisWeek: 3,
    });
  });

  it("blocks non-admins from administrative views while allowing an admin reviewer", async () => {
    const app = buildApp();
    const parentEdit = await request(app)
      .patch("/api/providers/7")
      .set("x-test-user", "parent")
      .send({ name: "Parent cannot edit listings" });
    expect(parentEdit.status).toBe(403);

    const parent = await request(app)
      .get("/api/admin/claims")
      .set("x-test-user", "parent");
    expect(parent.status).toBe(403);

    const admin = await request(app)
      .get("/api/admin/verifications")
      .set("x-test-user", "admin");
    expect(admin.status).toBe(200);
    expect(admin.body).toEqual([]);

    const unauthenticated = await request(app).get("/api/admin/verifications");
    expect(unauthenticated.status).toBe(401);
  });
});