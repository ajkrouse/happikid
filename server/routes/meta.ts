import type { Express } from "express";
import { intelligentSearch } from "../intelligentSearch";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
});

export function registerMetaRoutes(app: Express): void {
  // Intelligent search parser introspection (dev/debug)
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
      console.error("Error testing search:", error);
      res.status(500).json({ error: "Failed to parse search query" });
    }
  });

  // Feature registry
  app.get("/api/meta/features", async (_req, res) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path");
      const featuresPath = path.join(__dirname, "..", "meta", "feature_registry.json");
      res.json(JSON.parse(fs.readFileSync(featuresPath, "utf8")));
    } catch (error) {
      console.error("Error loading feature registry:", error);
      res.status(500).json({ message: "Failed to load features" });
    }
  });

  // Contact form
  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid contact form data", errors: parsed.error.errors });
      }
      const { name, email, subject, message } = parsed.data;
      console.log(`[CONTACT FORM] From: ${name} <${email}> | Subject: ${subject} | Message: ${message}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Failed to process contact form" });
    }
  });
}
