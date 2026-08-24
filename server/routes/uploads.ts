import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { apiError } from "../lib/apiError";
import { createLogger } from "../logger";
import { createProviderImageUploadToken } from "../lib/providerImageUpload";
import { storage } from "../storage";
import { strictPathInt } from "../lib/pathParams";
import { isCanonicalProviderOwner } from "../lib/providerAccess";
import { providerImageUploadLimiter } from "../middleware/rateLimiter";

const log = createLogger("uploads");

export function registerUploadRoutes(app: Express): void {
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const svc = new ObjectStorageService();
      const file = await svc.searchPublicObject(req.params.filePath);
      if (!file) return apiError(res, 404, "File not found");
      svc.downloadObject(file, res);
    } catch (error) {
      log.error({ err: error }, "Error searching for public object");
      apiError(res, 500, "Internal server error");
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    try {
      const { ObjectStorageService, ObjectPermission } = await import("../objectStorage");
      const svc = new ObjectStorageService();
      const objectFile = await svc.getObjectEntityFile(req.path);
      const canAccess = await svc.canAccessObjectEntity({
        objectFile, userId, requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) return apiError(res, 401, "Access denied");
      svc.downloadObject(objectFile, res);
    } catch (error) {
      log.error({ err: error }, "Error checking object access");
      const { ObjectNotFoundError } = await import("../objectStorage");
      if (error instanceof ObjectNotFoundError) return apiError(res, 404, "File not found");
      apiError(res, 500, "Internal server error");
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (_req, res) => {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const svc = new ObjectStorageService();
      res.json({ uploadURL: await svc.getObjectEntityUploadURL() });
    } catch (error) {
      log.error({ err: error }, "Error getting upload URL");
      apiError(res, 500, "Failed to get upload URL");
    }
  });

  app.post("/api/provider-images/upload", isAuthenticated, providerImageUploadLimiter, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return apiError(res, 401, "Unauthorized");
      const providerId = strictPathInt(req.body?.providerId);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isCanonicalProviderOwner(provider, userId)) return apiError(res, 403, "Access denied");
      const { ObjectStorageService } = await import("../objectStorage");
      const upload = await new ObjectStorageService().getProviderImageUploadURL();
      res.json({
        ...upload,
        uploadToken: createProviderImageUploadToken(userId, upload.objectPath, providerId),
        maxFileSize: 5 * 1024 * 1024,
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      });
    } catch (error) {
      log.error({ err: error }, "Error preparing provider image upload");
      apiError(res, 500, "Failed to prepare image upload");
    }
  });

  app.delete("/api/provider-images/upload", isAuthenticated, async (req: any, res) => {
    try {
      const { objectPath, uploadToken } = req.body ?? {};
      const providerId = strictPathInt(req.body?.providerId);
      const userId = req.user?.claims?.sub;
      const { verifyProviderImageUploadToken } = await import("../lib/providerImageUpload");
      const provider = providerId ? await storage.getProvider(providerId) : undefined;
      if (
        !userId ||
        !providerId ||
        !provider ||
        !isCanonicalProviderOwner(provider, userId) ||
        !verifyProviderImageUploadToken(uploadToken, userId, objectPath, providerId)
      ) {
        return apiError(res, 400, "Invalid upload reference");
      }
      const { ObjectStorageService } = await import("../objectStorage");
      await new ObjectStorageService().deleteObjectEntity(objectPath);
      res.status(204).end();
    } catch (error) {
      log.error({ err: error }, "Error cleaning up provider image upload");
      apiError(res, 500, "Failed to clean up image upload");
    }
  });
}
