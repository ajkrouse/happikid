import type { Express } from "express";
import { storage } from "../storage";

export function registerTaxonomyRoutes(app: Express): void {
  app.get("/api/taxonomy/after-school-programs", async (_req, res) => {
    try {
      res.json({ afterSchoolPrograms: await storage.getAfterSchoolTaxonomy() });
    } catch (error) {
      console.error("Error fetching taxonomy:", error);
      res.status(500).json({ message: "Failed to fetch after-school programs taxonomy" });
    }
  });
}
