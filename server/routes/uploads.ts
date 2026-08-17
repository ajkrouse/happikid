import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { apiError } from "../lib/apiError";
import { createLogger } from "../logger";

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
}
