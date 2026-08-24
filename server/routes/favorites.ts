import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { strictPathInt } from "../lib/pathParams";
import { apiError } from "../lib/apiError";
import { createLogger } from "../logger";

const log = createLogger("favorites");

export function registerFavoriteRoutes(app: Express): void {
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getFavoritesByUserId(req.user?.claims?.sub));
    } catch (error) {
      log.error({ err: error }, "Error fetching favorites");
      apiError(res, 500, "Failed to fetch favorites");
    }
  });

  app.post("/api/favorites/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.providerId);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      // Retries and concurrent requests return the canonical bookmark instead
      // of surfacing the unique-key conflict.
      const result = await storage.addFavorite(req.user?.claims?.sub, providerId);
      res.status(result.created ? 201 : 200).json(result.favorite);
    } catch (error) {
      log.error({ err: error }, "Error adding favorite");
      apiError(res, 500, "Failed to add favorite");
    }
  });

  app.delete("/api/favorites/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.providerId);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      await storage.removeFavorite(req.user?.claims?.sub, providerId);
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, "Error removing favorite");
      apiError(res, 500, "Failed to remove favorite");
    }
  });

  app.get("/api/favorites/:providerId/check", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.providerId);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      res.json({ isFavorite: await storage.isFavorite(req.user?.claims?.sub, providerId) });
    } catch (error) {
      log.error({ err: error }, "Error checking favorite");
      apiError(res, 500, "Failed to check favorite");
    }
  });
}
