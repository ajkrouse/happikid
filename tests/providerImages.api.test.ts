import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const objectStorageMocks = vi.hoisted(() => ({
  getProviderImageUploadURL: vi.fn(),
  validateProviderImageObject: vi.fn(),
  promoteProviderImageObject: vi.fn(),
  trySetObjectEntityAclPolicy: vi.fn(),
  getObjectEntityFile: vi.fn(),
  downloadObject: vi.fn(),
  deleteObjectEntity: vi.fn(),
}));

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, res: any, next: any) => {
    const userId = req.headers["x-test-user"];
    if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
    req.user = { claims: { sub: userId } };
    next();
  }),
}));

vi.mock("../server/storage", () => ({
  storage: {
    getProvider: vi.fn(),
    getProviderWithDetails: vi.fn(),
    getProviderImages: vi.fn(),
    getProviderImage: vi.fn(),
    addProviderImage: vi.fn(),
    updateProviderImage: vi.fn(),
    setProviderImagePrimary: vi.fn(),
    deleteProviderImage: vi.fn(),
    deleteProviderImageWithCleanup: vi.fn(),
    queueProviderImageCleanup: vi.fn(),
    completeProviderImageCleanupByObjectPath: vi.fn(),
    getProviders: vi.fn(),
    trackProfileView: vi.fn().mockResolvedValue(undefined),
    getProviderStats: vi.fn(),
  },
}));

vi.mock("../server/objectStorage", () => ({
  ObjectStorageService: class {
    getProviderImageUploadURL = objectStorageMocks.getProviderImageUploadURL;
    validateProviderImageObject = objectStorageMocks.validateProviderImageObject;
    promoteProviderImageObject = objectStorageMocks.promoteProviderImageObject;
    trySetObjectEntityAclPolicy = objectStorageMocks.trySetObjectEntityAclPolicy;
    getObjectEntityFile = objectStorageMocks.getObjectEntityFile;
    downloadObject = objectStorageMocks.downloadObject;
    deleteObjectEntity = objectStorageMocks.deleteObjectEntity;
  },
}));

vi.mock("../server/intelligentSearch", () => ({
  intelligentSearch: {
    parseQuery: vi.fn(() => ({ originalQuery: "", matchedTerms: [], confidence: 0, filters: {}, suggestions: [] })),
    explainParsing: vi.fn(() => ""),
  },
}));

vi.mock("../server/services/aiSummaries", () => ({ generateSearchSummary: vi.fn() }));
vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { storage } from "../server/storage";
import { registerProviderRoutes } from "../server/routes/providers";
import { registerUploadRoutes } from "../server/routes/uploads";
import {
  createProviderImageUploadToken,
  ProviderImageValidationError,
} from "../server/lib/providerImageUpload";

const stagedObjectPath = "/objects/uploads/provider-image-staging/11111111-1111-4111-8111-111111111111";
const objectPath = "/objects/uploads/provider-images/22222222-2222-4222-8222-222222222222";

function provider(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    name: "Sunshine Center",
    userId: "legacy-owner",
    ownerUserId: "provider-owner",
    isActive: true,
    licenseStatus: "confirmed",
    isProfileVisible: true,
    isProfilePublic: true,
    ...overrides,
  };
}

function image(overrides: Record<string, unknown> = {}) {
  return {
    id: 19,
    providerId: 7,
    imageUrl: objectPath,
    caption: "Outdoor play space",
    isPrimary: true,
    createdAt: new Date(),
    ...overrides,
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  registerProviderRoutes(app);
  registerUploadRoutes(app);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(storage.getProvider).mockResolvedValue(provider() as any);
  vi.mocked(storage.getProviderImage).mockResolvedValue(image() as any);
  vi.mocked(storage.getProviderImages).mockResolvedValue([]);
  objectStorageMocks.getProviderImageUploadURL.mockResolvedValue({
    uploadURL: "https://storage.example.test/signed-upload",
    objectPath: stagedObjectPath,
  });
  objectStorageMocks.validateProviderImageObject.mockResolvedValue({});
  objectStorageMocks.promoteProviderImageObject.mockResolvedValue(objectPath);
  objectStorageMocks.trySetObjectEntityAclPolicy.mockResolvedValue(objectPath);
});

describe("provider image upload lifecycle", () => {
  it("issues an authenticated upload contract and persists a validated provider-owned image", async () => {
    vi.mocked(storage.addProviderImage).mockResolvedValue(image() as any);
    const app = buildApp();

    const prepare = await request(app)
      .post("/api/provider-images/upload")
      .set("x-test-user", "provider-owner")
      .send({ providerId: 7 });

    expect(prepare.status).toBe(200);
    expect(prepare.body).toMatchObject({
      uploadURL: "https://storage.example.test/signed-upload",
      objectPath: stagedObjectPath,
      maxFileSize: 5 * 1024 * 1024,
      allowedContentTypes: expect.arrayContaining(["image/jpeg", "image/webp"]),
    });

    const finalize = await request(app)
      .post("/api/providers/7/images")
      .set("x-test-user", "provider-owner")
      .send({
        objectPath: stagedObjectPath,
        uploadToken: prepare.body.uploadToken,
        caption: "Outdoor play space",
        isPrimary: true,
      });

    expect(finalize.status).toBe(201);
    expect(finalize.body).toMatchObject({ id: 19, imageUrl: objectPath, isPrimary: true });
    expect(objectStorageMocks.validateProviderImageObject).toHaveBeenCalledWith(stagedObjectPath);
    expect(objectStorageMocks.promoteProviderImageObject).toHaveBeenCalledWith(stagedObjectPath);
    expect(objectStorageMocks.trySetObjectEntityAclPolicy).toHaveBeenCalledWith(
      objectPath,
      { owner: "provider-owner", visibility: "public" },
    );
    expect(storage.addProviderImage).toHaveBeenCalledWith(expect.objectContaining({
      providerId: 7,
      imageUrl: objectPath,
      isPrimary: true,
    }));
  });

  it("does not issue an upload URL to a user who does not own the provider", async () => {
    const response = await request(buildApp())
      .post("/api/provider-images/upload")
      .set("x-test-user", "legacy-owner")
      .send({ providerId: 7 });

    expect(response.status).toBe(403);
    expect(objectStorageMocks.getProviderImageUploadURL).not.toHaveBeenCalled();
  });

  it("rejects invalid stored image metadata and removes the temporary object", async () => {
    objectStorageMocks.validateProviderImageObject.mockRejectedValue(
      new ProviderImageValidationError("Image files must be 5MB or smaller"),
    );
    const app = buildApp();

    const response = await request(app)
      .post("/api/providers/7/images")
      .set("x-test-user", "provider-owner")
      .send({
        objectPath: stagedObjectPath,
        uploadToken: createProviderImageUploadToken("provider-owner", stagedObjectPath, 7),
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ ok: false, message: "Invalid image data" });
    expect(storage.addProviderImage).not.toHaveBeenCalled();
    expect(objectStorageMocks.deleteObjectEntity).toHaveBeenCalledWith(stagedObjectPath);
  });

  it("queues a promoted object for durable cleanup when finalization and immediate cleanup both fail", async () => {
    objectStorageMocks.trySetObjectEntityAclPolicy.mockRejectedValueOnce(new Error("ACL service unavailable"));
    objectStorageMocks.deleteObjectEntity.mockRejectedValueOnce(new Error("storage unavailable"));

    const response = await request(buildApp())
      .post("/api/providers/7/images")
      .set("x-test-user", "provider-owner")
      .send({
        objectPath: stagedObjectPath,
        uploadToken: createProviderImageUploadToken("provider-owner", stagedObjectPath, 7),
      });

    expect(response.status).toBe(500);
    expect(storage.addProviderImage).not.toHaveBeenCalled();
    expect(storage.queueProviderImageCleanup).toHaveBeenCalledWith(objectPath);
    expect(objectStorageMocks.deleteObjectEntity).toHaveBeenCalledWith(objectPath);
    expect(storage.completeProviderImageCleanupByObjectPath).not.toHaveBeenCalled();
  });

  it("rejects image writes from a former or unrelated provider owner", async () => {
    const response = await request(buildApp())
      .post("/api/providers/7/images")
      .set("x-test-user", "legacy-owner")
      .send({
        objectPath: stagedObjectPath,
        uploadToken: createProviderImageUploadToken("legacy-owner", stagedObjectPath, 7),
      });

    expect(response.status).toBe(403);
    expect(storage.addProviderImage).not.toHaveBeenCalled();
  });

  it("returns a visibility-checked public image URL in provider detail and search data", async () => {
    vi.mocked(storage.getProviderWithDetails).mockResolvedValue({
      ...provider(),
      images: [image()],
      reviews: [],
    } as any);
    vi.mocked(storage.getProviders).mockResolvedValue([provider()] as any);
    vi.mocked(storage.getProviderImages).mockResolvedValue([image()] as any);
    const app = buildApp();

    const [detail, search] = await Promise.all([
      request(app).get("/api/providers/7"),
      request(app).get("/api/providers"),
    ]);

    const publicUrl = "/api/providers/7/images/19/content";
    expect(detail.status).toBe(200);
    expect(detail.body.images).toEqual([expect.objectContaining({ imageUrl: publicUrl })]);
    expect(search.status).toBe(200);
    expect(search.body[0].images).toEqual([expect.objectContaining({ imageUrl: publicUrl })]);
  });

  it("serves public image listings and stored content without authentication", async () => {
    vi.mocked(storage.getProviderImages).mockResolvedValue([image()] as any);
    vi.mocked(storage.getProviderImage).mockResolvedValue(image() as any);
    const objectFile = { path: objectPath };
    objectStorageMocks.getObjectEntityFile.mockResolvedValue(objectFile);
    objectStorageMocks.downloadObject.mockImplementation((_file, res) => {
      res.status(204).end();
    });
    const app = buildApp();

    const listing = await request(app).get("/api/providers/7/images");
    const content = await request(app).get("/api/providers/7/images/19/content");

    expect(listing.status).toBe(200);
    expect(listing.body).toEqual([expect.objectContaining({
      id: 19,
      imageUrl: "/api/providers/7/images/19/content",
    })]);
    expect(content.status).toBe(204);
    expect(objectStorageMocks.getObjectEntityFile).toHaveBeenCalledWith(objectPath);
    expect(objectStorageMocks.downloadObject).toHaveBeenCalledWith(objectFile, expect.anything());
  });

  it("does not expose image listings or content for hidden providers or another provider's image", async () => {
    const app = buildApp();

    vi.mocked(storage.getProvider).mockResolvedValueOnce(provider({ isProfilePublic: false }) as any);
    const hiddenListing = await request(app).get("/api/providers/7/images");
    expect(hiddenListing.status).toBe(404);

    vi.mocked(storage.getProvider).mockResolvedValueOnce(provider({ isProfilePublic: false }) as any);
    const hiddenContent = await request(app).get("/api/providers/7/images/19/content");
    expect(hiddenContent.status).toBe(404);
    expect(objectStorageMocks.getObjectEntityFile).not.toHaveBeenCalled();
    expect(objectStorageMocks.downloadObject).not.toHaveBeenCalled();

    vi.mocked(storage.getProvider).mockResolvedValue(provider() as any);
    vi.mocked(storage.getProviderImage).mockResolvedValue(image({ providerId: 8 }) as any);
    const crossProviderContent = await request(app).get("/api/providers/7/images/19/content");
    expect(crossProviderContent.status).toBe(404);
    expect(objectStorageMocks.getObjectEntityFile).not.toHaveBeenCalled();
  });

  it("redirects legacy external image URLs through the public content endpoint", async () => {
    vi.mocked(storage.getProviderImage).mockResolvedValue(
      image({ imageUrl: "https://cdn.example.test/provider-photo.jpg" }) as any,
    );

    const response = await request(buildApp()).get("/api/providers/7/images/19/content");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("https://cdn.example.test/provider-photo.jpg");
    expect(objectStorageMocks.getObjectEntityFile).not.toHaveBeenCalled();
  });

  it("deletes the database record and its stored object, while rejecting cross-provider image IDs", async () => {
    vi.mocked(storage.getProviderImage).mockResolvedValue(image() as any);
    vi.mocked(storage.deleteProviderImageWithCleanup).mockResolvedValue(image() as any);
    const app = buildApp();

    const deleted = await request(app)
      .delete("/api/providers/7/images/19")
      .set("x-test-user", "provider-owner");

    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({ ok: true, cleanupPending: false });
    expect(storage.deleteProviderImageWithCleanup).toHaveBeenCalledWith(19);
    expect(objectStorageMocks.deleteObjectEntity).toHaveBeenCalledWith(objectPath);

    vi.mocked(storage.getProviderImage).mockResolvedValue(image({ providerId: 8 }) as any);
    const crossProvider = await request(app)
      .delete("/api/providers/7/images/19")
      .set("x-test-user", "provider-owner");
    expect(crossProvider.status).toBe(404);
  });

  it("keeps a durable cleanup handoff when immediate object deletion fails", async () => {
    vi.mocked(storage.getProviderImage).mockResolvedValue(image() as any);
    vi.mocked(storage.deleteProviderImageWithCleanup).mockResolvedValue(image() as any);
    objectStorageMocks.deleteObjectEntity.mockRejectedValueOnce(new Error("storage unavailable"));

    const response = await request(buildApp())
      .delete("/api/providers/7/images/19")
      .set("x-test-user", "provider-owner");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, cleanupPending: true });
    expect(storage.deleteProviderImageWithCleanup).toHaveBeenCalledWith(19);
  });
});