import type { Express } from "express";
import { storage } from "../storage";
import { createLogger } from "../logger";

const log = createLogger("taxonomy");

export function registerTaxonomyRoutes(app: Express): void {
  app.get("/api/taxonomy/after-school-programs", async (_req, res) => {
    try {
      res.json({ afterSchoolPrograms: await storage.getAfterSchoolTaxonomy() });
    } catch (error) {
      log.error({ err: error }, "Error fetching taxonomy");
      res.status(500).json({ message: "Failed to fetch after-school programs taxonomy" });
    }
  });
}
