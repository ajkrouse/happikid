import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { apiError } from "../lib/apiError";
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
      apiError(res, 500, "Failed to fetch user");
    }
  });

  const updateRoleSchema = z.object({
    role: z.enum(["parent", "provider"], { errorMap: () => ({ message: 'Invalid role. Must be "parent" or "provider".' }) }),
  });

  app.patch("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = updateRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, parsed.error.errors[0].message);
      }
      res.json(await storage.updateUserRole(req.user.claims.sub, parsed.data.role));
    } catch (error) {
      log.error({ err: error }, "Error updating user role");
      apiError(res, 500, "Failed to update user role");
    }
  });

  app.post("/api/user/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = userPreferencesSchema.parse(req.body);
      log.info("Saving user preferences");
      res.json({ success: true, message: "Preferences saved successfully", preferences });
    } catch (error) {
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid preferences data", { errors: error.errors });
      log.error({ err: error }, "Error saving user preferences");
      apiError(res, 500, "Failed to save preferences");
    }
  });
}
