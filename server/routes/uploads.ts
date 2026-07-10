import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";

export function registerUploadRoutes(app: Express): void {
  // Serve public object storage files
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const svc = new ObjectStorageService();
      const file = await svc.searchPublicObject(req.params.filePath);
      if (!file) return res.status(404).json({ error: "File not found" });
      svc.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private/ACL-gated objects
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    try {
      const { ObjectStorageService, ObjectNotFoundError, ObjectPermission } = await import("../objectStorage");
      const svc = new ObjectStorageService();
      const objectFile = await svc.getObjectEntityFile(req.path);
      const canAccess = await svc.canAccessObjectEntity({
        objectFile, userId, requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) return res.sendStatus(401);
      svc.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      const { ObjectNotFoundError } = await import("../objectStorage");
      if (error instanceof ObjectNotFoundError) return res.sendStatus(404);
      res.sendStatus(500);
    }
  });

  // Get a pre-signed upload URL
  app.post("/api/objects/upload", isAuthenticated, async (_req, res) => {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const svc = new ObjectStorageService();
      res.json({ uploadURL: await svc.getObjectEntityUploadURL() });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
}
