import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertInquirySchema } from "@shared/schema";
import { z } from "zod";

export function registerInquiryRoutes(app: Express): void {
  // Get inquiries for a specific provider (provider owner only)
  app.get("/api/inquiries/provider/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.providerId);
      const provider = await storage.getProvider(providerId);
      if (!provider || provider.userId !== req.user!.id) return res.status(403).json({ message: "Access denied" });
      res.json(await storage.getInquiriesByProviderId(providerId));
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Get all inquiries submitted by the current user
  app.get("/api/inquiries/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getInquiriesByUserId(req.user!.id));
    } catch (error) {
      console.error("Error fetching user inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Get all inquiries for the current user's provider listing
  app.get("/api/inquiries/provider", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getProvidersByUserId(req.user!.id);
      if (providers.length === 0) return res.json([]);
      res.json(await storage.getInquiriesByProviderId(providers[0].id));
    } catch (error) {
      console.error("Error fetching provider inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Submit a new inquiry (public — also works for anonymous users)
  app.post("/api/inquiries", async (req: any, res) => {
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
      console.error("Error creating inquiry:", error);
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Update inquiry status
  app.patch("/api/inquiries/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "responded", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      res.json(await storage.updateInquiryStatus(parseInt(req.params.id), status));
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });
}
