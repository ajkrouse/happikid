import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { inquiryLimiter } from "../middleware/rateLimiter";
import { inquiryClientCreateSchema } from "@shared/schema";
import { strictPathInt } from "../lib/pathParams";
import { z } from "zod";
import { createLogger } from "../logger";

const log = createLogger("inquiries");

export function registerInquiryRoutes(app: Express): void {
  app.get("/api/inquiries/provider/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.providerId);
      if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });
      const provider = await storage.getProvider(providerId);
      if (!provider || provider.userId !== req.user?.claims?.sub) return res.status(403).json({ message: "Access denied" });
      res.json(await storage.getInquiriesByProviderId(providerId));
    } catch (error) {
      log.error({ err: error }, "Error fetching inquiries");
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/inquiries/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getInquiriesByUserId(req.user?.claims?.sub));
    } catch (error) {
      log.error({ err: error }, "Error fetching user inquiries");
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/inquiries/provider", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getProvidersByUserId(req.user?.claims?.sub);
      if (providers.length === 0) return res.json([]);
      res.json(await storage.getInquiriesByProviderId(providers[0].id));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider inquiries");
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.post("/api/inquiries", inquiryLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      // Use client-safe schema to strip userId/status from request body,
      // then enforce server-side values for those fields.
      const clientData = inquiryClientCreateSchema.parse(req.body);
      const inquiryData = { ...clientData, userId, status: "pending" as const };
      res.status(201).json(await storage.createInquiry(inquiryData));
    } catch (error) {
      log.error({ err: error }, "Error creating inquiry");
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  const updateInquiryStatusSchema = z.object({
    status: z.enum(["pending", "responded", "closed"]),
  });

  app.patch("/api/inquiries/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const inquiryId = strictPathInt(req.params.id);
      if (!inquiryId) return res.status(400).json({ message: "Invalid inquiry ID" });

      const parsed = updateInquiryStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid status", errors: parsed.error.errors });
      }

      // Only the provider that owns this inquiry may update its status
      const inquiry = await storage.getInquiry(inquiryId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      const provider = await storage.getProvider(inquiry.providerId);
      if (!provider || provider.userId !== req.user?.claims?.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(await storage.updateInquiryStatus(inquiryId, parsed.data.status));
    } catch (error) {
      log.error({ err: error }, "Error updating inquiry status");
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });
}
