import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertFamilyProfileSchema, familyProfileClientUpdateSchema } from "@shared/schema";
import { apiError } from "../lib/apiError";
import { z } from "zod";
import { createLogger } from "../logger";

const log = createLogger("family");

export function registerFamilyRoutes(app: Express): void {
  app.get("/api/family-profile", isAuthenticated, async (req: any, res) => {
    try {
      res.json((await storage.getFamilyProfile(req.user.claims.sub)) || null);
    } catch (error) {
      log.error({ err: error }, "Error fetching family profile");
      apiError(res, 500, "Failed to fetch family profile");
    }
  });

  app.post("/api/family-profile", isAuthenticated, async (req: any, res) => {
    try {
      // Parse client fields via the safe schema (strips userId, isComplete, completedSteps),
      // then enforce userId from the authenticated session.
      const clientData = familyProfileClientUpdateSchema.parse(req.body);
      const profileData = insertFamilyProfileSchema.parse({ ...clientData, userId: req.user.claims.sub });
      res.json(await storage.upsertFamilyProfile(profileData));
    } catch (error) {
      log.error({ err: error }, "Error saving family profile");
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid family profile data", { errors: error.errors });
      apiError(res, 500, "Failed to save family profile");
    }
  });

  app.patch("/api/family-profile", isAuthenticated, async (req: any, res) => {
    try {
      // familyProfileClientUpdateSchema strips userId, isComplete, and completedSteps;
      // userId is enforced server-side from the authenticated session.
      const profileData = familyProfileClientUpdateSchema.partial().parse(req.body);
      res.json(await storage.updateFamilyProfile(req.user.claims.sub, profileData));
    } catch (error) {
      log.error({ err: error }, "Error updating family profile");
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid family profile data", { errors: error.errors });
      apiError(res, 500, "Failed to update family profile");
    }
  });
}
