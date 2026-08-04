import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { inquiryLimiter } from "../middleware/rateLimiter";
import { insertInquirySchema } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../logger";

const log = createLogger("inquiries");

export function registerInquiryRoutes(app: Express): void {
  app.get("/api/inquiries/provider/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.providerId);
      const provider = await storage.getProvider(providerId);
      if (!provider || provider.userId !== req.user!.id) return res.status(403).json({ message: "Access denied" });
      res.json(await storage.getInquiriesByProviderId(providerId));
    } catch (error) {
      log.error({ err: error }, "Error fetching inquiries");
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/inquiries/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getInquiriesByUserId(req.user!.id));
    } catch (error) {
      log.error({ err: error }, "Error fetching user inquiries");
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/inquiries/provider", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getProvidersByUserId(req.user!.id);
      if (providers.length === 0) return res.json([]);
      res.json(await storage.getInquiriesByProviderId(providers[0].id));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider inquiries");
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.post("/api/inquiries", inquiryLimiter, async (req: any, res) => {
    try {
      const userId = req.user?.id || "anonymous";
      const { parentName, parentEmail, providerId, message } = req.body;
      if (!parentName || !parentEmail || !providerId || !message) {
        return res.status(400).json({
          message: "Missing required fields: parentName, parentEmail, providerId, and message are required",
        });
      }
      const inquiryData = insertInquirySchema.parse({ ...req.body, userId });
      res.status(201).json(await storage.createInquiry(inquiryData));
    } catch (error) {
      log.error({ err: error }, "Error creating inquiry");
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.patch("/api/inquiries/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "responded", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      res.json(await storage.updateInquiryStatus(parseInt(req.params.id), status));
    } catch (error) {
      log.error({ err: error }, "Error updating inquiry status");
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });
}
