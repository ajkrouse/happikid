import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { z } from "zod";
import { createLogger } from "../logger";

const log = createLogger("auth");

const userPreferencesSchema = z.object({
  zipCode: z.string().optional(),
  childAges: z.string().optional(),
  careType: z.enum(["daycare", "afterschool", "camp", "school"]).optional(),
});

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getUser(req.user.claims.sub));
    } catch (error) {
      log.error({ err: error }, "Error fetching user");
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const { role } = req.body;
      if (!["parent", "provider"].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be "parent" or "provider".' });
      }
      res.json(await storage.updateUserRole(req.user.claims.sub, role));
    } catch (error) {
      log.error({ err: error }, "Error updating user role");
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post("/api/user/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = userPreferencesSchema.parse(req.body);
      log.info({ userId, preferences }, "Saving user preferences");
      res.json({ success: true, message: "Preferences saved successfully", preferences });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid preferences data", errors: error.errors });
      log.error({ err: error }, "Error saving user preferences");
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });
}
