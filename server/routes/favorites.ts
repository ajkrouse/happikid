import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { createLogger } from "../logger";

const log = createLogger("favorites");

export function registerFavoriteRoutes(app: Express): void {
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getFavoritesByUserId(req.user!.id));
    } catch (error) {
      log.error({ err: error }, "Error fetching favorites");
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      res.status(201).json(await storage.addFavorite(req.user!.id, parseInt(req.params.providerId)));
    } catch (error) {
      log.error({ err: error }, "Error adding favorite");
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      await storage.removeFavorite(req.user!.id, parseInt(req.params.providerId));
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, "Error removing favorite");
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites/:providerId/check", isAuthenticated, async (req: any, res) => {
    try {
      res.json({ isFavorite: await storage.isFavorite(req.user!.id, parseInt(req.params.providerId)) });
    } catch (error) {
      log.error({ err: error }, "Error checking favorite");
      res.status(500).json({ message: "Failed to check favorite" });
    }
  });
}
