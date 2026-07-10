import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export function registerFamilyRoutes(app: Express): void {
  app.get("/api/family-profile", isAuthenticated, async (req: any, res) => {
    try {
      res.json((await storage.getFamilyProfile(req.user.claims.sub)) || null);
    } catch (error) {
      console.error("Error fetching family profile:", error);
      res.status(500).json({ message: "Failed to fetch family profile" });
    }
  });

  app.post("/api/family-profile", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.upsertFamilyProfile({ ...req.body, userId: req.user.claims.sub }));
    } catch (error) {
      console.error("Error saving family profile:", error);
      res.status(500).json({ message: "Failed to save family profile" });
    }
  });

  app.patch("/api/family-profile", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.updateFamilyProfile(req.user.claims.sub, req.body));
    } catch (error) {
      console.error("Error updating family profile:", error);
      res.status(500).json({ message: "Failed to update family profile" });
    }
  });
}
