import type { Express } from "express";
import { storage } from "../storage";
import { apiError } from "../lib/apiError";
import { createLogger } from "../logger";

const log = createLogger("taxonomy");

export function registerTaxonomyRoutes(app: Express): void {
  app.get("/api/taxonomy/after-school-programs", async (_req, res) => {
    try {
      res.json({ afterSchoolPrograms: await storage.getAfterSchoolTaxonomy() });
    } catch (error) {
      log.error({ err: error }, "Error fetching taxonomy");
      apiError(res, 500, "Failed to fetch after-school programs taxonomy");
    }
  });
}
