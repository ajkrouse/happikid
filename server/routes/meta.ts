import type { Express } from "express";
import { intelligentSearch } from "../intelligentSearch";
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
      return res.status(400).json({ error: 'Query parameter "q" is required' });
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
      res.status(500).json({ error: "Failed to parse search query" });
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
      res.status(500).json({ message: "Failed to load features" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid contact form data", errors: parsed.error.errors });
      }
      const { name, email, subject, message } = parsed.data;
      log.info({ name, email, subject }, "Contact form submission");
      res.json({ success: true });
    } catch (error) {
      log.error({ err: error }, "Error processing contact form");
      res.status(500).json({ message: "Failed to process contact form" });
    }
  });
}
