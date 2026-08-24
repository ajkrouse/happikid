import type { Express } from "express";
import { intelligentSearch } from "../intelligentSearch";
import { apiError } from "../lib/apiError";
import { z } from "zod";
import { createLogger } from "../logger";

const log = createLogger("meta");

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
});

export function registerMetaRoutes(app: Express): void {
  app.get("/api/search/test", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return apiError(res, 400, 'Query parameter "q" is required');
    }
    try {
      const parsed = intelligentSearch.parseQuery(q);
      res.json({
        query: q,
        parsed,
        explanation: intelligentSearch.explainParsing(parsed),
        synonyms: intelligentSearch.expandSynonyms(q),
      });
    } catch (error) {
      log.error({ err: error }, "Error testing search");
      apiError(res, 500, "Failed to parse search query");
    }
  });

  app.get("/api/meta/features", async (_req, res) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path");
      const featuresPath = path.join(__dirname, "..", "meta", "feature_registry.json");
      res.json(JSON.parse(fs.readFileSync(featuresPath, "utf8")));
    } catch (error) {
      log.error({ err: error }, "Error loading feature registry");
      apiError(res, 500, "Failed to load features");
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, "Invalid contact form data", { errors: parsed.error.errors });
      }
      // Do not log contact names, email addresses, subjects, or message text.
      log.info("Contact form submission received");
      res.json({ success: true });
    } catch (error) {
      log.error({ err: error }, "Error processing contact form");
      apiError(res, 500, "Failed to process contact form");
    }
  });
}
