import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { createLogger } from "../logger";

const log = createLogger("uploads");

export function registerUploadRoutes(app: Express): void {
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const svc = new ObjectStorageService();
      const file = await svc.searchPublicObject(req.params.filePath);
      if (!file) return res.status(404).json({ message: "File not found" });
      svc.downloadObject(file, res);
    } catch (error) {
      log.error({ err: error }, "Error searching for public object");
      res.status(500).json({ message: "Internal server error" });
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
      if (!canAccess) return res.sendStatus(401);
      svc.downloadObject(objectFile, res);
    } catch (error) {
      log.error({ err: error }, "Error checking object access");
      const { ObjectNotFoundError } = await import("../objectStorage");
      if (error instanceof ObjectNotFoundError) return res.sendStatus(404);
      res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (_req, res) => {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const svc = new ObjectStorageService();
      res.json({ uploadURL: await svc.getObjectEntityUploadURL() });
    } catch (error) {
      log.error({ err: error }, "Error getting upload URL");
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });
}
