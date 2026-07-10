import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export function registerFavoriteRoutes(app: Express): void {
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getFavoritesByUserId(req.user!.id));
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      res.status(201).json(await storage.addFavorite(req.user!.id, parseInt(req.params.providerId)));
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      await storage.removeFavorite(req.user!.id, parseInt(req.params.providerId));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites/:providerId/check", isAuthenticated, async (req: any, res) => {
    try {
      res.json({ isFavorite: await storage.isFavorite(req.user!.id, parseInt(req.params.providerId)) });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite" });
    }
  });
}
