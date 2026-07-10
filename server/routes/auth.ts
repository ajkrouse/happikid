import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { z } from "zod";

const userPreferencesSchema = z.object({
  zipCode: z.string().optional(),
  childAges: z.string().optional(),
  careType: z.enum(["daycare", "afterschool", "camp", "school"]).optional(),
});

export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getUser(req.user.claims.sub));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Promote user role (parent → provider)
  app.patch("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const { role } = req.body;
      if (!["parent", "provider"].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be "parent" or "provider".' });
      }
      res.json(await storage.updateUserRole(req.user.claims.sub, role));
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Save user search/care preferences
  app.post("/api/user/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = userPreferencesSchema.parse(req.body);
      console.log(`Saving preferences for user ${userId}:`, preferences);
      res.json({ success: true, message: "Preferences saved successfully", preferences });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid preferences data", errors: error.errors });
      console.error("Error saving user preferences:", error);
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });
}
